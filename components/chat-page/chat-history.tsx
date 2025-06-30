"use client";

import { Button } from "@/components/ui/button";
import { ChatItem } from "@/types/type";
import { Edit2, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatHistoryProps {
  selectedChatId: string | null;
  availableChats: Record<string, ChatItem>;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onEditChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

export function ChatHistory({
  selectedChatId,
  availableChats,
  onSelectChat,
  onEditChat,
  onDeleteChat,
}: ChatHistoryProps) {
  const sortedChats = Object.values(availableChats).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  if (sortedChats.length === 0) {
    return (
      <div className="text-center text-sm text-white/50 py-4">
        No chats yet. Start a new conversation!
      </div>
    );
  }

  return (
    <div className="space-y-2 px-2">
      {sortedChats.map((chat) => (
        <div
          key={chat.id}
          className={`group relative flex items-center hover:bg-white/10 rounded-lg ${
            selectedChatId === chat.id ? "bg-white/10" : ""
          }`}
        >
          <Button
            variant="ghost"
            className="w-full justify-start py-6 px-4 h-auto text-left"
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="flex flex-col gap-1 w-full pr-12">
              <span className="text-[14px] text-white/90 font-normal truncate">
                {chat.title}
              </span>
              <span className="text-xs text-white/50">
                {formatDistanceToNow(new Date(chat.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </Button>
          <div className="absolute right-2 hidden group-hover:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/70 hover:text-white"
              onClick={() => onEditChat(chat.id)}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/70 hover:text-white"
              onClick={() => onDeleteChat(chat.id)}
            >
              <Trash className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
