import { MemoryClient } from "mem0ai";

const mem0Client = new MemoryClient({
  apiKey: process.env.NEXT_PUBLIC_MEM0_API_KEY || "",
});

export interface MemorySearchResult {
  id: string;
  memory: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryAddOptions {
  userId: string;
  chatId?: string;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchOptions {
  userId: string;
  limit?: number;
  threshold?: number;
}

interface MemoryApiResponse {
  memory: string;
  score: number;
  metadata?: Record<string, unknown>;
  id?: string;
}

interface ChatMessage {
  role: string;
  content: string;
  files?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Add memories to Mem0 from conversation context
 */
export async function addMemory(
  text: string,
  options: MemoryAddOptions
): Promise<void> {
  try {
    const { userId, chatId, metadata = {} } = options;

    console.log("Adding memory to Mem0:", {
      userId,
      chatId,
      textLength: text.length,
    });

    // Convert text to the message format expected by mem0 API
    const messages = [
      {
        role: "user" as const,
        content: text,
      },
    ];

    // Add memory using mem0 API
    await mem0Client.add(messages, {
      user_id: userId,
      metadata: {
        ...metadata,
        chat_id: chatId,
        timestamp: new Date().toISOString(),
      },
    });

    console.log("Memory added successfully");
  } catch (error) {
    console.error("Error adding memory:", error);
    // Don't throw error to avoid breaking chat flow
  }
}

export async function searchMemories(
  query: string,
  options: MemorySearchOptions
): Promise<MemorySearchResult[]> {
  try {
    const { userId, limit = 10, threshold = 0.7 } = options;

    console.log("Searching memories in Mem0:", {
      query: query.substring(0, 100) + "...",
      userId,
      limit,
      threshold,
    });

    const response = (await mem0Client.search(query, {
      user_id: userId,
      limit,
    })) as MemoryApiResponse[];

    const filteredResults: MemorySearchResult[] = response
      .filter((result: MemoryApiResponse) => result.score >= threshold)
      .map((result: MemoryApiResponse) => ({
        id: result.id || "",
        memory: result.memory,
        score: result.score,
        metadata: result.metadata,
      }));

    console.log(`Found ${filteredResults.length} relevant memories`);
    return filteredResults;
  } catch (error) {
    console.error("Error searching memories:", error);
    return [];
  }
}

export async function getChatMemories(
  userId: string,
  chatId: string
): Promise<MemorySearchResult[]> {
  try {
    const response = (await mem0Client.getAll({
      user_id: userId,
    })) as MemoryApiResponse[];

    const chatMemories = response
      .filter(
        (memory: MemoryApiResponse) => memory.metadata?.chat_id === chatId
      )
      .map((memory: MemoryApiResponse) => ({
        id: memory.id || "",
        memory: memory.memory,
        score: 1.0,
        metadata: memory.metadata,
      }));

    return chatMemories;
  } catch (error) {
    console.error("Error getting chat memories:", error);
    return [];
  }
}

export async function deleteChatMemories(
  userId: string,
  chatId: string
): Promise<void> {
  try {
    const memories = (await mem0Client.getAll({
      user_id: userId,
    })) as MemoryApiResponse[];

    // Find and delete memories for this chat
    const chatMemoryIds = memories
      .filter(
        (memory: MemoryApiResponse) => memory.metadata?.chat_id === chatId
      )
      .map((memory: MemoryApiResponse) => memory.id)
      .filter((id): id is string => id !== undefined);

    for (const memoryId of chatMemoryIds) {
      await mem0Client.delete(memoryId);
    }

    console.log(`Deleted ${chatMemoryIds.length} memories for chat ${chatId}`);
  } catch (error) {
    console.error("Error deleting chat memories:", error);
  }
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export function getModelTokenLimit(model: string): number {
  const limits: Record<string, number> = {
    "gpt-4o": 128000,
    "gpt-4-turbo": 128000,
    "gpt-4": 8192,
    "gpt-3.5-turbo": 16385,
    "gpt-4o-mini": 128000,
  };

  return limits[model] || 8192;
}

export async function prepareContextWithMemory(
  currentQuery: string,
  recentMessages: ChatMessage[],
  userId: string,
  model: string = "gpt-4o"
): Promise<ChatMessage[]> {
  try {
    const maxTokens = getModelTokenLimit(model);
    const reservedTokensForResponse = 4000;
    const availableTokens = maxTokens - reservedTokensForResponse;

    const relevantMemories = await searchMemories(currentQuery, {
      userId,
      limit: 15,
      threshold: 0.6,
    });

    // Prepare context messages
    const contextMessages: ChatMessage[] = [];

    // Add system message
    const systemMessage: ChatMessage = {
      role: "system",
      content:
        "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown. When analyzing images, provide detailed and helpful descriptions and answers.",
    };
    contextMessages.push(systemMessage);

    // Add relevant memories as context
    if (relevantMemories.length > 0) {
      const memoryContext = relevantMemories
        .slice(0, 5) // Limit to top 5 memories
        .map((m) => m.memory)
        .join("\n");

      contextMessages.push({
        role: "system",
        content: `Previous conversation context:\n${memoryContext}`,
      });
    }

    // Add recent messages with token limit management
    let currentTokenCount = estimateTokenCount(
      contextMessages.map((m) => m.content).join("")
    );

    // Add recent messages in reverse order (most recent first)
    const messagesToAdd: ChatMessage[] = [];
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const message = recentMessages[i];
      const messageTokens = estimateTokenCount(JSON.stringify(message));

      if (currentTokenCount + messageTokens > availableTokens * 0.8) {
        console.log(
          `Token limit reached. Including ${messagesToAdd.length} recent messages.`
        );
        break;
      }

      messagesToAdd.unshift(message);
      currentTokenCount += messageTokens;
    }

    contextMessages.push(...messagesToAdd);

    console.log("Context prepared:", {
      systemMessages: 1,
      memoryContexts: relevantMemories.length > 0 ? 1 : 0,
      recentMessages: messagesToAdd.length,
      totalMessages: contextMessages.length,
      estimatedTokens: currentTokenCount,
    });

    return contextMessages;
  } catch (error) {
    console.error("Error preparing context with memory:", error);

    // Fallback to recent messages only
    const fallbackMessages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using Markdown.",
      },
      ...recentMessages.slice(-10), // Last 10 messages as fallback
    ];

    return fallbackMessages;
  }
}

export default mem0Client;
