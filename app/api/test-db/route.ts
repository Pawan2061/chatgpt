import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Chat } from "@/lib/models/chat";

export async function GET() {
  try {
    // Test database connection
    await connectDB();
    console.log("✅ Database connection successful");

    // Test creating a chat
    const testChat = await Chat.create({
      userId: "test-user",
      messages: [
        {
          role: "user",
          content: "This is a test message",
        },
      ],
    });
    console.log("✅ Chat creation successful", testChat._id);

    // Test retrieving the chat
    const retrievedChat = await Chat.findById(testChat._id);
    console.log("✅ Chat retrieval successful");

    // Clean up test data
    await Chat.findByIdAndDelete(testChat._id);
    console.log("✅ Test cleanup successful");

    return NextResponse.json({
      status: "success",
      message: "Database connection and operations working correctly",
      details: {
        chatId: testChat._id,
        created: !!testChat,
        retrieved: !!retrievedChat,
        cleaned: true,
      },
    });
  } catch (error) {
    console.error("❌ Database test failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Database test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
