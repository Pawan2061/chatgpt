"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import type { ChatItem } from "@/types/type";
import { Button } from "./ui/button";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableChats: Record<string, ChatItem>;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function SearchModal({
  isOpen,
  onClose,
  availableChats,
  onSelectChat,
  onNewChat,
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = Object.values(availableChats).filter((chat) =>
      chat.title.toLowerCase().includes(query)
    );
    setFilteredChats(filtered);
  }, [searchQuery, availableChats]);

  const handleSelect = (chatId: string) => {
    onSelectChat(chatId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#171717] border-white/10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/5">
            <Search className="h-5 w-5 text-white/50" />
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 text-white placeholder:text-white/50 focus-visible:ring-0 text-sm"
            />
          </div>

          <div className="space-y-2">
            {filteredChats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10"
                onClick={() => handleSelect(chat.id)}
              >
                {chat.title}
              </Button>
            ))}

            {searchQuery && filteredChats.length === 0 && (
              <div className="text-center py-4">
                <p className="text-white/50 text-sm mb-2">No chats found</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    onNewChat();
                    onClose();
                  }}
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  Start new chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
