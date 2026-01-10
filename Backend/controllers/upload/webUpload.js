import Exa from "exa-js";
import Web from "../../model/web-collection.js";
import { splitText } from "../../utils/textProcessor.js";
import { generateAndStoreEmbeddings } from "../../utils/embeddingHelper.js";
import { validateUserPlan, incrementUsage } from "../../utils/planManager.js";
import { deleteVectorsByMongoId } from "../../utils/qdrantHelper.js";
import { ValidationError } from "../../utils/errors.js";
import { isValidUrl } from "../../utils/validation.js";

const COLLECTION_NAME = "store";

/**
 * Upload and process web content
 */
export const webUpload = async (req, res) => {
  let mongoId = null;

  try {
    const { url } = req.body;
    const { userId } = req.auth();
    const { plan, free_usage } = req;

    // Validation
    if (!url || !isValidUrl(url)) {
      throw new ValidationError("Valid URL is required");
    }

    // Check user plan
    await validateUserPlan(userId, plan, free_usage);

    // Fetch web content from Exa
    const exa = new Exa(process.env.EXA_API_KEY);
    
    const result = await exa.getContents([url], {
      text: true,
      context: true,
      subpages: 1,
      livecrawl: "fallback",
    });

    const page = result?.results?.[0];
    
    if (!page?.text) {
      throw new ValidationError("No content fetched from the given URL");
    }

    const fullText = page.text;

    // Create metadata
    const metadata = {
      title: page.title || "Untitled Webpage",
      url: page.url || url,
      publishedDate: page.publishedDate || null,
      author: page.author || "",
      type: "web",
    };

    // Split text into chunks
    const texts = await splitText(fullText, "web");

    // Create MongoDB record
    const doc = await Web.create({
      user_id: userId,
      url,
      chunk: texts.length,
      metadata,
      type: "web",
      image: page.image || null,
      title: page.title || "Untitled Webpage",
    });

    mongoId = doc._id.toString();

    // Generate embeddings and store in Qdrant
    await generateAndStoreEmbeddings(
      texts,
      COLLECTION_NAME,
      userId,
      mongoId,
      metadata
    );

    console.log("✅ Web content stored in Mongo + Qdrant");

    // Increment usage
    await incrementUsage(userId, plan, free_usage);

    res.status(200).json({ 
      success: true,
      mongo_id: mongoId 
    });

  } catch (err) {
    console.error("Web upload error, initiating rollback:", err);

    // Rollback on error
    if (mongoId) {
      try {
        console.log(`Rolling back MongoDB entry: ${mongoId}`);
        await Web.findByIdAndDelete(mongoId);
        
        console.log(`Rolling back Qdrant entries for mongoId: ${mongoId}`);
        await deleteVectorsByMongoId(COLLECTION_NAME, mongoId);
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }

    if (!res.headersSent) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Something went wrong during web processing";
      res.status(statusCode).json({ 
        success: false,
        error: message 
      });
    }
  }
};
