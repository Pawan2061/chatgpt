import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { Chat } from "@/lib/models/chat";
import connectToDatabase from "@/lib/db";

export async function GET() {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", details: "User not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });

    // Convert chats to a record format

    const chatsRecord = chats.reduce((acc, chat) => {
      acc[chat._id] = {
        id: chat._id,
        title: chat.title || "New Chat",
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(chatsRecord);
  } catch (error) {
    console.error("Error in GET chats:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
