import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import Pdf from "../../model/pdf-collection.js";
import { splitText } from "../../utils/textProcessor.js";
import { generateAndStoreEmbeddings } from "../../utils/embeddingHelper.js";
import { validateUserPlan, incrementUsage } from "../../utils/planManager.js";
import { deleteVectorsByMongoId } from "../../utils/qdrantHelper.js";
import { ValidationError } from "../../utils/errors.js";
import { isValidFileSize } from "../../utils/validation.js";
import cloudinaryUtils from "../../lib/uploadPdf.js";

const { uploadPdf, getPdfThumbnailUrl } = cloudinaryUtils;

const COLLECTION_NAME = "store";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Upload and process PDF file
 */
export const pdfUpload = async (req, res) => {
  const fileBuffer = req.file?.buffer;
  let mongoId = null;
  let cloudinaryPublicId = null;

  try {
    const { userId } = req.auth();
    const { plan, free_usage } = req;

    // Validation
    if (!req.file || !fileBuffer) {
      throw new ValidationError("No file uploaded");
    }

    const { originalname, size } = req.file;

    if (!isValidFileSize(size, MAX_FILE_SIZE)) {
      throw new ValidationError("File size exceeds 5 MB limit");
    }

    // Check user plan
    await validateUserPlan(userId, plan, free_usage);

    // Upload to Cloudinary
    const cloudinary = await uploadPdf(fileBuffer, originalname);
    cloudinaryPublicId = cloudinary.public_id;

    // Get thumbnail URL
    const thumbnail = getPdfThumbnailUrl(cloudinary.public_id);

    // Load PDF content
    const pdfBlob = new Blob([fileBuffer], { type: "application/pdf" });
    const loader = new WebPDFLoader(pdfBlob, { splitPages: false });
    const docs = await loader.load();
    const fullText = docs.map((d) => d.pageContent).join("\n");

    if (!fullText || fullText.trim().length === 0) {
      throw new ValidationError("PDF appears to be empty or unreadable");
    }

    // Split text into chunks
    const texts = await splitText(fullText, "pdf");

    // Create MongoDB record
    const metadata = {
      filename: originalname,
      size,
      uploadedAt: new Date(),
      type: "pdf",
    };

    const result = await Pdf.create({
      metadata,
      filepath: cloudinary.secure_url,
      user_id: userId,
      chunk: texts.length,
      public_id: cloudinary.public_id,
      thumbnail,
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

    console.log("✅ PDF data stored in Mongo + Qdrant");

    // Increment usage
    await incrementUsage(userId, plan, free_usage);

    res.status(200).json({
      success: true,
      message: "PDF uploaded and processed successfully",
      mongo_id: mongoId,
    });

  } catch (err) {
    console.error("PDF upload error, initiating rollback:", err);

    // Rollback on error
    if (cloudinaryPublicId) {
      try {
        console.log(`Rolling back Cloudinary upload: ${cloudinaryPublicId}`);
        // Note: Implement deleteFromCloudinary if needed
        // await deleteFromCloudinary(cloudinaryPublicId);
      } catch (rollbackErr) {
        console.error("Cloudinary rollback failed:", rollbackErr);
      }
    }

    if (mongoId) {
      try {
        console.log(`Rolling back MongoDB entry: ${mongoId}`);
        await Pdf.findByIdAndDelete(mongoId);
        
        console.log(`Rolling back Qdrant entries for mongoId: ${mongoId}`);
        await deleteVectorsByMongoId(COLLECTION_NAME, mongoId);
      } catch (rollbackErr) {
        console.error("Database rollback failed:", rollbackErr);
      }
    }

    if (!res.headersSent) {
      const statusCode = err.statusCode || 500;
      const message = err.message || "An internal server error occurred";
      res.status(statusCode).json({ 
        success: false,
        error: message 
      });
    }
  }
};
