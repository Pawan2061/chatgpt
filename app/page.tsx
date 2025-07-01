"use client";

import { ChatSidebar } from "@/components/sidebar/sidebar";
import { useState } from "react";
import { ChatItem } from "@/types/type";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="flex h-screen bg-[#171717] overflow-hidden">
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
      <div className="flex-1 flex flex-col relative">
        {/* Main content area */}
        <main className="flex-1 overflow-hidden relative">
          {!selectedChatId ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h1 className="text-[32px] text-white mb-10">
                What are you working on?
              </h1>
              <div className="w-full max-w-[600px] px-4">
                <div className="relative bg-[#1f1f1f] backdrop-blur-sm rounded-2xl border border-neutral-700/50 shadow-2xl shadow-black/20">
                  <Textarea
                    placeholder="Ask anything"
                    className="w-full bg-transparent border-none text-white text-lg placeholder:text-neutral-400 focus-visible:ring-0 resize-none py-4 px-4 pr-20 min-h-[56px] max-h-96 transition-all duration-300"
                  />
                  <div className="absolute right-2 bottom-2.5 flex items-center gap-2">
                    <button className="p-1 hover:bg-neutral-700/50 rounded-lg transition-colors">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-neutral-400"
                      >
                        <path
                          d="M9 13c0 .552-.895 1-2 1s-2-.448-2-1 .895-1 2-1 2 .448 2 1z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M9 13c0 .552-.895 1-2 1s-2-.448-2-1 .895-1 2-1 2 .448 2 1z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M13 13c0 .552-.895 1-2 1s-2-.448-2-1 .895-1 2-1 2 .448 2 1z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M17 13c0 .552-.895 1-2 1s-2-.448-2-1 .895-1 2-1 2 .448 2 1z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-neutral-700/50 rounded-lg transition-colors">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-neutral-400"
                      >
                        <path
                          d="M12 3c1.229 0 2.38.34 3.367.93L12 7.349 8.632 3.93A7.001 7.001 0 0 1 12 3Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M3.931 8.633l3.418 3.367-3.418 3.369A7 7 0 0 1 3 12c0-1.229.34-2.38.931-3.367Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M12 20.999c-1.229 0-2.38-.34-3.367-.93l3.367-3.418 3.368 3.418A7.001 7.001 0 0 1 12 21Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M20.069 15.367l-3.418-3.367 3.418-3.369c.591.987.931 2.138.931 3.367 0 1.229-.34 2.38-.931 3.369Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs text-neutral-400">
                    ChatGPT can make mistakes. Check important info.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              heyy
              {/* Chat messages will go here */}
            </div>
          )}
        </main>

        {selectedChatId && (
          <div className="w-full max-w-[800px] mx-auto px-4 pb-4">
            <div className="relative backdrop-blur-sm rounded-2xl border border-neutral-700/50 shadow-2xl shadow-black/20 transition-all duration-200 hover:border-neutral-600/50 focus-within:border-neutral-500/50">
              <Textarea
                placeholder="Message ChatGPT..."
                className="w-full bg-[#1f1f1f] border-none text-white text-lg placeholder:text-neutral-400 focus-visible:ring-0 resize-none py-4 px-4 pr-20 min-h-[56px] max-h-96 transition-all duration-300 rounded-2xl"
              />
              <div className="absolute right-2 bottom-2.5">
                <button className="p-1 hover:bg-neutral-700/50 rounded-lg transition-colors">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    <path
                      d="M7 11L12 6L17 11M12 18V7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
