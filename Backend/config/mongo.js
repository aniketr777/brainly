import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://aniketrathore9361:aniket88822@cluster0.aphjjev.mongodb.net/Rag";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully!");
  } catch (e) {
    console.error("❌ MongoDB connection error:", e);
    process.exit(1);
  }
};

export default connectDB;
