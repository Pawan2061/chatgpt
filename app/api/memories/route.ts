import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import mem0Client from "@/lib/mem0";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await mem0Client.getAll({
      user_id: "test-user",
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Memory API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
}
