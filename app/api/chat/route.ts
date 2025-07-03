import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Chat, IMessage } from "@/lib/models/chat";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import { addMemory, searchMemories } from "@/lib/mem0";
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
    const { messages, chatId, files } = await req.json();

    console.log("=== Chat API Request ===");
    console.log("ChatId:", chatId);
    console.log("Messages received:", messages?.length || 0);
    console.log("Files:", files?.length || 0);
    console.log("User ID:", userId);

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

    let finalMessageContent = messageContent;
    const imageFiles: string[] = [];

    if (hasFiles) {
      for (const file of files) {
        if (file.type === "image") {
          imageFiles.push(file.url);
        } else if (file.type === "document" && file.extractedContent) {
          finalMessageContent += `\n\n--- Document: ${file.name} ---\n${file.extractedContent}\n--- End of Document ---`;
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

    chat.messages.push(userMessage);

    if (chat.title === "New Chat" && messageContent.trim()) {
      chat.title =
        messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : "");
    }

    console.log(
      "User message added. Total messages in chat:",
      chat.messages.length
    );

    console.log("=== Memory Integration ===");

    let relevantMemories = await searchMemories(messageContent, {
      userId,
      limit: 5,
      threshold: 0.5,
    });

    if (
      relevantMemories.length === 0 &&
      (messageContent.toLowerCase().includes("know about me") ||
        messageContent.toLowerCase().includes("about me") ||
        messageContent.toLowerCase().includes("who am i") ||
        messageContent.toLowerCase().includes("my name") ||
        messageContent.toLowerCase().includes("personal"))
    ) {
      console.log("Trying broader search for user information...");
      const userInfoSearches = [
        "user information personal details",
        "name developer",
        "user profile",
      ];

      for (const searchTerm of userInfoSearches) {
        const additionalMemories = await searchMemories(searchTerm, {
          userId,
          limit: 3,
          threshold: 0.4,
        });
        relevantMemories.push(...additionalMemories);
        if (relevantMemories.length > 0) break;
      }
    }

    relevantMemories = relevantMemories.filter(
      (memory, index, self) =>
        index === self.findIndex((m) => m.id === memory.id)
    );

    console.log("Found relevant memories:", relevantMemories.length);
    if (relevantMemories.length > 0) {
      console.log(
        "Memory details:",
        relevantMemories.map((m) => ({
          memory: m.memory.substring(0, 100) + "...",
          score: m.score,
        }))
      );
    }

    const hasImages = imageFiles.length > 0;
    const modelToUse = hasImages ? "gpt-4o" : "gpt-4-turbo";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contextMessages: any[] = [];

    let systemContent =
      "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown. When analyzing images, provide detailed and helpful descriptions and answers.";

    if (relevantMemories.length > 0) {
      const memoryContext = relevantMemories.map((m) => m.memory).join("\n\n");

      systemContent += `\n\nIMPORTANT: You have access to relevant information from previous conversations with this user. Use this context to provide personalized and informed responses:\n\n${memoryContext}\n\nReference this information when relevant to the user's current question.`;
    }

    contextMessages.push({
      role: "system",
      content: systemContent,
    });

    const recentMessages = chat.messages.slice(-10);
    for (const msg of recentMessages) {
      if (msg.role === "user") {
        if (
          msg.files &&
          msg.files.length > 0 &&
          hasImages &&
          msg === chat.messages[chat.messages.length - 1]
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parts: any[] = [];

          if (msg.content.trim()) {
            parts.push({ type: "text", text: msg.content });
          }

          imageFiles.forEach((imageUrl: string) => {
            parts.push({
              type: "image",
              image: imageUrl,
            });
          });

          contextMessages.push({
            role: "user",
            content: parts,
          });
        } else {
          contextMessages.push({
            role: "user",
            content: msg.content,
          });
        }
      } else if (msg.role === "assistant") {
        contextMessages.push({
          role: "assistant",
          content: msg.content,
        });
      }
    }

    console.log("Using model:", modelToUse);
    console.log("Has images:", hasImages);
    console.log("Prepared", contextMessages.length, "messages for OpenAI API");

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
                userQuery: finalMessageContent.slice(0, 100), // First 100 chars for quick reference
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

    return response.toDataStreamResponse();
  } catch (error) {
    // console.error("Error in chat API:", error);
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
