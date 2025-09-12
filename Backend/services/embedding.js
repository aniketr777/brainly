import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import dotenv from "dotenv";

dotenv.config();

export const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGING_FACE_HUB_TOKEN,
  model: "sentence-transformers/all-MiniLM-L6-v2",
  provider: "hf-inference",
});
