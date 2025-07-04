"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Clock,
  MessageSquare,
  Hash,
  FileText,
  Image,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

interface Memory {
  id: string;
  memory: string;
  score: number;
  metadata?: {
    timestamp?: string;
    chat_id?: string;
    messageCount?: number;
    hasFiles?: boolean;
    hasImages?: boolean;
    userQuery?: string;
    responseLength?: number;
  };
}

export default function MemoriesPage() {
  const { user } = useUser();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<"all" | "search">("all");
  const [error, setError] = useState<string | null>(null);

  const loadAllMemories = async () => {
    if (!user?.id) {
      setError("Please sign in to view memories");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/memories`);
      if (!response.ok) {
        throw new Error("Failed to fetch memories");
      }
      const results = await response.json();
      setMemories(results);
      if (results.length === 0) {
        setError("No memories found. Start chatting to create memories!");
      }
    } catch (error) {
      console.error("Error loading memories:", error);
      setError("Failed to load memories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!user?.id) {
      setError("Please sign in to search memories");
      return;
    }

    if (!searchQuery.trim()) {
      setSearchMode("all");
      loadAllMemories();
      return;
    }

    setLoading(true);
    setSearchMode("search");
    setError(null);
    try {
      const response = await fetch(
        `/api/memories?query=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        throw new Error("Failed to search memories");
      }
      const results = await response.json();
      setMemories(results);
      if (results.length === 0) {
        setError("No memories found for your search. Try a different query.");
      }
    } catch (error) {
      console.error("Error searching memories:", error);
      setError("Failed to search memories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadAllMemories();
    }
  }, [user?.id]);

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return "Unknown time";
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center">
        <div className="w-full max-w-md mx-4 bg-[#2f2f2f] rounded-lg p-6 text-center">
          <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-white">
            Sign in to view memories
          </h3>
          <p className="text-neutral-400">
            Your chat memories will appear here after you sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121]">
      <div className="container max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">
            Your Memories
          </h1>
          <p className="text-neutral-400">
            View and search through your conversation memories stored by AI
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search your memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-[#2f2f2f] border-neutral-600 text-white placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-500"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="shrink-0 bg-[#10a37f] hover:bg-[#0d8f6b] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-neutral-400">
            {searchMode === "search" ? (
              <>
                Showing {memories.length} results for &ldquo;{searchQuery}
                &rdquo;
              </>
            ) : (
              <>Showing {memories.length} memories</>
            )}
          </p>
          {searchMode === "search" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSearchMode("all");
                loadAllMemories();
              }}
              className="text-neutral-400 hover:text-white hover:bg-[#2f2f2f]"
            >
              Show all memories
            </Button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#10a37f]" />
            <p className="text-neutral-400 mt-2">Loading memories...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="text-center py-12 bg-[#2f2f2f] rounded-lg">
            <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-white">{error}</h3>
          </div>
        )}

        {/* Memories list */}
        {!loading && !error && (
          <div className="space-y-4">
            {memories.length === 0 ? (
              <div className="text-center py-12 bg-[#2f2f2f] rounded-lg">
                <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-white">
                  No memories found
                </h3>
                <p className="text-neutral-400">
                  {searchMode === "search"
                    ? "Try a different search term or browse all memories."
                    : "Start chatting to create your first memories!"}
                </p>
              </div>
            ) : (
              memories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-[#2f2f2f] rounded-lg p-4 hover:bg-[#3f3f3f] transition-colors"
                >
                  <div className="mb-3">
                    <p className="text-sm leading-relaxed text-white">
                      {truncateText(memory.memory)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {memory.metadata?.timestamp && (
                      <div className="flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(memory.metadata.timestamp)}</span>
                      </div>
                    )}

                    {memory.metadata?.chat_id && (
                      <div className="flex items-center gap-1 text-xs text-neutral-400">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono">
                          {memory.metadata.chat_id.slice(-8)}
                        </span>
                      </div>
                    )}

                    {memory.score && (
                      <div className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded">
                        {Math.round(memory.score * 100)}% match
                      </div>
                    )}

                    {memory.metadata?.hasFiles && (
                      <div className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Files
                      </div>
                    )}

                    {memory.metadata?.hasImages && (
                      <div className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        Images
                      </div>
                    )}
                  </div>

                  {memory.metadata?.userQuery && (
                    <>
                      <div className="border-t border-neutral-600 mb-3"></div>
                      <p className="text-xs text-neutral-400 italic">
                        Original query: &ldquo;{memory.metadata.userQuery}
                        &rdquo;
                      </p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
