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

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env"
    );
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    connection.isConnected = db.connections[0].readyState;
    console.log("MongoDB Connected Successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export default connectDB;
