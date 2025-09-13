// import fetch from "node-fetch";
// import { randomUUID } from "crypto";
// import { embeddings } from "../services/embedding.js";
// import qdrantClient from "../lib/qdrantClient.js";
// import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

// import Youtube from "../model/youtube-collection.js";
// import Pdf from "../model/pdf-collection.js";
// import Text from "../model/text-collection.js";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// import toast from "react-hot-toast";
// import uploadPdf from "../lib/uploadPdf.js";
// import { clerkClient } from "@clerk/express";

// // Check user plan
// const checkUserPlan = async (userId, plan, free_usage) => {
//   if (plan !== "premium" && free_usage >= 3) {
//     // limit changed to 3
//     return {
//       allowed: false,
//       message: "Free limit reached. Upgrade to continue.",
//     };
//   }
//   return { allowed: true };
// };

// // Increment usage after upload
// const incrementUsage = async (userId, plan, free_usage) => {
//   if (plan !== "premium") {
//     await clerkClient.users.updateUser(userId, {
//       privateMetadata: { free_usage: (free_usage || 0) + 1 }, // default 0 if undefined
//     });
//   }
// };

// const ensureCollectionExists = async (collectionName) => {
//   try {
//     const collections = await qdrantClient.getCollections();
//     const collectionExists = collections.collections.some(
//       (collection) => collection.name === collectionName
//     );

//     if (!collectionExists) {
//       console.log(`Collection "${collectionName}" not found. Creating...`);
//       await qdrantClient.createCollection(collectionName, {
//         vectors: {
//           size: 384,
//           distance: "Cosine",
//         },
//       });
//       console.log(` Collection "${collectionName}" created.`);

//       await qdrantClient.createPayloadIndex(collectionName, {
//         field_name: "mongoId",
//         field_schema: "keyword",
//         wait: true,
//       });
//       await qdrantClient.createPayloadIndex(collectionName, {
//         field_name: "userId",
//         field_schema: "keyword",
//         wait: true,
//       });
//       console.log(` Payload index for "userId" created.`);
//     }
//   } catch (err) {
//     console.error(
//       ` Error in ensureCollectionExists for "${collectionName}":`,
//       err
//     );
//     throw err;
//   }
// };

// export const youtubeUpload = async (req, res) => {
//   try {
//     const { link } = req.body;
//     const { userId } = req.auth();
//     const { plan, free_usage } = req;

//     // Plan check
//     const planCheck = await checkUserPlan(userId, plan, free_usage);
//     if (!planCheck.allowed)
//       return res.status(403).json({ error: planCheck.message });

//     const collectionName = "documents_collection";

//     const response = await fetch("http://127.0.0.1:8000/get-transcript", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ link, lang: "en" }),
//     });
//     if (!response.ok) throw new Error("Failed to fetch transcript");

//     const data = await response.json();
//     const textSplitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 1000,
//       chunkOverlap: 100,
//     });
//     const texts = await textSplitter.splitText(data.transcript);

//     const result = await Youtube.create({
//       metadata: data.metadata,
//       created_at: new Date(),
//       link,
//       user_id: userId,
//       chunk: texts.length,
//       type: "youtube",
//     });
//     const mongo_id = result._id.toString();
//     res.json({ mongo_id });

//     const vectors = await embeddings.embedDocuments(texts);
//     await ensureCollectionExists(collectionName);
//     await qdrantClient.upsert(collectionName, {
//       points: vectors.map((vector, i) => ({
//         id: randomUUID(),
//         vector,
//         payload: {
//           text: texts[i],
//           userId,
//           link,
//           mongoId: mongo_id,
//           ...data.metadata,
//         },
//       })),
//     });
//     console.log(" YouTube data stored in Mongo + Qdrant");

//     // Increment usage after successful upload
//     await incrementUsage(userId, plan, free_usage);
//   } catch (err) {
//     console.error(" youtubeUpload error:", err);
//     if (!res.headersSent)
//       res.status(500).json({ error: "Something went wrong" });
//   }
// };

// export const pdfUpload = async (req, res) => {
//   const fileBuffer = req.file?.buffer;

//   try {
//     const { userId } = req.auth();
//     const { plan, free_usage } = req;

//     // Plan check
//     const planCheck = await checkUserPlan(userId, plan, free_usage);
//     if (!planCheck.allowed)
//       return res.status(403).json({ error: planCheck.message });

