import { embeddings } from "../services/embedding.js";
import { batchSearchVectors } from "../utils/qdrantHelper.js";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";

const SEARCH_LIMIT = 10;
const SCORE_THRESHOLD = 0.3;
const DENSE_WEIGHT = 0.7;
const SPARSE_WEIGHT = 0.3;

/**
 * Retrieval service for hybrid search
 */
class RetrievalService {
  /**
   * Generate embeddings for queries
   * @param {Array<string>} queries - Array of query strings
   * @returns {Promise<Array>} Array of embeddings
   */
  async generateEmbeddings(queries) {
    console.log("\nGenerating embeddings...");
    return Promise.all(queries.map((q) => embeddings.embedQuery(q)));
  }

  /**
   * Perform dense (vector) search in Qdrant
   * @param {Array} queryVectors - Array of query vectors
   * @param {string} userId - User ID for filtering
   * @param {string} collectionName - Qdrant collection name
   * @returns {Promise<Array>} Dense search results
   */
  async performDenseSearch(queryVectors, userId, collectionName) {
    console.log("\nPerforming dense search in Qdrant...");

    const searchRequests = queryVectors.map((vector) => ({
      vector,
      limit: SEARCH_LIMIT,
      with_payload: true,
      filter: { must: [{ key: "userId", match: { value: userId } }] },
      score_threshold: SCORE_THRESHOLD,
    }));

    const results = await batchSearchVectors(collectionName, searchRequests);

    // Deduplicate results
    const unique = new Map();
    results.flat().forEach((hit) => {
      if (hit && hit.id && !unique.has(hit.id)) {
        unique.set(hit.id, hit);
      }
    });

    const denseResults = Array.from(unique.values()).sort(
      (a, b) => b.score - a.score
    );

    console.log(`Dense results found: ${denseResults.length}`);
    return denseResults;
  }

  /**
   * Perform sparse (keyword) search using BM25
   * @param {Array} denseResults - Results from dense search
   * @param {string} originalQuery - Original user query
   * @returns {Promise<Array>} BM25 search results
   */
  async performSparseSearch(denseResults, originalQuery) {
    console.log("\nRunning BM25 (keyword) retriever...");

    const allDocs = denseResults.map((r) => ({
      pageContent: r?.payload?.text || "",
      metadata: r?.payload || {},
    }));

    if (allDocs.length === 0) {
      console.log("No documents for BM25 retrieval");
      return [];
    }

    const bm25Retriever = await BM25Retriever.fromDocuments(allDocs);
    const bm25Results = await bm25Retriever.invoke(originalQuery);

    console.log(`BM25 results found: ${bm25Results.length}`);
    return bm25Results;
  }

  /**
   * Merge dense and sparse results using weighted fusion
   * @param {Array} denseResults - Dense search results
   * @param {Array} bm25Results - BM25 search results
   * @returns {Array<string>} Merged and ranked results
   */
  hybridMerge(denseResults, bm25Results) {
    console.log("\nMerging dense and sparse results...");

    const hybridMap = new Map();

    // Add dense results with weight
    denseResults.forEach((r) => {
      const text = r.payload?.text || "";
      hybridMap.set(text, (hybridMap.get(text) || 0) + r.score * DENSE_WEIGHT);
    });

    // Add sparse results with weight
    bm25Results.forEach((r) => {
      const text = r.pageContent || "";
      hybridMap.set(
        text,
        (hybridMap.get(text) || 0) + (r.score || 1) * SPARSE_WEIGHT
      );
    });

    // Sort by combined score and return top results
    const finalResults = Array.from(hybridMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, SEARCH_LIMIT)
      .map(([text]) => text);

    console.log(`Final merged results: ${finalResults.length}`);
    return finalResults;
  }

  /**
   * Prepare context and sources from results
   * @param {Array<string>} finalResults - Final merged text results
   * @param {Array} denseResults - Original dense results for metadata
   * @returns {Object} Context string and sources array
   */
  prepareContextAndSources(finalResults, denseResults) {
    console.log("\nPreparing context and sources...");

    const context = finalResults.join("\n\n---\n\n");
    const seen = new Set();

    const sources = denseResults
      .map((hit) => {
        const { text, userId, ...metadata } = hit.payload || {};
        return metadata;
      })
      .filter((meta) => {
        const id = meta.id || meta.link || JSON.stringify(meta);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, SEARCH_LIMIT);

    console.log("Context ready, length:", context.length);
    return { context, sources };
  }
}

export default new RetrievalService();
