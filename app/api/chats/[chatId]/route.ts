import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { Chat } from "@/lib/models/chat";
import connectToDatabase from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const user = await currentUser();
    const userId = user?.id;

    // if (!userId) {
    //   return NextResponse.json(
    //     { error: "Unauthorized", details: "User not authenticated" },
    //     { status: 401 }
    //   );
    // }

    await connectToDatabase();

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return NextResponse.json(
        { error: "Not Found", details: "Chat not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error in GET chat:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", details: "User not authenticated" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const result = await Chat.deleteOne({ _id: chatId, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Not Found", details: "Chat not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE chat:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
