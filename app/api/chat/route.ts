import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

// Create an OpenAI API client

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("Received messages:", messages);

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