//     if (!req.file || !fileBuffer) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     const { originalname, size } = req.file;
//     const collectionName = "documents_collection";

//     if (size > 5 * 1024 * 1024) {
//       return res.status(400).json({ error: "File size exceeds 5 MB limit" });
//     }

//     const cloudinary = await uploadPdf(fileBuffer, originalname);

//     const pdfBlob = new Blob([fileBuffer], { type: "application/pdf" });
//     const loader = new WebPDFLoader(pdfBlob, { splitPages: false });
//     const docs = await loader.load();
//     const fullText = docs.map((d) => d.pageContent).join("\n");

//     const textSplitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 1000,
//       chunkOverlap: 100,
//     });
//     const texts = await textSplitter.splitText(fullText);

//     const metadata = {
//       filename: originalname,
//       size,
//       uploadedAt: new Date(),
//       type: "pdf",
//     };

//     const result = await Pdf.create({
//       metadata,
//       filepath: cloudinary.secure_url,
//       user_id: userId,
//       chunk: texts.length,
//       public_id: cloudinary.public_id,
//     });
//     const mongo_id = result._id.toString();

//     const vectors = await embeddings.embedDocuments(texts);
//     await ensureCollectionExists(collectionName);
//     await qdrantClient.upsert(collectionName, {
//       points: vectors.map((vector, i) => ({
//         id: randomUUID(),
//         vector,
//         payload: { text: texts[i], userId, mongoId: mongo_id, ...metadata },
//       })),
//     });

//     console.log("✅ PDF data stored in Mongo + Qdrant");

//     // Increment usage after successful upload
//     await incrementUsage(userId, plan, free_usage);

//     res.status(200).json({
//       message: "PDF uploaded and processed successfully",
//       mongo_id: mongo_id,
//     });
//   } catch (err) {
//     console.error("❌ pdfUpload controller error:", err);
//     if (!res.headersSent) {
//       res.status(500).json({ error: "An internal server error occurred." });
//     }
//   }
// };

// export const textUpload = async (req, res) => {
//   try {
//     const { title, text } = req.body;
//     const { userId } = req.auth();
//     const { plan, free_usage } = req;

//     // Plan check
//     const planCheck = await checkUserPlan(userId, plan, free_usage);
//     if (!planCheck.allowed)
//       return res.status(403).json({ error: planCheck.message });

//     const collectionName = "documents_collection";

//     const metadata = {
//       title: title || "Untitled",
//       size: text.length,
//       uploadedAt: new Date(),
//       type: "text",
//     };
//     const textSplitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 1000,
//       chunkOverlap: 100,
//     });
//     const texts = await textSplitter.splitText(text);

//     const result = await Text.create({
//       metadata,
//       user_id: userId,
//       text,
//       chunk: texts.length,
//       type: "text",
//     });
//     const mongo_id = result._id.toString();
//     res.json({ mongo_id });

//     const vectors = await embeddings.embedDocuments(texts);
//     await ensureCollectionExists(collectionName);
//     await qdrantClient.upsert(collectionName, {
//       points: vectors.map((vector, i) => ({
//         id: randomUUID(),
//         vector,
//         payload: { text: texts[i], userId, mongoId: mongo_id, ...metadata },
//       })),
//     });
//     toast.success("Text uploaded successfully");
//     console.log(" Text data stored in Mongo + Qdrant");

//     // Increment usage after successful upload
//     await incrementUsage(userId, plan, free_usage);
//   } catch (err) {
//     toast.error("Text upload failed");
//     console.error(" textUpload error:", err);
//     if (!res.headersSent)
//       res.status(500).json({ error: "Something went wrong" });
//   }
// };
import fetch from "node-fetch";
import { randomUUID } from "crypto";
import { embeddings } from "../services/embedding.js";
import qdrantClient from "../lib/qdrantClient.js";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

import Youtube from "../model/youtube-collection.js";
import Pdf from "../model/pdf-collection.js";
import Text from "../model/text-collection.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import uploadPdf from "../lib/uploadPdf.js";
// NOTE: You would need a function to delete from Cloudinary.
// It would look something like this and use the cloudinary admin API.
// import { deleteFromCloudinary } from "../lib/cloudinaryHelper.js";
import { clerkClient } from "@clerk/express";

// --- Helper Functions ---

