import Text from "../../model/text-collection.js";
import { splitText } from "../../utils/textProcessor.js";
import { generateAndStoreEmbeddings } from "../../utils/embeddingHelper.js";
import { validateUserPlan, incrementUsage } from "../../utils/planManager.js";
import { deleteVectorsByMongoId } from "../../utils/qdrantHelper.js";
import { ValidationError } from "../../utils/errors.js";
import { isValidText, sanitizeText } from "../../utils/validation.js";

const COLLECTION_NAME = "store";

/**
 * Upload and process text content
 */
export const textUpload = async (req, res) => {
  let mongoId = null;

  try {
    const { title, text } = req.body;
    const { userId } = req.auth();
    const { plan, free_usage } = req;

    // Validation
    if (!isValidText(text)) {
      throw new ValidationError("Text content is required");
    }

    // Check user plan
    await validateUserPlan(userId, plan, free_usage);

    // Sanitize inputs
    const sanitizedTitle = sanitizeText(title) || "Untitled";
    const sanitizedText = sanitizeText(text);

    // Split text into chunks
    const texts = await splitText(sanitizedText, "text");

    // Create metadata
    const metadata = {
      title: sanitizedTitle,
      size: sanitizedText.length,
      uploadedAt: new Date(),
      type: "text",
    };

    // Create MongoDB record
    const result = await Text.create({
      metadata,
      user_id: userId,
      text: sanitizedText,
      chunk: texts.length,
      type: "text",
    });

    mongoId = result._id.toString();

    // Generate embeddings and store in Qdrant
    await generateAndStoreEmbeddings(
      texts,
      COLLECTION_NAME,
      userId,
      mongoId,
      metadata
    );

    console.log("✅ Text data stored in Mongo + Qdrant");

    // Increment usage
    await incrementUsage(userId, plan, free_usage);

    res.status(200).json({ 
      success: true,
      mongo_id: mongoId 
    });

  } catch (err) {
    console.error("Text upload error, initiating rollback:", err);

    // Rollback on error
    if (mongoId) {
      try {
        console.log(`Rolling back MongoDB entry: ${mongoId}`);
        await Text.findByIdAndDelete(mongoId);
        
        console.log(`Rolling back Qdrant entries for mongoId: ${mongoId}`);
        await deleteVectorsByMongoId(COLLECTION_NAME, mongoId);
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }

    if (!res.headersSent) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Something went wrong during text processing";
      res.status(statusCode).json({ 
        success: false,
        error: message 
      });
    }
  }
};
