"use client";

import { ChatSidebar } from "@/components/sidebar/sidebar";
import { useState } from "react";
import { ChatItem } from "@/types/type";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [availableChats, setAvailableChats] = useState<
    Record<string, ChatItem>
  >({});

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: ChatItem = {
      id: newChatId,
      title: "New Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
    };

    setAvailableChats((prev) => ({
      ...prev,
      [newChatId]: newChat,
    }));
    setSelectedChatId(newChatId);
  };

  const handleEditChat = (chatId: string) => {
    // Implement edit functionality
    console.log("Edit chat:", chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    setAvailableChats((prev) => {
      const newChats = { ...prev };
      delete newChats[chatId];
      return newChats;
    });

    if (selectedChatId === chatId) {
      setSelectedChatId(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#171717]">
      <ChatSidebar
        selectedChatId={selectedChatId}
        availableChats={availableChats}
        onNewChat={handleNewChat}
        onSelectChat={setSelectedChatId}
        onEditChat={handleEditChat}
        onDeleteChat={handleDeleteChat}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={setIsMobileMenuOpen}
      />
      <div className="flex-1 overflow-auto">
        <main className="h-full">
          <div className="flex h-full items-center justify-center text-white/70">
            {selectedChatId
              ? "Chat content will go here"
              : "Select or start a new chat"}
          </div>
        </main>
      </div>
    </div>
  );
}
