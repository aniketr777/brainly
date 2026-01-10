import geminiService from "../services/geminiService.js";
import retrievalService from "../services/retrievalService.js";
import { ValidationError } from "../utils/errors.js";
import { isValidText } from "../utils/validation.js";

const COLLECTION_NAME = "store";

/**
 * Chat controller - handles RAG-based question answering
 */
export const chatController = async (req, res) => {
  console.log("\n================= CHAT CONTROLLER START =================");

  try {
    const { query: originalQuery } = req.body;
    const { userId } = req.auth();

    // Validation
    if (!originalQuery || !isValidText(originalQuery)) {
      throw new ValidationError("Query is required");
    }

    // Step 1: Generate query variations
    const queries = await geminiService.generateQueryVariations(originalQuery);

    // Step 2: Generate embeddings for all query variations
    const queryVectors = await retrievalService.generateEmbeddings(queries);

    // Step 3: Perform dense (vector) search
    const denseResults = await retrievalService.performDenseSearch(
      queryVectors,
      userId,
      COLLECTION_NAME
    );

    // Check if any results found
    if (denseResults.length === 0) {
      console.log("❌ No relevant results found.");
      return res.json({
        success: true,
        answer: "I couldn't find any relevant information in your documents.",
        sources: [],
      });
    }

    // Step 4: Perform sparse (BM25) search
    const bm25Results = await retrievalService.performSparseSearch(
      denseResults,
      originalQuery
    );

    // Step 5: Merge results using hybrid fusion
    const finalResults = retrievalService.hybridMerge(
      denseResults,
      bm25Results
    );

    // Step 6: Prepare context and sources
    const { context, sources } = retrievalService.prepareContextAndSources(
      finalResults,
      denseResults
    );

    // Step 7: Generate final answer using Gemini
    const answer = await geminiService.generateAnswer(context, originalQuery);

    res.json({
      success: true,
      answer,
      sources,
    });

  } catch (err) {
    console.error("Chat controller error:", err);

    if (!res.headersSent) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  console.log("================= CHAT CONTROLLER END =================\n");
};