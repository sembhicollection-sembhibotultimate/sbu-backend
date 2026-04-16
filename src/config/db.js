import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn("MONGODB_URI not found. Running without database connection.");
    return;
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}
