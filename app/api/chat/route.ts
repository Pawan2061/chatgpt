import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Chat, IMessage } from "@/lib/models/chat";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import { addMemory, prepareContextWithMemory } from "@/lib/mem0";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "User not authenticated",
        }),
        { status: 401 }
      );
    }

    const userId = user.id;
    const { messages, chatId, files, isEdit } = await req.json();

    console.log("=== Chat API Request ===");
    console.log("ChatId:", chatId);
    console.log("Messages received:", messages?.length || 0);
    console.log("Files:", files?.length || 0);
    console.log("User ID:", userId);
    console.log("Is Edit:", isEdit);

    await connectDB();

    let chat;
    let actualChatId: string = "";

    if (chatId && /^[0-9a-fA-F]{24}$/.test(chatId)) {
      actualChatId = chatId;
      chat = await Chat.findOne({ _id: actualChatId, userId });
      console.log(
        "Found existing chat:",
        !!chat,
        "with",
        chat?.messages?.length || 0,
        "messages"
      );
    }

    if (!chat) {
      if (chatId && /^[0-9a-fA-F]{24}$/.test(chatId)) {
        actualChatId = chatId;
      } else {
        actualChatId = new mongoose.Types.ObjectId().toString();
      }

      console.log("Creating new chat with ID:", actualChatId);

      try {
        chat = new Chat({
          _id: new mongoose.Types.ObjectId(actualChatId),
          userId,
          messages: [],
          title: "New Chat",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await chat.save();
        console.log("New chat created successfully");
      } catch (error: unknown) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 11000
        ) {
          console.log("Duplicate key detected, generating new ObjectId");
          actualChatId = new mongoose.Types.ObjectId().toString();
          chat = new Chat({
            _id: new mongoose.Types.ObjectId(actualChatId),
            userId,
            messages: [],
            title: "New Chat",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await chat.save();
          console.log("New chat created with fresh ObjectId:", actualChatId);
        } else {
          throw error;
        }
      }
    }

    const currentUserMessage =
      messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const messageContent = currentUserMessage?.content || "";
    const hasFiles = files && Array.isArray(files) && files.length > 0;

    if (!messageContent.trim() && !hasFiles) {
      return new Response(
        JSON.stringify({
          error: "Empty message",
          details: "Please provide text or files",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const finalMessageContent = messageContent;
    const imageFiles: string[] = [];
    const documentContext: string[] = [];

    if (hasFiles) {
      for (const file of files) {
        if (file.type === "image") {
          imageFiles.push(file.url);
        } else if (file.type === "document" && file.extractedContent) {
          documentContext.push(
            `Document "${file.name}":\n${file.extractedContent}`
          );
        }
      }
    }

    const userMessage: IMessage = {
      role: "user",
      content: finalMessageContent || "Please analyze the uploaded files",
      files: files?.map((f: { url: string }) => f.url) || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isEdit) {
      chat.messages.push(userMessage);
    }

    if (chat.title === "New Chat" && messageContent.trim()) {
      chat.title =
        messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : "");
    }

    console.log(
      "User message added. Total messages in chat:",
      chat.messages.length
    );

    const hasImages = imageFiles.length > 0;
    const modelToUse = hasImages ? "gpt-4o" : "gpt-4-turbo";

    console.log("=== Context Window Management ===");
    console.log("Using model:", modelToUse);
    console.log("Has images:", hasImages);

    // Prepare messages for context window management
    const messagesToProcess = isEdit ? messages : chat.messages;

    const recentMessages = messagesToProcess.map((msg: IMessage) => ({
      role: msg.role,
      content: msg.content,
      files: msg.files,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    let contextMessages;
    try {
      contextMessages = await prepareContextWithMemory(
        finalMessageContent,
        recentMessages,
        userId,
        modelToUse
      );
      console.log(
        "Context prepared successfully with",
        contextMessages.length,
        "messages"
      );
    } catch (error) {
      console.error(
        "Error in context preparation, falling back to simple logic:",
        error
      );

      const fallbackMessages = isEdit ? messages : chat.messages.slice(-10);
      contextMessages = [
        {
          role: "system",
          content:
            "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown. When analyzing images, provide detailed and helpful descriptions and answers.",
        },
        ...fallbackMessages.map((msg: IMessage) => ({
          role: msg.role,
          content: msg.content,
        })),
      ];
    }

    if (documentContext.length > 0 || hasImages) {
      const systemMessageIndex = contextMessages.findIndex(
        (msg) => msg.role === "system"
      );
      if (systemMessageIndex !== -1) {
        let systemContent = contextMessages[systemMessageIndex].content;

        if (documentContext.length > 0) {
          systemContent += `\n\nThe user has uploaded the following documents for analysis:\n\n${documentContext.join(
            "\n\n"
          )}\n\nUse this document content to answer the user's questions about the uploaded files.`;
        }

        contextMessages[systemMessageIndex].content = systemContent;
      }

      if (hasImages) {
        const lastMessage = contextMessages[contextMessages.length - 1];
        if (lastMessage && lastMessage.role === "user") {
          const parts: Array<{ type: string; text?: string; image?: string }> =
            [];

          if (lastMessage.content.trim()) {
            parts.push({ type: "text", text: lastMessage.content });
          }

          imageFiles.forEach((imageUrl: string) => {
            parts.push({
              type: "image",
              image: imageUrl,
            });
          });

          lastMessage.content = parts;
        }
      }
    }

    console.log("Final context messages count:", contextMessages.length);

    const response = await streamText({
      model: openai(modelToUse),
      messages: contextMessages,
      temperature: 0.7,
      maxTokens: 4000,
      onFinish: async (result) => {
        try {
          console.log("=== Response Finished ===");
          console.log("Assistant response length:", result.text.length);

          const assistantMessage: IMessage = {
            role: "assistant",
            content: result.text,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const updatedChat = await Chat.findOne({ _id: actualChatId, userId });
          if (updatedChat) {
            if (isEdit && messages && messages.length > 0) {
              updatedChat.messages = messages.map(
                (msg: {
                  role: string;
                  content: string;
                  files?: string[];
                  createdAt?: Date;
                }) => ({
                  role: msg.role,
                  content: msg.content,
                  files: msg.files || [],
                  createdAt: msg.createdAt || new Date(),
                  updatedAt: new Date(),
                })
              );
            }

            updatedChat.messages.push(assistantMessage);
            updatedChat.updatedAt = new Date();
            await updatedChat.save();
            console.log(
              "Assistant message saved. Total messages now:",
              updatedChat.messages.length
            );

            console.log("=== Adding to Memory ===");
            const conversationContext = `User asked: "${finalMessageContent}"\nAssistant responded: "${
              result.text
            }"\nContext: Chat about ${
              hasFiles ? "files/documents" : "general topics"
            }${hasImages ? " with images" : ""}`;

            await addMemory(conversationContext, {
              userId,
              chatId: actualChatId,
              metadata: {
                timestamp: new Date().toISOString(),
                messageCount: updatedChat.messages.length,
                hasFiles: hasFiles,
                hasImages: hasImages,
                userQuery: finalMessageContent.slice(0, 100),
                responseLength: result.text.length,
              },
            });
          }
        } catch (error) {
          console.error("Error saving assistant response:", error);
        }
      },
    });

    try {
      await chat.save();
      console.log("Chat saved with user message");
    } catch (error) {
      console.error("Error saving chat:", error);
    }

    return response.toDataStreamResponse({
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
