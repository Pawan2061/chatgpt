"use client";

import { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Check, X } from "lucide-react";

interface ChatMessageProps {
  message: Message;
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
            // Edit mode
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
            // Normal display mode
            <>
              <div className="prose prose-invert max-w-none font-[16px] text-white">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>

              {/* Action buttons */}
              <div
                className={cn(
                  "flex items-center gap-2",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {/* Edit button for user messages */}
                {isUser && onEditMessage && messageIndex !== undefined && (
                  <button
                    onClick={handleEditStart}
                    className="flex items-center gap-1 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-neutral-800 rounded-lg transition-all text-neutral-400 hover:text-white"
                    title="Edit message"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}

                {/* Assistant message actions */}
                {!isUser && (
                  <>
                    {/* Copy button */}
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

                    {/* Thumbs up */}
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

                    {/* Thumbs down */}
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

                    {/* More options */}
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

                    {/* Share */}
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
