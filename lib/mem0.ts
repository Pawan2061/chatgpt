import { MemoryClient } from "mem0ai";

if (!process.env.MEM0_API_KEY) {
  console.warn(
    "MEM0_API_KEY is not defined - memory functionality will be disabled"
  );
}

const mem0Client = process.env.MEM0_API_KEY
  ? new MemoryClient({
      apiKey: process.env.MEM0_API_KEY,
    })
  : null;

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
    if (!mem0Client) {
      console.warn("MEM0 client not initialized - skipping memory addition");
      return;
    }

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
  }
}

export async function searchMemories(
  query: string,
  options: MemorySearchOptions
): Promise<MemorySearchResult[]> {
  try {
    if (!mem0Client) {
      console.warn("MEM0 client not initialized - returning empty results");
      return [];
    }

    const { userId, limit = 10, threshold = 0.3 } = options; // Lowered threshold from 0.5 to 0.3 for better recall

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

    console.log(
      "Raw memory search response:",
      JSON.stringify(response, null, 2)
    );

    const filteredResults: MemorySearchResult[] = response
      .filter((result: MemoryApiResponse) => {
        console.log(
          `Memory score: ${result.score}, threshold: ${threshold}, passes: ${
            result.score >= threshold
          }`
        );
        return result.score >= threshold;
      })
      .map((result: MemoryApiResponse) => ({
        id: result.id || "",
        memory: result.memory,
        score: result.score,
        metadata: result.metadata,
      }));

    console.log(
      `Found ${filteredResults.length} relevant memories out of ${response.length} total memories`
    );

    // Also log the memories that were filtered out
    const filteredOut = response.filter((r) => r.score < threshold);
    if (filteredOut.length > 0) {
      console.log(
        "Memories filtered out due to low score:",
        filteredOut.map((r) => ({
          score: r.score,
          memory: r.memory.substring(0, 100) + "...",
        }))
      );
    }

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
    if (!mem0Client) {
      console.warn("MEM0 client not initialized - returning empty results");
      return [];
    }

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
    if (!mem0Client) {
      console.warn("MEM0 client not initialized - skipping memory deletion");
      return;
    }

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

    let relevantMemories: MemorySearchResult[] = [];

    // Only search memories if mem0Client is available
    if (mem0Client) {
      console.log("=== Memory Search Debug ===");
      console.log("Current query:", currentQuery);
      console.log("User ID:", userId);

      relevantMemories = await searchMemories(currentQuery, {
        userId,
        limit: 15,
        threshold: 0.3, // Lowered threshold for better recall
      });

      console.log("Relevant memories found:", relevantMemories.length);
      if (relevantMemories.length > 0) {
        console.log(
          "Top memories:",
          relevantMemories.slice(0, 3).map((m) => ({
            score: m.score,
            memory: m.memory.substring(0, 100) + "...",
            chatId: m.metadata?.chat_id,
          }))
        );
      }
    } else {
      console.warn(
        "MEM0 client not available - proceeding without memory context"
      );
    }

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
        .map(
          (m) =>
            `[Previous conversation - Score: ${m.score.toFixed(2)}]: ${
              m.memory
            }`
        )
        .join("\n\n");

      contextMessages.push({
        role: "system",
        content: `Previous conversation context from your memory:\n\n${memoryContext}`,
      });

      console.log(
        "Added memory context with",
        relevantMemories.slice(0, 5).length,
        "memories"
      );
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
