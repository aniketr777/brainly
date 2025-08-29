


import qdrantClient from "../lib/qdrantClient.js";
import { embeddings } from "../services/embedding.js";
import fetch from "node-fetch";

// // Gemini service wrapper
const GeminiChatbot = {
  async generateResponse(prompt) {
    console.log("\n================ GEMINI REQUEST START ================");
    console.log("Prompt Preview:", prompt.substring(0, 300) + "...");
    console.log("======================================================\n");

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error(
          " GEMINI_API_KEY is not set in environment variables."
        );
      }

      const apiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=" +
        apiKey;
      const payload = { contents: [{ parts: [{ text: prompt }] }] };

      console.log("Sending request to Gemini API...");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log(" Gemini API status:", response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("❌ Gemini API Error Response:", errorBody);
        throw new Error(
          `Gemini API request failed with status ${response.status}`
        );
      }

      const result = await response.json();
      console.log(" Gemini API response received.");

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error(" Unexpected Gemini API response structure:", result);
        throw new Error("Failed to extract text from Gemini API response.");
      }
      return text;
    } catch (error) {
      console.error(" Error calling Gemini API:", error);
      return "Sorry, I encountered an error while generating a response.";
    }
  },
};

export const chatController = async (req, res) => {
  console.log("\n================= CHAT CONTROLLER START =================");
  try {
    const { query: originalQuery } = req.body;
    const { userId } = req.auth();
    const collectionName = "documents_collection";



    if (!originalQuery) {
      console.log(" No query provided in request body.");
      return res.status(400).json({ error: "Query is required" });
    }

    // ---  Generate Query Variations  (optimisation) ---
    console.log("\n Generating query variations...");
    const generateQueriesPrompt = `You are a highly-disciplined AI assistant that functions as a JSON API. Your task is to rephrase and expand a user's question into 3 distinct versions to improve document retrieval from a vector database.

    Follow these rules strictly:
    1.  Generate questions that cover different angles, keywords, and perspectives.
    2.  Your output MUST be a valid JSON array of strings.
    3.  Do NOT include any explanations, introductory text, or Markdown code blocks like \`\`\`json.
    4.  Your response must start with '[' and end with ']'.

    User's Original Question:
    "${originalQuery}"`;

    let queries = [originalQuery];
    try {
      const variationsResponse = await GeminiChatbot.generateResponse(
        generateQueriesPrompt
      );
      // console.log(" Raw variations response:", variationsResponse);

      // removing the markdown/ json if the content is wrapped in it 
      const cleanedResponse = variationsResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const generatedQueries = JSON.parse(cleanedResponse);
      queries.push(...generatedQueries);
      console.log(" Generated query variations successfully.");
    } catch (error) {
      console.warn(
        " Could not generate query variations, proceeding with original query.",
        error.message
      );
    }
    // putting all the queries in set to remove duplicate 
    queries = [...new Set(queries)];
    console.log(" Final queries to search with:", queries);

    // --- 2. Embed all queries ---
    console.log("\n Generating embeddings for queries...");
    const queryVectors = await Promise.all(
      queries.map(async (q, i) => {
        const vec = await embeddings.embedQuery(q);
        return vec;
      })
    );
    console.log(" Embeddings generated for all queries.");

    // --- 3. Perform Batch Search ---
    console.log("\n Performing batch search in Qdrant...");

    const searchRequests = queryVectors.map((vector, idx) => ({
      vector,
      limit: 3,
      with_payload: true, //  to get the text chunk and other metdata 
      filter: {
        must: [{ key: "userId", match: { value: userId } }],
      }
      ,
      score_threshold:0.2
    }));
    

    const batchSearchResults = await qdrantClient.searchBatch(collectionName, {
      searches: searchRequests,
    });

    console.log(
      "Raw Batch Search Results:",
      JSON.stringify(batchSearchResults, null, 2)
    );

    // --- 4. De-duplicate and combine results ---
    console.log("\n Deduplicating results...");
    const uniqueResults = new Map();
    // .flat ->  to return the text in a single array 
    batchSearchResults.flat().forEach((hit) => {
      if (hit && hit.id && !uniqueResults.has(hit.id)) {
        uniqueResults.set(hit.id, hit);
      }
    });

    let searchResults = Array.from(uniqueResults.values());
    searchResults.sort((a, b) => b.score - a.score);

    if (searchResults.length === 0) {
      console.log("❌ No relevant results found in Qdrant.");
      return res.json({
        answer:
          "I couldn't find any relevant information in your documents to answer that question.",
        sources: [],
      });
    }

    // --- 5. Prepare Context ---
    // Search result is a array with multiple hits , so we need to extract all the text +  combine it + remove empty lines
    console.log("\n Preparing context from search results...");
    const context = searchResults
      .map((hit) => hit?.payload?.text || "")
      .filter(Boolean)
      .join("\n\n---\n\n");

    console.log(" Context length:", context.length);

    const sources = searchResults.map((hit) => {
      const { text, userId, ...metadata } = hit.payload || {};
      return metadata;
    });

    // --- 6. Generate Final Answer ---
    console.log("\n Generating final answer from Gemini...");
    const finalPrompt = `
        Based on the following context, please provide a comprehensive answer to the user's question.
      Do not mention the context in your answer. Just answer the question directly.
      Please follow this Rule :  1) That when ever you are writting code in any language , then please first write the code block in triple backticks. 2) Dont go out of Context 
      CONTEXT:
      ${context}

    USER'S QUESTION:
      ${originalQuery} `;

    const answer = await GeminiChatbot.generateResponse(finalPrompt);
    console.log(" Final Answer Generated.");

    res.json({ answer, sources });
  } catch (err) {
    console.error(" Chat controller error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
  console.log("================= CHAT CONTROLLER END =================\n");
};

