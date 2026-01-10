import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Gemini LLM service for generating responses
 */
class GeminiService {
  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-2.5-flash",
      temperature: 0,
      maxRetries: 2,
    });
  }

  /**
   * Generate response from Gemini
   * @param {string} prompt - Prompt to send to Gemini
   * @returns {Promise<string>} Generated response
   */
  async generateResponse(prompt) {
    console.log("\n================ GEMINI REQUEST START ================");
    console.log("Prompt Preview:", prompt.substring(0, 100) + "...");
    console.log("======================================================\n");

    try {
      const response = await this.llm.invoke(prompt);
      console.log("Gemini API status: Success (via LangChain)");

      const text = response.content;

      if (typeof text !== "string") {
        console.error("❌ Invalid LangChain response structure:", response);
        throw new Error("Invalid Gemini API response structure.");
      }

      return text;
    } catch (error) {
      console.error("Error calling Gemini via LangChain:", error);
      throw error;
    }
  }

  /**
   * Generate query variations for better search
   * @param {string} originalQuery - Original user query
   * @returns {Promise<Array<string>>} Array of query variations
   */
  async generateQueryVariations(originalQuery) {
    console.log("\nGenerating query variations...");

    const prompt = `You are a disciplined AI API that expands a user's question into 3 versions.
Return ONLY a valid JSON array of strings, e.g. ["v1", "v2", "v3"].

User's Original Question:
"${originalQuery}"`;

    try {
      const res = await this.generateResponse(prompt);
      const cleaned = res.replace(/```json|```/g, "").trim();
      const generatedQueries = JSON.parse(cleaned);
      
      console.log("Generated query variations successfully.");
      
      // Return unique queries including original
      return [...new Set([originalQuery, ...generatedQueries])];
    } catch (error) {
      console.warn("Could not generate query variations, using only the original query.");
      return [originalQuery];
    }
  }

  /**
   * Generate final answer based on context
   * @param {string} context - Retrieved context
   * @param {string} query - User's query
   * @returns {Promise<string>} Generated answer
   */
  async generateAnswer(context, query) {
    console.log("\nGenerating final answer...");

    const prompt = `
Based on the following context, answer the question clearly and completely.

Formatting Rules:
1. Use triple backticks (\`\`\`) **only** for actual code (Python, JavaScript, etc.).
2. Do **not** wrap mathematical expressions (like y = mx + c, β₀, β₁ or other variables) inside (\`\`\`) blocks.
3. Remove unnecessary blank lines.
4. Maintain clean paragraph spacing — at most one blank line between paragraphs.
5. You can provide a table comparison view as well if needed.

CONTEXT:
${context}

USER'S QUESTION:
${query}
`;

    const answer = await this.generateResponse(prompt);
    console.log("✅ Final Answer Generated.");
    
    return answer;
  }
}

export default new GeminiService();
