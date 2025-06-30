export interface ChatItem {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    content: string;
    role: "user" | "assistant";
    createdAt: Date;
  }>;
}