// Check user plan
const checkUserPlan = async (userId, plan, free_usage) => {
  if (plan !== "premium" && free_usage >= 3) {
    // limit changed to 3
    return {
      allowed: false,
      message: "Free limit reached. Upgrade to continue.",
    };
  }
  return { allowed: true };
};

// Increment usage after upload
const incrementUsage = async (userId, plan, free_usage) => {
  if (plan !== "premium") {
    await clerkClient.users.updateUser(userId, {
      privateMetadata: { free_usage: (free_usage || 0) + 1 }, // default 0 if undefined
    });
  }
};

// Ensure Qdrant collection exists
const ensureCollectionExists = async (collectionName) => {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === collectionName
    );

    if (!collectionExists) {
      console.log(`Collection "${collectionName}" not found. Creating...`);
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: 384,
          distance: "Cosine",
        },
      });
      console.log(` Collection "${collectionName}" created.`);

      // Create payload indexes for efficient filtering
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: "mongoId",
        field_schema: "keyword",
        wait: true,
      });
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: "userId",
        field_schema: "keyword",
        wait: true,
      });
      console.log(` Payload indexes for "mongoId" and "userId" created.`);
    }
  } catch (err) {
    console.error(
      ` Error in ensureCollectionExists for "${collectionName}":`,
      err
    );
    throw err; // Re-throw the error to be caught by the main handler
  }
};

// --- Controllers with Rollback Logic ---

