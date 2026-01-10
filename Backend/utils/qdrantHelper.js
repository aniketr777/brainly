import qdrantClient from "../lib/qdrantClient.js";

const VECTOR_SIZE = 384;
const DISTANCE_METRIC = "Cosine";

/**
 * Ensure Qdrant collection exists, create if not
 * @param {string} collectionName - Name of the collection
 */
export const ensureCollectionExists = async (collectionName) => {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === collectionName
    );

    if (!collectionExists) {
      console.log(`Collection "${collectionName}" not found. Creating...`);
      
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: VECTOR_SIZE,
          distance: DISTANCE_METRIC,
        },
      });
      
      console.log(`Collection "${collectionName}" created.`);

      // Create payload indexes for efficient filtering
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: "mongoId",
        field_schema: "keyword",
        wait: true,
      });
      
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: "userId",
        field_schema: "keyword",
        wait: true,
      });
      
      console.log(`Payload indexes for "mongoId" and "userId" created.`);
    }
  } catch (err) {
    console.error(
      `Error in ensureCollectionExists for "${collectionName}":`,
      err
    );
    throw err;
  }
};

/**
 * Upsert vectors to Qdrant collection
 * @param {string} collectionName - Name of the collection
 * @param {Array} points - Array of points to upsert
 */
export const upsertVectors = async (collectionName, points) => {
  await ensureCollectionExists(collectionName);
  await qdrantClient.upsert(collectionName, { points });
};

/**
 * Delete vectors from Qdrant by mongoId
 * @param {string} collectionName - Name of the collection
 * @param {string} mongoId - MongoDB document ID
 */
export const deleteVectorsByMongoId = async (collectionName, mongoId) => {
  await qdrantClient.delete(collectionName, {
    filter: {
      must: [{ key: "mongoId", match: { value: mongoId } }],
    },
  });
};

/**
 * Search vectors in Qdrant
 * @param {string} collectionName - Name of the collection
 * @param {Array} vector - Query vector
 * @param {string} userId - User ID for filtering
 * @param {number} limit - Number of results to return
 * @param {number} scoreThreshold - Minimum score threshold
 * @returns {Promise<Array>} Search results
 */
export const searchVectors = async (
  collectionName,
  vector,
  userId,
  limit = 10,
  scoreThreshold = 0.3
) => {
  return await qdrantClient.search(collectionName, {
    vector,
    limit,
    with_payload: true,
    filter: { must: [{ key: "userId", match: { value: userId } }] },
    score_threshold: scoreThreshold,
  });
};

/**
 * Batch search vectors in Qdrant
 * @param {string} collectionName - Name of the collection
 * @param {Array} searches - Array of search requests
 * @returns {Promise<Array>} Batch search results
 */
export const batchSearchVectors = async (collectionName, searches) => {
  return await qdrantClient.searchBatch(collectionName, { searches });
};
