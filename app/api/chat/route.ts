import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Chat, IMessage } from "@/lib/models/chat";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const { messages, chatId, files } = await req.json();
    const userId = "test-user";

    console.log("=== Chat API Request ===");
    console.log("ChatId:", chatId);
    console.log("Messages received:", messages?.length);
    console.log("Files:", files?.length || 0);

    await connectDB();

    let chat;
    let actualChatId;

    // Handle ObjectId creation/validation
    if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
      // Valid ObjectId provided, try to find existing chat
      actualChatId = chatId;
      chat = await Chat.findOne({ _id: actualChatId, userId });
      console.log(
        "Found existing chat:",
        !!chat,
        "with",
        chat?.messages?.length || 0,
        "messages"
      );
    } else {
      // Invalid or no ObjectId provided, generate a new one
      actualChatId = new mongoose.Types.ObjectId().toString();
      console.log("Generated new ObjectId:", actualChatId);
    }

    // Create new chat if it doesn't exist
    if (!chat) {
      console.log("Creating new chat with ID:", actualChatId);
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
    }

    // Get the current user message (last message from the client)
    const currentUserMessage = messages[messages.length - 1];
    const messageContent = currentUserMessage?.content || "";
    const hasImages = files && Array.isArray(files) && files.length > 0;

    // Validate message content
    if (!messageContent.trim() && !hasImages) {
      return new Response(
        JSON.stringify({
          error: "Empty message",
          details: "Please provide text or images",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add the new user message to the chat
    const userMessage: IMessage = {
      role: "user",
      content: messageContent || "Please analyze the uploaded image(s)",
      files: files || [],
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
    const openAIMessages: Array<{
      role: "system" | "user" | "assistant";
      content:
        | string
        | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    }> = [
      {
        role: "system",
        content:
          "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown.",
      },
    ];

    // Add all messages from the chat history
    for (const msg of chat.messages) {
      if (msg.role === "user") {
        if (msg.files && msg.files.length > 0) {
          // Handle multimodal user messages
          const content = [];
          if (msg.content.trim()) {
            content.push({ type: "text", text: msg.content });
          }
          msg.files.forEach((imageUrl: string) => {
            content.push({
              type: "image_url",
              image_url: { url: imageUrl },
            });
          });
          openAIMessages.push({
            role: "user",
            content: content,
          });
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

    // Determine which model to use based on whether any message in the conversation has images
    const hasAnyImages = chat.messages.some(
      (msg) => msg.files && msg.files.length > 0
    );
    const modelToUse = hasAnyImages ? "gpt-4-vision-preview" : "gpt-4-turbo";

    console.log("Using model:", modelToUse);

    // Request the OpenAI API for the response
    const response = await streamText({
      model: openai(modelToUse),
      messages: openAIMessages as any,
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
    console.error("Error in chat API:", error);
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
