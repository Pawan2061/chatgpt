import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
  files?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat extends Document {
  userId: string;
  messages: IMessage[];
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      required: true,
      enum: ["user", "assistant", "system"],
    },
    content: {
      type: String,
      required: true,
    },
    files: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const ChatSchema = new Schema<IChat>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    messages: [MessageSchema],
    title: String,
  },
  { timestamps: true }
);

// Create indexes for better query performance
ChatSchema.index({ createdAt: -1 });
ChatSchema.index({ userId: 1, createdAt: -1 });

// Check if the model exists before creating a new one
export const Chat: Model<IChat> =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
