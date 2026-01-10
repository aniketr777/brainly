import { randomUUID } from "crypto";
import { embeddings } from "../services/embedding.js";
import { upsertVectors } from "./qdrantHelper.js";

/**
 * Generate embeddings and store in Qdrant
 * @param {Array<string>} texts - Array of text chunks
 * @param {string} collectionName - Qdrant collection name
 * @param {string} userId - User ID
 * @param {string} mongoId - MongoDB document ID
 * @param {Object} metadata - Additional metadata
 */
export const generateAndStoreEmbeddings = async (
  texts,
  collectionName,
  userId,
  mongoId,
  metadata = {}
) => {
  const vectors = await embeddings.embedDocuments(texts);
  
  const points = vectors.map((vector, i) => ({
    id: randomUUID(),
    vector,
    payload: {
      text: texts[i],
      userId,
      mongoId,
      ...metadata,
    },
  }));

  await upsertVectors(collectionName, points);
  
  console.log(`✅ Stored ${points.length} embeddings in Qdrant`);
};
