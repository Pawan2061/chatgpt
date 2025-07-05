import { NextResponse } from "next/server";
import { addMemory, searchMemories } from "@/lib/mem0";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, text, query } = await req.json();
    const userId = user.id;

    if (action === "add") {
      const testChatId = "test-chat-" + Date.now();

      await addMemory(text, {
        userId,
        chatId: testChatId,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
          testType: "cross-chat-memory",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Memory added successfully",
        chatId: testChatId,
      });
    }

    if (action === "search") {
      const memories = await searchMemories(query, {
        userId,
        limit: 10,
        threshold: 0.2, // Very low threshold for testing
      });

      return NextResponse.json({
        success: true,
        memories,
        count: memories.length,
        query: query,
        userId: userId,
      });
    }

    if (action === "debug") {
      // Get all memories for debugging
      const allMemories = await searchMemories("", {
        userId,
        limit: 50,
        threshold: 0.0, // Get all memories
      });

      return NextResponse.json({
        success: true,
        allMemories,
        count: allMemories.length,
        userId: userId,
      });
    }

    return NextResponse.json(
      {
        error: "Invalid action. Use 'add', 'search', or 'debug'",
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
      debug: "POST with { action: 'debug' } - returns all memories",
    },
  });
}
