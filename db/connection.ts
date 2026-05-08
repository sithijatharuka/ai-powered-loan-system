import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define MONGODB_URI in .env.local"
  );
}

// Prevent multiple connections in development
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  // If already connected
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection
  if (!cached.promise) {
    cached.promise = mongoose.connect(
      MONGODB_URI,
      {
        dbName: "loan_system",
      }
    );
  }

  cached.conn = await cached.promise;

  console.log("MongoDB Connected");

  return cached.conn;
}