import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Chat, IMessage } from "@/lib/models/chat";
import connectDB from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { chatId, messageIndex, newContent } = await req.json();

    // Get authenticated user
    const userId = "test-user";
    console.log("=== Edit Message API Request ===");
    console.log("ChatId:", chatId);
    console.log("Message Index:", messageIndex);
    console.log("New Content:", newContent);

    await connectDB();

    // Find the chat
    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate message index
    if (messageIndex < 0 || messageIndex >= chat.messages.length) {
      return new Response(
        JSON.stringify({ error: "Message index out of range" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ensure the message to edit is a user message
    if (chat.messages[messageIndex].role !== "user") {
      return new Response(
        JSON.stringify({ error: "Can only edit user messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update the message content
    chat.messages[messageIndex].content = newContent;
    chat.messages[messageIndex].updatedAt = new Date();

    // Remove all messages after the edited message (they will be regenerated)
    chat.messages = chat.messages.slice(0, messageIndex + 1);

    // Prepare messages for OpenAI API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openAIMessages: any[] = [];

    // Add system message
    openAIMessages.push({
      role: "system",
      content:
        "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown. When analyzing images, provide detailed and helpful descriptions and answers.",
    });

    // Add all messages from the chat history up to and including the edited message
    for (const msg of chat.messages) {
      if (msg.role === "user") {
        openAIMessages.push({
          role: "user",
          content: msg.content,
        });
      } else if (msg.role === "assistant") {
        openAIMessages.push({
          role: "assistant",
          content: msg.content,
        });
      }
    }

    console.log("Prepared", openAIMessages.length, "messages for OpenAI API");

    // Determine model to use (simplified for editing - no file handling for now)
    const modelToUse = "gpt-4o-mini";

    // Request the OpenAI API for the response
    const response = await streamText({
      model: openai(modelToUse),
      messages: openAIMessages,
      temperature: 0.7,
      maxTokens: 4000,
      onFinish: async (result) => {
        try {
          console.log("=== Edit Response Finished ===");
          console.log("Assistant response length:", result.text.length);

          // Add new assistant response to chat
          const assistantMessage: IMessage = {
            role: "assistant",
            content: result.text,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Reload the chat to ensure we have the latest version
          const updatedChat = await Chat.findOne({ _id: chatId, userId });
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

    // Save the chat with the edited message
    try {
      await chat.save();
      console.log("Chat saved with edited message");
    } catch (error) {
      console.error("Error saving chat:", error);
    }

    return response.toDataStreamResponse();
  } catch (error) {
    console.error("Error in edit message API:", error);
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
