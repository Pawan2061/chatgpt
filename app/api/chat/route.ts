import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Chat, IMessage } from "@/lib/models/chat";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const { messages, chatId, files } = await req.json();
    const userId = "test-user";

    await connectDB();

    let chat;

    try {
      if (mongoose.Types.ObjectId.isValid(chatId)) {
        chat = await Chat.findOne({ _id: chatId, userId });
      }
    } catch (error) {
      console.log("Error finding chat:", error);
    }

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

    const lastMessage = messages[messages.length - 1];
    const messageContent = lastMessage?.content || "";
    const hasImages = files && Array.isArray(files) && files.length > 0;

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

    const userMessage: IMessage = {
      role: "user",
      content: messageContent || "Please analyze the uploaded image(s)",
      files: files || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    chat.messages.push(userMessage);

    const openAIMessages = [
      {
        role: "system" as const,
        content:
          "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown.",
      },
    ];

    messages.forEach((msg: { role: string; content: string }) => {
      if (msg.role === "user" || msg.role === "assistant") {
        openAIMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    });

    if (hasImages) {
      const content = [];

      if (messageContent.trim()) {
        content.push({ type: "text", text: messageContent });
      }

      files.forEach((imageUrl: string) => {
        content.push({
          type: "image_url",
          image_url: { url: imageUrl },
        });
      });

      openAIMessages[openAIMessages.length - 1] = {
        role: "user" as const,
        content: content,
      };
    }
    const response = await streamText({
      model: openai(hasImages ? "gpt-4-vision-preview" : "gpt-4-turbo"),
      messages: openAIMessages as any,
      temperature: 0.7,
      maxTokens: 4000,
    });

    try {
      await chat.save();
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
