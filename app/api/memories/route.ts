import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import mem0Client from "@/lib/mem0";

export async function GET(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mem0Client) {
      return NextResponse.json(
        { error: "Memory service not available" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    let response;
    if (query) {
      response = await mem0Client.search(query, {
        user_id: user.id,
        limit: 50,
      });
    } else {
      response = await mem0Client.getAll({
        user_id: user.id,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Memory API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
}
