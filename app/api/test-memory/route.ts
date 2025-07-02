import { NextResponse } from "next/server";
import { addMemory, searchMemories } from "@/lib/mem0";

export async function POST(req: Request) {
  try {
    const { action, text, query } = await req.json();
    const userId = "test-user";
    const chatId = "test-chat-memory";

    if (action === "add") {
      await addMemory(text, {
        userId,
        chatId,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Memory added successfully",
      });
    }

    if (action === "search") {
      const memories = await searchMemories(query, {
        userId,
        limit: 5,
        threshold: 0.5,
      });

      return NextResponse.json({
        success: true,
        memories,
        count: memories.length,
      });
    }

    return NextResponse.json(
      {
        error: "Invalid action. Use 'add' or 'search'",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Memory test error:", error);
    return NextResponse.json(
      {
        error: "Memory test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Memory test endpoint",
    usage: {
      add: "POST with { action: 'add', text: 'memory content' }",
      search: "POST with { action: 'search', query: 'search term' }",
    },
  });
}
