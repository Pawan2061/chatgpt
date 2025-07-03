import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import mem0Client from "@/lib/mem0";

export async function GET(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const { searchParams } = new URL(request.url);
    // const query = searchParams.get("query") || "";
    // const chatId = searchParams.get("chatId");

    const response = await mem0Client.getAll({
      user_id: "test-user",
    });

    // Filter by chat ID
    //   response = response.filter(
    //     (memory: any) => memory.metadata?.chat_id === chatId
    //   );
    // } else if (query) {
    //   response = await mem0Client.search(query, {
    //     user_id: user.id,
    //     limit: 20,
    //   });
    // } else {
    //   response = await mem0Client.getAll({
    //     user_id: user.id,
    //   });
    // }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Memory API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
}
