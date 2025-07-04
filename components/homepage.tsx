"use client";

import { ChatSidebar } from "@/components/sidebar/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { useState, useEffect, useRef } from "react";
import { ChatItem } from "@/types/type";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FileUpload, UploadedFile } from "@/components/ui/file-upload";
import { Paperclip } from "lucide-react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [availableChats, setAvailableChats] = useState<
    Record<string, ChatItem>
  >({});
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = async (file: UploadedFile) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const handleFileRemove = (fileUrl: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.url !== fileUrl));
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload-file", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          handleFileUpload({
            url: result.url,
            name: result.fileName || file.name,
            type: file.type.startsWith("image/") ? "image" : "document",
            extractedContent: result.extractedContent,
          });
        } else {
          console.error("Upload failed:", await response.text());
        }
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#212121] overflow-hidden">
      <ChatSidebar
        selectedChatId={selectedChatId || ""}
        availableChats={availableChats}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={setIsMobileMenuOpen}
        isLoading={isLoadingChats}
      />

      <div className="flex-1 flex flex-col relative">
        <Navbar onToggleMobileMenu={() => setIsMobileMenuOpen(true)} />

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="pb-[120px] max-w-[800px] mx-auto">
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-neutral-400">
                  <h2 className="text-2xl font-semibold mb-2">
                    Start a conversation
                  </h2>
                  <p>Send a message to begin chatting with ChatGPT</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-8 pb-8">
            <form
              onSubmit={handleFormSubmit}
              className="w-full max-w-[800px] mx-auto px-6"
            >
              <div className="relative rounded-3xl border border-neutral-600/30 bg-[#2f2f2f] shadow-2xl transition-all duration-200 hover:border-neutral-500/50 focus-within:border-neutral-400/70">
                <div className="relative flex items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleFormSubmit(e);
                      }
                    }}
                    placeholder="Message ChatGPT..."
                    className="w-full bg-transparent border-none text-white text-xl placeholder:text-neutral-500 focus-visible:ring-0 resize-none py-6 px-6 pr-24 min-h-[80px] max-h-96 rounded-3xl leading-relaxed font-normal"
                  />
                  <div className="absolute right-4 bottom-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 hover:bg-neutral-600/40 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Upload files (Images, PDF, DOCX, TXT)"
                    >
                      {isUploading ? (
                        <div className="w-6 h-6 border-2 border-neutral-500 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Paperclip className="h-6 w-6 text-neutral-400 hover:text-neutral-300" />
                      )}
                    </button>
                    <button
                      type="submit"
                      disabled={!input.trim() && uploadedFiles.length === 0}
                      className="p-3 bg-white hover:bg-neutral-200 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-600"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-neutral-800"
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

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt,.md"
                />

                {uploadedFiles.length > 0 && (
                  <div className="px-6 pb-5 pt-3 border-t border-neutral-600/30">
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      onFileRemove={handleFileRemove}
                      uploadedFiles={uploadedFiles}
                      hideButton
                    />
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
