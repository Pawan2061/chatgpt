export interface ChatItem {
  id: string;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages: Array<{
    id: string;
    content: string;
    role: "user" | "assistant";
    createdAt: Date | string;
  }>;
}
