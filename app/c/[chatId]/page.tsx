"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Message, useChat } from "ai/react";
import { ChatSidebar } from "@/components/sidebar/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { ChatItem } from "@/types/type";
import { ChatMessage } from "@/components/chat/chat-message";
import { ImageUpload } from "@/components/ui/image-upload";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [availableChats, setAvailableChats] = useState<
    Record<string, ChatItem>
  >({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Load all chats on initial load
  useEffect(() => {
    const loadChats = async () => {
      try {
        const response = await fetch("/api/chats");
        if (response.ok) {
          const chats = await response.json();
          setAvailableChats(chats);
        }
      } catch (error) {
        console.error("Error loading chats:", error);
      }
    };

    loadChats();
  }, []);

  // Load chat history when chatId changes
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/chats/${params.chatId}`);
        if (response.ok) {
          const chatData = await response.json();
          setAvailableChats((prev) => ({
            ...prev,
            [params.chatId as string]: chatData,
          }));
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    if (params.chatId && !availableChats[params.chatId as string]) {
      loadChatHistory();
    }
  }, [params.chatId, availableChats]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: params.chatId as string,
    body: {
      chatId: params.chatId,
      files: uploadedImages,
    },
    initialMessages:
      availableChats[params.chatId as string]?.messages?.map((msg) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      })) || [],
    onFinish: (message) => {
      console.log("Chat finished:", message);
      // Clear uploaded images after sending
      setUploadedImages([]);
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Allow submission if there's text input OR uploaded images
    const hasText = input.trim().length > 0;
    const hasImages = uploadedImages.length > 0;

    if (!hasText && !hasImages) {
      return; // Don't submit if neither text nor images
    }

    console.log("Submitting message:", input);
    console.log("With images:", uploadedImages);

    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Error submitting message:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateObjectId = () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const machineId = Math.floor(Math.random() * 16777216);
    const processId = Math.floor(Math.random() * 65536);
    const counter = Math.floor(Math.random() * 16777216);

    const buffer = Buffer.from(
      Array.from({ length: 12 }, (_, i) => {
        if (i < 4) return (timestamp >> ((3 - i) * 8)) & 0xff;
        if (i < 7) return (machineId >> ((6 - i) * 8)) & 0xff;
        if (i < 9) return (processId >> ((8 - i) * 8)) & 0xff;
        return (counter >> ((11 - i) * 8)) & 0xff;
      })
    );
    return buffer.toString("hex");
  };

  const handleNewChat = () => {
    const newChatId = generateObjectId();
    setMessages([]);
    setUploadedImages([]); // Clear images for new chat

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

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAvailableChats((prev) => {
          const newChats = { ...prev };
          delete newChats[chatId];
          return newChats;
        });

        if (params.chatId === chatId) {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImages((prev) => [...prev, imageUrl]);
  };

  const handleImageRemove = (imageUrl: string) => {
    setUploadedImages((prev) => prev.filter((url) => url !== imageUrl));
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
            <div className="pb-[120px]">
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

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#171717] via-[#171717] to-transparent pt-6 pb-6">
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
              <div className="absolute right-2 bottom-2.5 flex items-center gap-2">
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  onImageRemove={handleImageRemove}
                  uploadedImages={uploadedImages}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={
                    isLoading || (!input.trim() && uploadedImages.length === 0)
                  }
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
