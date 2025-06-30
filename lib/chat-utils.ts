import { Chat, IChat, IMessage } from "./models/chat";
import connectDB from "./db";

export async function createChat(
  userId: string,
  initialMessage: string
): Promise<IChat> {
  await connectDB();

  const chat = await Chat.create({
    userId,
    messages: [
      {
        role: "user",
        content: initialMessage,
      },
    ],
  });

  return chat;
}

export async function addMessageToChat(
  chatId: string,
  message: Omit<IMessage, "createdAt" | "updatedAt">
): Promise<IChat> {
  await connectDB();

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { messages: message } },
    { new: true }
  );

  if (!chat) {
    throw new Error("Chat not found");
  }

  return chat;
}

export async function getUserChats(
  userId: string,
  limit = 10,
  page = 1
): Promise<IChat[]> {
  await connectDB();

  const chats = await Chat.find({ userId })
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return chats;
}

export async function updateMessage(
  chatId: string,
  messageIndex: number,
  newContent: string
): Promise<IChat> {
  await connectDB();

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new Error("Chat not found");
  }

  if (!chat.messages[messageIndex]) {
    throw new Error("Message not found");
  }

  chat.messages[messageIndex].content = newContent;
  await chat.save();

  return chat;
}

export async function deleteChat(chatId: string): Promise<void> {
  await connectDB();
  await Chat.findByIdAndDelete(chatId);
}
