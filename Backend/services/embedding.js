import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

let embeddings;

try {
  // 1. Check for the new environment variable
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("❌ Missing GOOGLE_API_KEY in environment variables.");
  }

  // 2. Instantiate the new Google embeddings class
  embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "embedding-001",
  });

  console.log("✅ Google Embeddings initialized successfully!");
} catch (error) {
  console.error("⚠️ Error initializing embeddings:", error.message);
}

export { embeddings };
