"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Message, useChat } from "ai/react";
import { ChatSidebar } from "@/components/sidebar/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { ChatItem } from "@/types/type";
import { ChatMessage } from "@/components/chat/chat-message";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [availableChats, setAvailableChats] = useState<
    Record<string, ChatItem>
  >({});

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      id: params.chatId as string,
      body: {
        chatId: params.chatId,
      },
      onFinish: (message) => {
        console.log("Chat finished:", message);
        // Update chat title after first message if it's "New Chat"
        if (
          availableChats[params.chatId as string]?.title === "New Chat" &&
          messages.length === 0
        ) {
          const firstMessage = input.slice(0, 30) + "...";
          setAvailableChats((prev) => ({
            ...prev,
            [params.chatId as string]: {
              ...prev[params.chatId as string],
              title: firstMessage,
            },
          }));
        }
      },
      onError: (error) => {
        console.error("Chat error:", error);
      },
    });

  // Custom submit handler to wrap the useChat submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting message:", input);
    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Error submitting message:", error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Debug logging
  useEffect(() => {
    console.log("Current messages:", messages);
    console.log("Loading state:", isLoading);
    console.log("Error state:", error);
  }, [messages, isLoading, error]);

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
    router.push(`/c/${newChatId}`);
  };

  const handleEditChat = (chatId: string) => {
    console.log("Edit chat:", chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    setAvailableChats((prev) => {
      const newChats = { ...prev };
      delete newChats[chatId];
      return newChats;
    });

    if (params.chatId === chatId) {
      router.push("/");
    }
  };

  return (
    <div className="flex h-screen bg-[#171717] overflow-hidden">
      <ChatSidebar
        selectedChatId={params.chatId as string}
        availableChats={availableChats}
        onNewChat={handleNewChat}
        onSelectChat={(chatId) => router.push(`/c/${chatId}`)}
        onEditChat={handleEditChat}
        onDeleteChat={handleDeleteChat}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={setIsMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="pb-[200px]">
              {messages.map((message: Message, index: number) => (
                <ChatMessage key={index} message={message} />
              ))}
              {error && (
                <div className="text-red-500 text-center py-2">
                  Error: {error.message}
                </div>
              )}
              {isLoading && (
                <div className="text-white/70 text-center py-2">
                  AI is thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#171717] to-transparent pt-24 pb-8">
          <form
            onSubmit={handleFormSubmit}
            className="w-full max-w-[800px] mx-auto px-4"
          >
            <div className="relative backdrop-blur-sm rounded-2xl border border-neutral-700/50 shadow-2xl shadow-black/20 transition-all duration-200 hover:border-neutral-600/50 focus-within:border-neutral-500/50">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e);
                  }
                }}
                placeholder="Message ChatGPT..."
                className="w-full bg-[#1f1f1f] border-none text-white text-lg placeholder:text-neutral-400 focus-visible:ring-0 resize-none py-4 px-4 pr-20 min-h-[56px] max-h-96 transition-all duration-300 rounded-2xl"
              />
              <div className="absolute right-2 bottom-2.5">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-1 hover:bg-neutral-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
          </form>
        </div>
      </div>
    </div>
  );
}
