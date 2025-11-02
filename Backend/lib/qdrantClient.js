
import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("./.env") });
// console.log("Qdrant URL:", process.env.QDRANT_URL);
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  checkCompatibility: false,
});

export default qdrant;