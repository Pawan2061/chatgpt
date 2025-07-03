import { NextResponse } from "next/server";
import { Chat, IMessage } from "@/lib/models/chat";
import connectDB from "@/lib/db";
import { Types } from "mongoose";
import { currentUser } from "@clerk/nextjs/server";

interface ChatObject {
  _id: Types.ObjectId;
  userId: string;
  title?: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", details: "User not authenticated" },
        { status: 401 }
      );
    }

    const userId = user.id;

    await connectDB();

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });

    const chatsRecord = chats.reduce<
      Record<string, Omit<ChatObject, "_id"> & { id: string }>
    >((acc, chat) => {
      const chatObj = chat.toObject() as ChatObject;
      acc[chatObj._id.toString()] = {
        id: chatObj._id.toString(),
        userId: chatObj.userId,
        title: chatObj.title || "New Chat",
        messages: chatObj.messages,
        createdAt: chatObj.createdAt,
        updatedAt: chatObj.updatedAt,
      };
      return acc;
    }, {});

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
