import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Chat, IMessage } from "@/lib/models/chat";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const { messages, chatId, files } = await req.json();

    // Get authenticated user
    const userId = "test-user"; // const user = await currentUser();
    console.log("=== Chat API Request ===");
    console.log("ChatId:", chatId);
    console.log("Messages received:", messages?.length || 0);
    console.log("Files:", files?.length || 0);
    console.log("User ID:", userId);

    await connectDB();

    let chat;
    let actualChatId: string = "";

    // Check if chatId is provided and is a valid 24-character hex string (MongoDB ObjectId format)
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
      // Use the provided chatId if it's a valid 24-character hex string, otherwise generate new one
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
          // Duplicate key error, generate a completely new ObjectId
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

    // Get the current user message (last message from the client)
    // The useChat hook sends all messages, we need the last one
    const currentUserMessage =
      messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const messageContent = currentUserMessage?.content || "";
    const hasFiles = files && Array.isArray(files) && files.length > 0;

    // Validate message content
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

    // Process files and prepare content
    let finalMessageContent = messageContent;
    const imageFiles: string[] = [];

    if (hasFiles) {
      for (const file of files) {
        if (file.type === "image") {
          // Keep images for vision model
          imageFiles.push(file.url);
        } else if (file.type === "document" && file.extractedContent) {
          // Add document content to message
          finalMessageContent += `\n\n--- Document: ${file.name} ---\n${file.extractedContent}\n--- End of Document ---`;
        }
      }
    }

    // Add the new user message to the chat
    const userMessage: IMessage = {
      role: "user",
      content: finalMessageContent || "Please analyze the uploaded files",
      files: files?.map((f: { url: string }) => f.url) || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    chat.messages.push(userMessage);

    // Update chat title if it's still "New Chat" and this is the first user message
    if (chat.title === "New Chat" && messageContent.trim()) {
      chat.title =
        messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : "");
    }

    console.log(
      "User message added. Total messages in chat:",
      chat.messages.length
    );

    // Prepare messages for OpenAI API using the complete chat history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openAIMessages: any[] = [];

    // Add system message
    openAIMessages.push({
      role: "system",
      content:
        "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown. When analyzing images, provide detailed and helpful descriptions and answers.",
    });

    // Add all messages from the chat history
    for (const msg of chat.messages) {
      if (msg.role === "user") {
        if (msg.files && msg.files.length > 0) {
          // Check if this message has images (for multimodal processing)
          const hasImages =
            imageFiles.length > 0 &&
            msg === chat.messages[chat.messages.length - 1];

          if (hasImages) {
            // Handle multimodal user messages - use the correct format for AI SDK v4
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

            openAIMessages.push({
              role: "user",
              content: parts,
            });
          } else {
            // Text-only user message (documents are already included in content)
            openAIMessages.push({
              role: "user",
              content: msg.content,
            });
          }
        } else {
          // Text-only user message
          openAIMessages.push({
            role: "user",
            content: msg.content,
          });
        }
      } else if (msg.role === "assistant") {
        openAIMessages.push({
          role: "assistant",
          content: msg.content,
        });
      }
    }

    console.log("Prepared", openAIMessages.length, "messages for OpenAI API");

    // Determine which model to use based on whether the current message has images
    const hasImages = imageFiles.length > 0;

    // Use the correct model names - gpt-4o supports vision
    const modelToUse = hasImages ? "gpt-4o" : "gpt-4-turbo";

    console.log("Using model:", modelToUse);
    console.log("Has images:", hasImages);

    // Log the structure of messages being sent to OpenAI for debugging
    console.log(
      "OpenAI Messages structure:",
      JSON.stringify(
        openAIMessages.map((msg) => ({
          role: msg.role,
          contentType: typeof msg.content,
          hasImages:
            Array.isArray(msg.content) &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            msg.content.some((c: any) => c.type === "image"),
        })),
        null,
        2
      )
    );

    // Request the OpenAI API for the response
    const response = await streamText({
      model: openai(modelToUse),
      messages: openAIMessages,
      temperature: 0.7,
      maxTokens: 4000,
      onFinish: async (result) => {
        try {
          console.log("=== Response Finished ===");
          console.log("Assistant response length:", result.text.length);

          // Add assistant response to chat
          const assistantMessage: IMessage = {
            role: "assistant",
            content: result.text,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Reload the chat to ensure we have the latest version
          const updatedChat = await Chat.findOne({ _id: actualChatId, userId });
          if (updatedChat) {
            updatedChat.messages.push(assistantMessage);
            updatedChat.updatedAt = new Date();
            await updatedChat.save();
            console.log(
              "Assistant message saved. Total messages now:",
              updatedChat.messages.length
            );
          }
        } catch (error) {
          console.error("Error saving assistant response:", error);
        }
      },
    });

    // Save the chat with the user message
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
