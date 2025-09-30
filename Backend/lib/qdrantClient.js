import { QdrantClient } from "@qdrant/js-client-rest";

// Tip: Use environment variables for sensitive data instead of hardcoding them.
const qdrantUrl =
  process.env.QDRANT_URL ||
  "https://f9e36f96-3aac-46ed-8d67-73a5f328f34a.us-west-1-0.aws.cloud.qdrant.io:6333";
const qdrantApiKey =
  process.env.QDRANT_API_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Td-bQXhDSqmZ6IU6oNU9trPgUR_cMDhEWfSzKJOAG-Y";

// Create a single, shared instance of the client
const qdrantClient = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
  checkCompatibility: false,
});

// Export the instance to be used in other files
export default qdrantClient;
