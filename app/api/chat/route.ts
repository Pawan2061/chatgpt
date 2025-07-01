import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Chat, IMessage } from "@/lib/models/chat";
import connectToDatabase from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

// Create an OpenAI API client

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    const user = await currentUser();
    const userId = user?.id;

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

    // Connect to database
    await connectToDatabase();

    // Find or create chat
    let chat = await Chat.findOne({ _id: chatId, userId: "nwdwb" });

    if (!chat && chatId) {
      chat = new Chat({
        _id: chatId,
        userId,
        messages: [],
        title: "New Chat",
      });
    }

    if (!chat) {
      return new Response(
        JSON.stringify({
          error: "Chat not found",
          details: "Unable to create or find chat",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add the new message to the chat
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

    // Save the chat after getting response
    const assistantMessage: IMessage = {
      role: "assistant",
      content: "", // This will be updated with the streamed response
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
