const { default: mongoose } = require("mongoose");

const connection = {};

export const connectToDb = async () => {
  try {
    // Check if there is an existing connection
    if (connection.isConnected) {
      console.log("Using existing MongoDB connection");
      return;
    }

    // Await the connection to MongoDB
    const db = await mongoose.connect(process.env.MONGODB_URI);

    // Set connection status to avoid reconnecting
    connection.isConnected = db.connections[0].readyState;

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};
