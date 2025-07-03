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
import { Paperclip } from "lucide-react";

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

  // Keep track of which user messages have files
  const [messageFiles, setMessageFiles] = useState<
    Record<number, UploadedFile[]>
  >({});

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
    onFinish: async (message) => {
      console.log("Chat finished:", message);
      setIsEditingMessage(false);

      const reloadChatData = async () => {
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

      setTimeout(() => {
        reloadChatData();
      }, 500);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setIsEditingMessage(false);
    },
  });

  const convertDbFilesToUploadedFiles = (
    files: string[] | UploadedFile[] | undefined
  ): UploadedFile[] => {
    if (!files || !Array.isArray(files)) return [];

    return files.map((file: string | UploadedFile) => {
      if (typeof file === "object" && file.url) {
        return file;
      }

      if (typeof file === "string") {
        const fileName = file.split("/").pop() || "file";
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file);

        return {
          url: file,
          name: fileName,
          type: isImage ? "image" : "document",
          extractedContent: undefined,
        };
      }

      return {
        url: String(file),
        name: "unknown",
        type: "document" as const,
        extractedContent: undefined,
      };
    });
  };

  useEffect(() => {
    if (currentChat?.messages && messages.length === 0 && params.chatId) {
      const updatedMessages = currentChat.messages.map(
        (msg: ChatMessageWithFiles, index: number) => ({
          id: msg.id || `msg-${index}`,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          files: convertDbFilesToUploadedFiles(msg.files),
        })
      );

      setMessages(updatedMessages);
    }
  }, [currentChat?.messages, messages.length, params.chatId, setMessages]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasText = input.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;

    if (!hasText && !hasFiles) {
      return;
    }

    if (hasFiles) {
      const nextMessageIndex = messages.length;
      setMessageFiles((prev) => ({
        ...prev,
        [nextMessageIndex]: [...uploadedFiles],
      }));
    }

    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Error submitting message:", error);
    }
  };

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

      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: newContent,
      };

      const messagesUpToEdit = updatedMessages.slice(0, messageIndex + 1);

      setMessages(messagesUpToEdit);

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
                let files = (message as MessageWithFiles).files;

                if (files && Array.isArray(files)) {
                  files = convertDbFilesToUploadedFiles(files);
                }

                if (message.role === "user" && (!files || files.length === 0)) {
                  const trackedFiles = messageFiles[index];
                  if (trackedFiles && trackedFiles.length > 0) {
                    files = trackedFiles;
                  }
                }

                const isCurrentUserMessage =
                  index === messages.length - 1 &&
                  message.role === "user" &&
                  (!files || files.length === 0) &&
                  uploadedFiles.length > 0;

                if (isCurrentUserMessage) {
                  files = uploadedFiles;
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
                  <div className="flex items-start md:px-4 mb-4">
                    <div className="flex w-full max-w-[800px] mx-auto items-start gap-4 px-4 py-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-neutral-700/30 rounded-md animate-pulse"></div>
                          <div className="h-4 bg-neutral-700/30 rounded-md animate-pulse w-4/5"></div>
                          <div className="h-4 bg-neutral-700/30 rounded-md animate-pulse w-3/5"></div>
                        </div>
                      </div>
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
              <div className="relative rounded-2xl border border-neutral-700 bg-[#2f2f2f] shadow-lg transition-all duration-200 hover:border-neutral-600 focus-within:border-neutral-500">
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
                    placeholder={
                      isLoading || isEditingMessage
                        ? "Please wait..."
                        : "Message ChatGPT..."
                    }
                    className="w-full bg-transparent border-none text-white text-base placeholder:text-neutral-400 focus-visible:ring-0 resize-none py-4 px-4 pr-16 min-h-[56px] max-h-96 rounded-2xl"
                    disabled={isLoading || isEditingMessage}
                  />

                  <div className="absolute right-2 bottom-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isEditingMessage}
                      className="p-2 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <div className="w-5 h-5 border-2 border-neutral-600 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Paperclip className="h-5 w-5 text-neutral-400" />
                      )}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        isEditingMessage ||
                        (!input.trim() && uploadedFiles.length === 0)
                      }
                      className="p-2 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading || isEditingMessage ? (
                        <div className="w-5 h-5 border-2 border-neutral-600 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-neutral-400"
                        >
                          <path
                            d="M7 11L12 6L17 11M12 18V7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
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
                  <div className="px-4 pb-3 pt-2 border-t border-neutral-700/30">
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
