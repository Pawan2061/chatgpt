import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
  }

  if (cached.conn) {
    console.log("Using cached MongoDB connection");
    return cached.conn;
  }

  if (cached.promise) {
    console.log("Waiting for existing MongoDB connection promise");
    cached.conn = await cached.promise;
    return cached.conn;
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
    // Create a new connection promise
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      // Removed bufferCommands: false as it can cause issues in serverless environments
    });

    // Wait for the connection to be established
    cached.conn = await cached.promise;

    console.log("MongoDB Connected Successfully!");
    console.log("Database name:", cached.conn.connections[0].name);
    console.log("Connection state:", cached.conn.connections[0].readyState);

    return cached.conn;
  } catch (error) {
    // Clear the promise if connection fails
    cached.promise = null;
    console.error("Error connecting to MongoDB:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
    }
    throw error;
  }
}

export default connectDB;
