"use client";

import { useState, useEffect } from "react";
import { searchMemories } from "@/lib/mem0";
import {
  Search,
  Clock,
  MessageSquare,
  Hash,
  FileText,
  Image,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<"all" | "search">("all");

  const userId = "test-user";

  const loadAllMemories = async () => {
    setLoading(true);
    try {
      const results = await searchMemories("", {
        userId,
        limit: 50,
        threshold: 0.1,
      });
      setMemories(results);
    } catch (error) {
      console.error("Error loading memories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchMode("all");
      loadAllMemories();
      return;
    }

    setLoading(true);
    setSearchMode("search");
    try {
      const results = await searchMemories(searchQuery, {
        userId,
        limit: 20,
        threshold: 0.5,
      });
      setMemories(results);
    } catch (error) {
      console.error("Error searching memories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMemories();
  }, []);

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return "Unknown time";
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Your Memories
          </h1>
          <p className="text-muted-foreground">
            View and search through your conversation memories stored by AI
          </p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search your memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="shrink-0"
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
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
            >
              Show all memories
            </Button>
          )}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading memories...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {memories.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No memories found
                  </h3>
                  <p className="text-muted-foreground">
                    {searchMode === "search"
                      ? "Try a different search term or browse all memories."
                      : "Start chatting to create your first memories!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              memories.map((memory) => (
                <Card
                  key={memory.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <CardHeader className="pb-3">
                    <div className="space-y-1">
                      <p className="text-sm leading-relaxed">
                        {truncateText(memory.memory)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {memory.metadata?.timestamp && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(memory.metadata.timestamp)}</span>
                        </div>
                      )}

                      {memory.metadata?.chat_id && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Hash className="w-3 h-3" />
                          <span className="font-mono">
                            {memory.metadata.chat_id.slice(-8)}
                          </span>
                        </div>
                      )}

                      {memory.score && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(memory.score * 100)}% match
                        </Badge>
                      )}

                      {memory.metadata?.hasFiles && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          Files
                        </Badge>
                      )}

                      {memory.metadata?.hasImages && (
                        <Badge variant="outline" className="text-xs">
                          <Image className="w-3 h-3 mr-1" />
                          Images
                        </Badge>
                      )}
                    </div>

                    {memory.metadata?.userQuery && (
                      <>
                        <Separator className="mb-3" />
                        <p className="text-xs text-muted-foreground italic">
                          Original query: &ldquo;{memory.metadata.userQuery}
                          &rdquo;
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
