import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Chat, IMessage } from "@/lib/models/chat";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
// import { currentUser } from "@clerk/nextjs/server";

// Create an OpenAI API client

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
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

    const userMessage: IMessage = {
      role: "user",
      content: messages[messages.length - 1].content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    chat.messages.push(userMessage);

    // Request the OpenAI API for the response
    const response = await streamText({
      model: openai("gpt-4-turbo-preview"),
      messages: [
        {
          role: "system",
          content:
            "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown.",
        },
        ...messages,
      ],
      temperature: 0.7,
    });

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
