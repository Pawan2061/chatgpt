"use client";

import { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Check, X } from "lucide-react";
import { UploadedFile } from "@/components/ui/file-upload";

interface ChatMessageProps {
  message: Message & { files?: UploadedFile[] };
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
  const [editContent, setEditContent] = useState(message.content);
  console.log("message", message);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleEditSave = () => {
    if (onEditMessage && messageIndex !== undefined) {
      onEditMessage(messageIndex, editContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleEditCancel();
    }
  };

  return (
    <div
      className={cn(
        "group relative mb-4 flex items-start md:px-4",
        isUser ? "flex-row-reverse" : ""
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-[800px] mx-auto items-start gap-4 px-4 py-6",
          isUser ? "flex-row-reverse" : ""
        )}
      >
        <div
          className={cn(
            "flex-1 space-y-4",
            isUser ? "text-right" : "text-left"
          )}
        >
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
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
                  disabled={!editContent.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 disabled:text-neutral-400 text-white rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save & Submit
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="prose prose-invert max-w-none font-[16px] text-white">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>

              {message.files && message.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {message.files.map((file, index) => {
                    // Determine if the file is an image based on URL or type
                    const isImage =
                      file.type === "image" ||
                      /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(file.url);
                    const isDocument =
                      file.type === "document" ||
                      /\.(pdf|doc|docx|txt|md)$/i.test(file.url);

                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-2",
                          isUser ? "justify-end" : "justify-start"
                        )}
                      >
                        {isImage ? (
                          <img
                            src={file.url}
                            alt={file.name || "Uploaded image"}
                            className="max-w-[300px] rounded-lg border border-neutral-700"
                          />
                        ) : isDocument ? (
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
                        ) : (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
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
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {file.name || "Download file"}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                className={cn(
                  "flex items-center gap-2",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {isUser && onEditMessage && messageIndex !== undefined && (
                  <button
                    onClick={handleEditStart}
                    className="flex items-center gap-1 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-neutral-800 rounded-lg transition-all text-neutral-400 hover:text-white"
                    title="Edit message"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}

                {!isUser && (
                  <>
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
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
