import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { qdrant } from "../config/qdrant.js";
import { embeddings } from "./embeddings.js";

const COLLECTION = "my_collection";

// Insert texts with metadata
export async function insertTexts(texts, metadatas) {
  const vectorStore = await QdrantVectorStore.fromTexts(
    texts,
    metadatas,
    embeddings,
    {
      client: qdrant,
      collectionName: COLLECTION,
    }
  );
  return vectorStore;
}

// Search by query
export async function searchTexts(query, k = 3) {
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      client: qdrant,
      collectionName: COLLECTION,
    }
  );
  return await vectorStore.similaritySearch(query, k);
}
