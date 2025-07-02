"use client";

import { ChatSidebar } from "@/components/sidebar/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useState, useEffect } from "react";
import { ChatItem } from "@/types/type";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FileUpload, UploadedFile } from "@/components/ui/file-upload";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [availableChats, setAvailableChats] = useState<
    Record<string, ChatItem>
  >({});
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadChats = async () => {
      try {
        setIsLoadingChats(true);
        const response = await fetch("/api/chats");
        if (response.ok) {
          const chats = await response.json();
          setAvailableChats(chats);
        }
      } catch (error) {
        console.error("Error loading chats:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, []);

  const handleNewChat = () => {
    const timestamp = Math.floor(Date.now() / 1000)
      .toString(16)
      .padStart(8, "0");
    const randomBytes = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const newChatId = timestamp + randomBytes;

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

        if (selectedChatId === chatId) {
          setSelectedChatId(null);
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    router.push(`/c/${chatId}`);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasText = input.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;

    if (!hasText && !hasFiles) {
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000)
      .toString(16)
      .padStart(8, "0");
    const randomBytes = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const newChatId = timestamp + randomBytes;

    const params = new URLSearchParams();
    if (hasText) params.set("message", input);
    if (hasFiles) params.set("files", JSON.stringify(uploadedFiles));

    router.push(`/c/${newChatId}?${params.toString()}`);
  };

  const handleFileUpload = (file: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const handleFileRemove = (fileUrl: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.url !== fileUrl));
  };

  return (
    <div className="flex h-screen bg-[#171717] overflow-hidden">
      <ChatSidebar
        selectedChatId={selectedChatId || ""}
        availableChats={availableChats}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onEditChat={handleEditChat}
        onDeleteChat={handleDeleteChat}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={setIsMobileMenuOpen}
        isLoading={isLoadingChats}
      />

      <div className="flex-1 flex flex-col relative">
        <Navbar onNewChat={handleNewChat} />

        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div className="text-center mb-8">
              <h1 className="text-[2rem] sm:text-[2.5rem] font-medium text-white mb-2 leading-tight">
                What&apos;s on the agenda today?
              </h1>
            </div>

            <div className="w-full max-w-[768px]">
              <form onSubmit={handleFormSubmit} className="relative">
                <div className="relative bg-[#2f2f2f] backdrop-blur-sm rounded-3xl border border-neutral-600/50 shadow-2xl shadow-black/20 transition-all duration-200 hover:border-neutral-500/50 focus-within:border-neutral-400/50">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleFormSubmit(e);
                      }
                    }}
                    placeholder="Ask anything"
                    className="w-full bg-transparent border-none text-white text-lg placeholder:text-neutral-400 focus-visible:ring-0 resize-none py-4 px-6 pr-20 min-h-[56px] max-h-96 transition-all duration-300 rounded-3xl"
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      onFileRemove={handleFileRemove}
                      uploadedFiles={uploadedFiles}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() && uploadedFiles.length === 0}
                      className="p-2 hover:bg-neutral-600/50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        width="20"
                        height="20"
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

              <div className="text-center mt-4">
                <p className="text-xs text-neutral-500">
                  ChatGPT can make mistakes. Check important info.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