export const youtubeUpload = async (req, res) => {
  let mongo_id = null; // Variable to hold the ID for rollback

  try {
    const { link } = req.body;
    const { userId } = req.auth();
    const { plan, free_usage } = req;

    // 1. Plan Check
    const planCheck = await checkUserPlan(userId, plan, free_usage);
    if (!planCheck.allowed)
      return res.status(403).json({ error: planCheck.message });

    const collectionName = "store";

    // 2. Fetch transcript
    const fastapi = process.env.FASTAPI_URL;

    const response = await fetch(`${fastapi}/get-transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link, lang: "en" }),
    });
    if (!response.ok)
      throw new Error("Failed to fetch transcript from service");
    const data = await response.json();

    // 3. Split Text
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const texts = await textSplitter.splitText(data.transcript);

    // 4. Create record in MongoDB
    const result = await Youtube.create({
      metadata: data.metadata,
      created_at: new Date(),
      link,
      user_id: userId,
      chunk: texts.length,
      type: "youtube",
    });
    mongo_id = result._id.toString(); // Store ID for potential rollback

    // 5. Generate embeddings and store in Qdrant
    const vectors = await embeddings.embedDocuments(texts);
    await ensureCollectionExists(collectionName);
    await qdrantClient.upsert(collectionName, {
      points: vectors.map((vector, i) => ({
        id: randomUUID(),
        vector,
        payload: {
          text: texts[i],
          userId,
          link,
          mongoId: mongo_id,
          ...data.metadata,
        },
      })),
    });
    console.log("YouTube data stored in Mongo + Qdrant");

    // 6. Increment usage (final step)
    await incrementUsage(userId, plan, free_usage);

    // 7. Send success response only after all steps are complete
    res.status(200).json({ mongo_id });
  } catch (err) {
    console.error("--- youtubeUpload error, initiating rollback ---", err);

    // ROLLBACK LOGIC
    if (mongo_id) {
      console.log(`Rolling back MongoDB entry: ${mongo_id}`);
      await Youtube.findByIdAndDelete(mongo_id);
      console.log(`Rolling back Qdrant entries for mongoId: ${mongo_id}`);
      await qdrantClient.delete(collectionName, {
        filter: {
          must: [{ key: "mongoId", match: { value: mongo_id } }],
        },
      });
    }

    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Something went wrong during YouTube processing." });
    }
  }
};

export const pdfUpload = async (req, res) => {
  const fileBuffer = req.file?.buffer;
  let mongo_id = null;
  let cloudinary_public_id = null;
  const collectionName = "documents_collection";

  try {
    const { userId } = req.auth();
    const { plan, free_usage } = req;

    // 1. Plan check
    const planCheck = await checkUserPlan(userId, plan, free_usage);
    if (!planCheck.allowed)
      return res.status(403).json({ error: planCheck.message });

    if (!req.file || !fileBuffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, size } = req.file;
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File size exceeds 5 MB limit" });
    }

    // 2. Upload to Cloudinary
    const cloudinary = await uploadPdf(fileBuffer, originalname);
    cloudinary_public_id = cloudinary.public_id; // Store for potential rollback

    // 3. Load PDF content and split into chunks
    const pdfBlob = new Blob([fileBuffer], { type: "application/pdf" });
    const loader = new WebPDFLoader(pdfBlob, { splitPages: false });
    const docs = await loader.load();
    const fullText = docs.map((d) => d.pageContent).join("\n");

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const texts = await textSplitter.splitText(fullText);

    // 4. Create record in MongoDB
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
    });
    mongo_id = result._id.toString(); // Store for potential rollback

    // 5. Generate embeddings and store in Qdrant
    const vectors = await embeddings.embedDocuments(texts);
    await ensureCollectionExists(collectionName);
    await qdrantClient.upsert(collectionName, {
      points: vectors.map((vector, i) => ({
        id: randomUUID(),
        vector,
        payload: { text: texts[i], userId, mongoId: mongo_id, ...metadata },
      })),
    });
    console.log("✅ PDF data stored in Mongo + Qdrant");

    // 6. Increment usage
    await incrementUsage(userId, plan, free_usage);

    // 7. Send success response
    res.status(200).json({
      message: "PDF uploaded and processed successfully",
      mongo_id: mongo_id,
    });
  } catch (err) {
    console.error("--- pdfUpload error, initiating rollback ---", err);

    // ROLLBACK LOGIC
    if (cloudinary_public_id) {
      console.log(`Rolling back Cloudinary upload: ${cloudinary_public_id}`);
      // await deleteFromCloudinary(cloudinary_public_id); // You need to implement this
    }
    if (mongo_id) {
      console.log(`Rolling back MongoDB entry: ${mongo_id}`);
      await Pdf.findByIdAndDelete(mongo_id);
      console.log(`Rolling back Qdrant entries for mongoId: ${mongo_id}`);
      await qdrantClient.delete(collectionName, {
        filter: {
          must: [{ key: "mongoId", match: { value: mongo_id } }],
        },
      });
    }

    if (!res.headersSent) {
      res.status(500).json({ error: "An internal server error occurred." });
    }
  }
};

export const textUpload = async (req, res) => {
  let mongo_id = null;
  const collectionName = "documents_collection";

  try {
    const { title, text } = req.body;
    const { userId } = req.auth();
    const { plan, free_usage } = req;

    // 1. Plan check
    const planCheck = await checkUserPlan(userId, plan, free_usage);
    if (!planCheck.allowed)
      return res.status(403).json({ error: planCheck.message });

    // 2. Split Text
    const metadata = {
      title: title || "Untitled",
      size: text.length,
      uploadedAt: new Date(),
      type: "text",
    };
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const texts = await textSplitter.splitText(text);

    // 3. Create record in MongoDB
    const result = await Text.create({
      metadata,
      user_id: userId,
      text,
      chunk: texts.length,
      type: "text",
    });
    mongo_id = result._id.toString(); // Store ID for potential rollback

    // 4. Generate embeddings and store in Qdrant
    const vectors = await embeddings.embedDocuments(texts);
    await ensureCollectionExists(collectionName);
    await qdrantClient.upsert(collectionName, {
      points: vectors.map((vector, i) => ({
        id: randomUUID(),
        vector,
        payload: { text: texts[i], userId, mongoId: mongo_id, ...metadata },
      })),
    });
    console.log("Text data stored in Mongo + Qdrant");

    // 5. Increment usage
    await incrementUsage(userId, plan, free_usage);

    // 6. Send success response
    res.status(200).json({ mongo_id });
  } catch (err) {
    // Note: The `toast` calls from your original code were removed
    // because they are frontend functions and will not work on the backend.
    console.error("--- textUpload error, initiating rollback ---", err);

    // ROLLBACK LOGIC
    if (mongo_id) {
      console.log(`Rolling back MongoDB entry: ${mongo_id}`);
      await Text.findByIdAndDelete(mongo_id);
      console.log(`Rolling back Qdrant entries for mongoId: ${mongo_id}`);
      await qdrantClient.delete(collectionName, {
        filter: {
          must: [{ key: "mongoId", match: { value: mongo_id } }],
        },
      });
    }

    if (!res.headersSent)
      res
        .status(500)
        .json({ error: "Something went wrong during text processing" });
  }
};
