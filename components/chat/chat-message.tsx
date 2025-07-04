"use client";

import { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Check, X } from "lucide-react";

interface ChatMessageProps {
  message: Message & { files?: { url: string; name: string; type: string }[] };
  messageIndex?: number;
  onEditMessage?: (messageIndex: number, newContent: string) => void;
}

export function ChatMessage({
  message,
  messageIndex,
  onEditMessage,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<number, boolean>
  >({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleEditStart = () => {
    setIsEditing(true);
    setEditedContent(message.content);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleEditSave = () => {
    if (onEditMessage && messageIndex !== undefined) {
      onEditMessage(messageIndex, editedContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleEditSave();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  const handleImageLoad = (index: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [index]: false }));
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const handleImageLoadStart = (index: number) => {
    setImageLoadingStates((prev) => ({ ...prev, [index]: true }));
  };

  if (isUser) {
    return (
      <div className="group relative mb-4 flex justify-end px-4">
        <div className="w-full max-w-[800px] mx-auto flex justify-end px-4 py-2">
          <div className="max-w-[70%] flex flex-col items-end gap-2">
            {isEditing ? (
              <div className="w-full space-y-3">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-[#2f2f2f] border border-neutral-600 text-white text-base placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-500 resize-none min-h-[100px] rounded-lg"
                  placeholder="Edit your message..."
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleEditCancel}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={!editedContent.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 disabled:text-neutral-400 text-white rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Save & Submit
                  </button>
                </div>
              </div>
            ) : (
              <>
                {message.files && message.files.length > 0 && (
                  <div className="space-y-2">
                    {message.files.map((file, index) => {
                      const isImage =
                        file.type === "image" ||
                        /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.url);

                      return (
                        <div key={index} className="flex justify-end">
                          {isImage ? (
                            <div className="relative">
                              {imageLoadingStates[index] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 rounded-lg">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                                </div>
                              )}
                              {imageErrors[index] ? (
                                <div className="flex items-center gap-2 text-red-400 bg-neutral-800/50 px-3 py-2 rounded-lg">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                  </svg>
                                  Failed to load image
                                </div>
                              ) : (
                                <img
                                  src={file.url}
                                  alt={file.name || "Uploaded image"}
                                  className="max-w-[300px] rounded-lg border border-neutral-700"
                                  loading="lazy"
                                  onLoad={() => handleImageLoad(index)}
                                  onError={() => handleImageError(index)}
                                  onLoadStart={() =>
                                    handleImageLoadStart(index)
                                  }
                                  style={{
                                    opacity: imageLoadingStates[index]
                                      ? 0.5
                                      : 1,
                                    transition: "opacity 0.2s ease-in-out",
                                  }}
                                />
                              )}
                            </div>
                          ) : (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 bg-neutral-800/50 px-3 py-2 rounded-lg transition-colors"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              {file.name ||
                                file.url.split("/").pop() ||
                                "Download file"}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-[#2f2f2f] text-white px-4 py-3 rounded-3xl max-w-fit">
                  <div className="text-[15px] leading-relaxed">
                    {message.content}
                  </div>
                </div>

                {onEditMessage && messageIndex !== undefined && (
                  <button
                    onClick={handleEditStart}
                    className="flex items-center gap-1 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-neutral-800 rounded-lg transition-all text-neutral-400 hover:text-white"
                    title="Edit message"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative mb-4 flex items-start md:px-4">
      <div className="flex w-full max-w-[800px] mx-auto items-start gap-4 px-4 py-6">
        <div className="flex-1 space-y-4">
          <div className="prose prose-invert max-w-none font-[16px] text-white">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          {message.files && message.files.length > 0 && (
            <div className="mt-4 space-y-2">
              {message.files.map((file, index) => {
                const isImage =
                  file.type === "image" ||
                  /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.url);

                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 justify-start"
                  >
                    {isImage ? (
                      <div className="relative">
                        {imageLoadingStates[index] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 rounded-lg">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                          </div>
                        )}
                        {imageErrors[index] ? (
                          <div className="flex items-center gap-2 text-red-400 bg-neutral-800/50 px-3 py-2 rounded-lg">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Failed to load image
                          </div>
                        ) : (
                          <img
                            src={file.url}
                            alt={file.name || "Uploaded image"}
                            className="max-w-[300px] rounded-lg border border-neutral-700"
                            loading="lazy"
                            onLoad={() => handleImageLoad(index)}
                            onError={() => handleImageError(index)}
                            onLoadStart={() => handleImageLoadStart(index)}
                            style={{
                              opacity: imageLoadingStates[index] ? 0.5 : 1,
                              transition: "opacity 0.2s ease-in-out",
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 bg-neutral-800/50 px-3 py-2 rounded-lg transition-colors"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {file.name ||
                          file.url.split("/").pop() ||
                          "Download file"}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 justify-start">
            <button className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-neutral-400 hover:text-white"
              >
                <path
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-neutral-400 hover:text-white"
              >
                <path
                  d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-neutral-400 hover:text-white"
              >
                <path
                  d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-neutral-400 hover:text-white"
              >
                <path
                  d="M3 15h18M3 9h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="text-neutral-400 hover:text-white"
              >
                <path
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
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
    </div>
  );
}
