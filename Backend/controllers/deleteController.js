import Youtube from "../model/youtube-collection.js";
import Pdf from "../model/pdf-collection.js";
import Text from "../model/text-collection.js";
import Web from "../model/web-collection.js";
import deleteFromCloudinary from "../lib/deleteFromCloudinary.js";
import { decrementUsage } from "../utils/planManager.js";
import { deleteVectorsByMongoId } from "../utils/qdrantHelper.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import { isValidMongoId, isValidDocumentType } from "../utils/validation.js";

const COLLECTION_NAME = "store";

/**
 * Get model based on document type
 */
const getModelByType = (type) => {
  const models = {
    youtube: Youtube,
    pdf: Pdf,
    text: Text,
    web: Web,
  };
  return models[type];
};

/**
 * Delete document controller
 */
export const deleteController = async (req, res) => {
  try {
    const { type, mongo_id } = req.body;
    const { userId } = req.auth();
    const { plan, free_usage } = req;

    // Validation
    if (!mongo_id || !isValidMongoId(mongo_id)) {
      throw new ValidationError("Valid document ID is required");
    }

    if (!type || !isValidDocumentType(type)) {
      throw new ValidationError("Valid document type is required");
    }

    // Get appropriate model
    const Model = getModelByType(type);

    // Find document
    const doc = await Model.findOne({ _id: mongo_id, user_id: userId });
    
    if (!doc) {
      throw new NotFoundError(`${type} document not found`);
    }

    // Delete from Cloudinary if PDF
    if (type === "pdf" && doc.public_id) {
      try {
        await deleteFromCloudinary(doc.public_id);
        console.log(`✅ Deleted from Cloudinary: ${doc.public_id}`);
      } catch (cloudinaryErr) {
        console.error("Cloudinary delete failed:", cloudinaryErr);
        // Continue with deletion even if Cloudinary fails
      }
    }

    // Delete from MongoDB
    await Model.deleteOne({ _id: mongo_id, user_id: userId });
    console.log(`✅ Deleted from MongoDB: ${mongo_id}`);

    // Delete from Qdrant with rollback on failure
    try {
      await deleteVectorsByMongoId(COLLECTION_NAME, mongo_id);
      console.log(`✅ Deleted from Qdrant: ${mongo_id}`);
    } catch (qdrantErr) {
      console.error("Qdrant delete failed, rolling back MongoDB:", qdrantErr);
      
      // Rollback: Restore document in MongoDB
      await Model.create(doc.toObject());
      
      throw new Error("Delete failed in Qdrant, MongoDB rolled back");
    }

    // Decrement free usage if user is on free tier
    await decrementUsage(userId, plan, free_usage);

    res.json({ 
      success: true,
      message: "Document deleted successfully" 
    });

  } catch (err) {
    console.error("Delete error:", err);
    
    if (!res.headersSent) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(statusCode).json({ 
        success: false,
        error: message 
      });
    }
  }
};
