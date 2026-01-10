import fetch from "node-fetch";
import Youtube from "../../model/youtube-collection.js";
import { splitText } from "../../utils/textProcessor.js";
import { generateAndStoreEmbeddings } from "../../utils/embeddingHelper.js";
import { validateUserPlan, incrementUsage } from "../../utils/planManager.js";
import { deleteVectorsByMongoId } from "../../utils/qdrantHelper.js";
import { ValidationError } from "../../utils/errors.js";
import { isValidYoutubeUrl } from "../../utils/validation.js";

const COLLECTION_NAME = "store";
const TRANSCRIPT_SERVICE_URL = process.env.TRANSCRIPT_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Upload and process YouTube video transcript
 */
export const youtubeUpload = async (req, res) => {
  let mongoId = null;

  try {
    const { link } = req.body;
    const { userId } = req.auth();
    const { plan, free_usage } = req;

    // Validation
    if (!link || !isValidYoutubeUrl(link)) {
      throw new ValidationError("Valid YouTube URL is required");
    }

    // Check user plan
    await validateUserPlan(userId, plan, free_usage);

    // Fetch transcript from service
    const response = await fetch(`${TRANSCRIPT_SERVICE_URL}/get-transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link, lang: "en" }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch transcript from service");
    }

    const data = await response.json();

    if (!data.transcript) {
      throw new ValidationError("No transcript available for this video");
    }

    // Split text into chunks
    const texts = await splitText(data.transcript, "youtube");

    // Create MongoDB record
    const result = await Youtube.create({
      metadata: data.metadata,
      created_at: new Date(),
      link,
      user_id: userId,
      chunk: texts.length,
      type: "youtube",
    });

    mongoId = result._id.toString();

    // Generate embeddings and store in Qdrant
    await generateAndStoreEmbeddings(
      texts,
      COLLECTION_NAME,
      userId,
      mongoId,
      { link, ...data.metadata }
    );

    console.log("✅ YouTube data stored in Mongo + Qdrant");

    // Increment usage
    await incrementUsage(userId, plan, free_usage);

    res.status(200).json({ 
      success: true,
      mongo_id: mongoId 
    });

  } catch (err) {
    console.error("YouTube upload error, initiating rollback:", err);

    // Rollback on error
    if (mongoId) {
      try {
        console.log(`Rolling back MongoDB entry: ${mongoId}`);
        await Youtube.findByIdAndDelete(mongoId);
        
        console.log(`Rolling back Qdrant entries for mongoId: ${mongoId}`);
        await deleteVectorsByMongoId(COLLECTION_NAME, mongoId);
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }

    if (!res.headersSent) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Something went wrong during YouTube processing";
      res.status(statusCode).json({ 
        success: false,
        error: message 
      });
    }
  }
};
