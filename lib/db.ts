import mongoose, { Connection as MongooseConnection } from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongoose:
    | {
        conn: MongooseConnection | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

interface ConnectionState {
  isConnected?: number;
}

const connection: ConnectionState = {};

async function connectDB() {
  if (connection.isConnected) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  console.log("Attempting to connect to MongoDB...");
  console.log("MongoDB URI exists:", !!MONGODB_URI);

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env"
    );
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      bufferCommands: false,
    });
    connection.isConnected = db.connections[0].readyState;
    console.log("MongoDB Connected Successfully!");
    console.log("Database name:", db.connections[0].name);
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
    }
    throw error;
  }
}

export default connectDB;
