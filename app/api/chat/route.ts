import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Chat, IMessage } from "@/lib/models/chat";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
// import { currentUser } from "@clerk/nextjs/server";

// Create an OpenAI API client

export async function POST(req: Request) {
  try {
    const { messages, chatId, files } = await req.json();
    const userId = "test-user";

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: "User not authenticated",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await connectDB();

    let chat;

    // Try to find existing chat
    try {
      if (mongoose.Types.ObjectId.isValid(chatId)) {
        chat = await Chat.findOne({ _id: chatId, userId });
      }
    } catch (error) {
      console.log("Error finding chat:", error);
    }

    // Create new chat if it doesn't exist
    if (!chat) {
      try {
        chat = new Chat({
          _id: new mongoose.Types.ObjectId(),
          userId,
          messages: [],
          title: "New Chat",
        });
      } catch (error) {
        console.error("Error creating new chat:", error);
        return new Response(
          JSON.stringify({
            error: "Failed to create chat",
            details: error instanceof Error ? error.message : "Unknown error",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get the last message content and handle empty content
    const lastMessage = messages[messages.length - 1];
    const messageContent = lastMessage?.content || "";
    const hasImages = files && files.length > 0;

    // If no content and no images, return error
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

    // Create user message with appropriate content
    const userMessage: IMessage = {
      role: "user",
      content: messageContent || "Please analyze the uploaded image(s)",
      files: files || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    chat.messages.push(userMessage);

    // Prepare messages for OpenAI API
    const openAIMessages: any[] = [
      {
        role: "system",
        content:
          "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown. If the user provides images, analyze them and respond accordingly. If only images are provided without text, provide a detailed description and analysis of the images.",
      },
    ];

    // Add conversation history (exclude the current message first)
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      openAIMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add the current user message with images if present
    if (hasImages) {
      const content = [];

      // Add text if present
      if (messageContent.trim()) {
        content.push({ type: "text", text: messageContent });
      }

      // Add images
      files.forEach((imageUrl: string) => {
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
      // Text-only message
      openAIMessages.push({
        role: "user",
        content: messageContent,
      });
    }

    // Request the OpenAI API for the response
    const response = await streamText({
      model: openai("gpt-4-vision-preview"), // Using vision model for image support
      messages: openAIMessages,
      temperature: 0.7,
      maxTokens: 4000,
    });

    // Save the chat after getting response
    const assistantMessage: IMessage = {
      role: "assistant",
      content: "Processing...",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    chat.messages.push(assistantMessage);
    await chat.save();

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
