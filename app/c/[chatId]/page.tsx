"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Message, useChat } from "ai/react";
import { ChatSidebar } from "@/components/sidebar/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { Textarea } from "@/components/ui/textarea";
import { ChatItem } from "@/types/type";
import { ChatMessage } from "@/components/chat/chat-message";
import { FileUpload, UploadedFile } from "@/components/ui/file-upload";
import { Upload, Paperclip } from "lucide-react";

interface MessageWithFiles extends Message {
  files?: UploadedFile[];
}

interface ChatMessageWithFiles {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string | Date;
  files?: string[];
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [availableChats, setAvailableChats] = useState<
    Record<string, ChatItem>
  >({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialMessage = urlParams.get("message");
    const initialFiles = urlParams.get("files");

    if (initialMessage || initialFiles) {
      if (initialMessage) {
        handleInputChange({
          target: { value: initialMessage },
        } as React.ChangeEvent<HTMLTextAreaElement>);
      }
      if (initialFiles) {
        try {
          const files = JSON.parse(initialFiles);
          setUploadedFiles(files);
        } catch (error) {
          console.error("Error parsing initial files:", error);
        }
      }

      setTimeout(() => {
        if (initialMessage || initialFiles) {
          const form = document.querySelector("form");
          if (form) {
            form.dispatchEvent(
              new Event("submit", { bubbles: true, cancelable: true })
            );
          }
        }
      }, 500);

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [params.chatId]);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!params.chatId) return;

      try {
        const response = await fetch(`/api/chats/${params.chatId}`);
        if (response.ok) {
          const chatData = await response.json();
          setAvailableChats((prev) => ({
            ...prev,
            [params.chatId as string]: chatData,
          }));
        } else if (response.status === 404) {
          console.log("Chat not found, will create new one on first message");
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    if (params.chatId && !isLoadingChats) {
      loadChatHistory();
    }
  }, [params.chatId, isLoadingChats]);

  const currentChat = availableChats[params.chatId as string];

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
    reload,
  } = useChat({
    api: "/api/chat",
    id: params.chatId as string,
    body: {
      chatId: params.chatId,
      files: uploadedFiles,
    },
    initialMessages:
      currentChat?.messages?.map((msg: ChatMessageWithFiles, index) => {
        const files = msg.files?.map((url: string) => {
          const fileName = url.split("/").pop() || "file";
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
          const isDocument = /\.(pdf|doc|docx|txt|md)$/i.test(url);
          return {
            url,
            name: fileName,
            type: isImage ? "image" : isDocument ? "document" : "file",
            extractedContent: undefined,
          };
        });

        return {
          id: msg.id || `msg-${index}`,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          files: files,
        };
      }) || [],
    onResponse: () => {
      setUploadedFiles([]);
    },
    onFinish: (message) => {
      console.log("Chat finished:", message);
      setIsEditingMessage(false);

      const reloadChat = async () => {
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
          console.error("Error reloading chat:", error);
        }
      };

      reloadChat();

      const reloadAllChats = async () => {
        try {
          const response = await fetch("/api/chats");
          if (response.ok) {
            const chats = await response.json();
            setAvailableChats(chats);
          }
        } catch (error) {
          console.error("Error reloading all chats:", error);
        }
      };

      setTimeout(reloadAllChats, 1000);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setIsEditingMessage(false);
    },
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasText = input.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;

    if (!hasText && !hasFiles) {
      return;
    }

    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Error submitting message:", error);
    }
  };

  // Simplified message editing using useChat
  const handleEditMessage = async (
    messageIndex: number,
    newContent: string
  ) => {
    if (!params.chatId || isEditingMessage) return;

    try {
      setIsEditingMessage(true);

      console.log(
        "Editing message at index:",
        messageIndex,
        "with content:",
        newContent
      );

      // Update the message content in the local state
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: newContent,
      };

      // Remove messages after the edited one
      const messagesUpToEdit = updatedMessages.slice(0, messageIndex + 1);

      // Update the messages state
      setMessages(messagesUpToEdit);

      // Use reload to regenerate the response with the updated messages
      await reload({
        body: {
          chatId: params.chatId,
          files: uploadedFiles,
          isEdit: true,
          messages: messagesUpToEdit,
        },
      });
    } catch (error) {
      console.error("Error editing message:", error);
      setIsEditingMessage(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    const timestamp = Math.floor(Date.now() / 1000)
      .toString(16)
      .padStart(8, "0");
    const randomBytes = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const newChatId = timestamp + randomBytes;

    setMessages([]);
    setUploadedFiles([]);
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

        if (params.chatId === chatId) {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
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
        selectedChatId={params.chatId as string}
        availableChats={availableChats}
        onNewChat={handleNewChat}
        onSelectChat={(chatId) => router.push(`/c/${chatId}`)}
        onDeleteChat={handleDeleteChat}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={setIsMobileMenuOpen}
        isLoading={isLoadingChats}
      />

      <div className="flex-1 flex flex-col relative">
        <Navbar />

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="pb-[120px] max-w-[800px] mx-auto">
              {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-neutral-400">
                    <h2 className="text-2xl font-semibold mb-2">
                      Start a conversation
                    </h2>
                    <p>Send a message to begin chatting with ChatGPT</p>
                  </div>
                </div>
              )}

              {messages.map((message: Message, index: number) => {
                const isLastUserMessage =
                  index === messages.length - 2 && message.role === "user";
                let files = isLastUserMessage
                  ? uploadedFiles
                  : (message as MessageWithFiles).files;

                // If the message has files in the URL format, convert them to the proper format
                if (
                  Array.isArray(files) &&
                  files.length > 0 &&
                  typeof files[0] === "string"
                ) {
                  const stringFiles = files as unknown as string[];
                  files = stringFiles.map((url) => {
                    const fileName = url.split("/").pop() || "file";
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(
                      url
                    );
                    return {
                      url,
                      name: fileName,
                      type: isImage ? "image" : "document",
                      extractedContent: undefined,
                    };
                  });
                }

                return (
                  <ChatMessage
                    key={message.id || index}
                    message={{ ...message, files }}
                    messageIndex={index}
                    onEditMessage={handleEditMessage}
                  />
                );
              })}

              {error && (
                <div className="text-red-500 text-center py-4 px-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <strong>Error:</strong> {error.message}
                  </div>
                </div>
              )}

              {(isLoading || isEditingMessage) &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="text-white/70 text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full"></div>
                      {isEditingMessage
                        ? "Regenerating response..."
                        : "ChatGPT is thinking..."}
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#171717] via-[#171717] to-transparent pt-6 pb-6">
            <form
              onSubmit={handleFormSubmit}
              className="w-full max-w-[800px] mx-auto px-4"
            >
              <div className="relative backdrop-blur-sm rounded-2xl border border-neutral-700/50 shadow-2xl shadow-black/20 transition-all duration-200 hover:border-neutral-600/50 focus-within:border-neutral-500/50">
                <div className="relative flex items-end">
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
                    className="w-full bg-[#1f1f1f] border-none text-white text-lg placeholder:text-neutral-400 focus-visible:ring-0 resize-none py-4 px-4 pr-24 min-h-[56px] max-h-96 transition-all duration-300 rounded-2xl"
                    disabled={isLoading || isEditingMessage}
                  />
                  <div className="absolute right-2 bottom-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isEditingMessage}
                      className="p-1.5 hover:bg-neutral-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Upload files (Images, PDF, DOCX, TXT)"
                    >
                      {isUploading ? (
                        <Upload className="h-5 w-5 animate-spin text-neutral-400" />
                      ) : (
                        <Paperclip className="h-5 w-5 text-neutral-400 hover:text-white transition-colors" />
                      )}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        isEditingMessage ||
                        (!input.trim() && uploadedFiles.length === 0)
                      }
                      className="p-1.5 hover:bg-neutral-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                />

                {uploadedFiles.length > 0 && (
                  <div className="px-4 pb-3 pt-2">
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      onFileRemove={handleFileRemove}
                      uploadedFiles={uploadedFiles}
                      disabled={isLoading || isEditingMessage}
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
