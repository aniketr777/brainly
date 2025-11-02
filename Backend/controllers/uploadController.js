import Exa from "exa-js";
import fetch from "node-fetch";
import { randomUUID } from "crypto";
import { embeddings } from "../services/embedding.js";
import qdrantClient from "../lib/qdrantClient.js";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

import Youtube from "../model/youtube-collection.js";
import Pdf from "../model/pdf-collection.js";
import Web from "../model/web-collection.js";

import Text from "../model/text-collection.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import cloudinaryUtils from "../lib/uploadPdf.js";
const { uploadPdf, getPdfThumbnailUrl } = cloudinaryUtils;

import { clerkClient } from "@clerk/express";



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

    

    const response = await fetch(`${process.env.TRANSCRIPT_SERVICE_URL || "http://127.0.0.1:8000"}/get-transcript`, {
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
  const collectionName = "store";

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
    // console.log(req.file);
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File size exceeds 5 MB limit" });
    }

    // 2. Upload to Cloudinary
    const cloudinary = await uploadPdf(fileBuffer, originalname);
    cloudinary_public_id = cloudinary.public_id; // Store for potential rollback
    // 3. Load PDF content and split into chunks
    const thumbnail = getPdfThumbnailUrl(cloudinary.public_id);
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
      thumbnail:thumbnail,
    });
    mongo_id = result._id.toString(); 

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
  const collectionName = "store";

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

export const webUpload = async (req, res) => {
  let mongo_id = null;
  const collectionName = "store";

  try {
    const { url } = req.body;
    const { userId } = req.auth();
    const { plan, free_usage } = req;

    // Check plan
    if (plan !== "premium" && free_usage >= 3) {
      return res
        .status(403)
        .json({ error: "Free limit reached. Upgrade to continue." });
    }

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
      return res
        .status(400)
        .json({ error: "No content fetched from the given URL" });
    }

    const fullText = page.text;
    const metadata = {
      title: page.title || "Untitled Webpage",
      url: page.url || url,
      publishedDate: page.publishedDate || null,
      author: page.author || "",
      type: "web",
    };

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const texts = await textSplitter.splitText(fullText);

    // Save entry in Mongo
    const doc = await Web.create({
      user_id: userId,
      url,
      chunk: texts.length,
      metadata,
      type: "web",
      image: result.results[0].image,
      title:result.results[0].title
    });
    mongo_id = doc._id.toString();

    // Create embeddings + upsert to Qdrant
    const vectors = await embeddings.embedDocuments(texts);
    await ensureCollectionExists(collectionName);
    await qdrantClient.upsert(collectionName, {
      points: vectors.map((vector, i) => ({
        id: randomUUID(),
        vector,
        payload: { text: texts[i], userId, mongoId: mongo_id, ...metadata },
      })),
    });

    // Increment free usage if needed
    if (plan !== "premium") {
      await clerkClient.users.updateUser(userId, {
        privateMetadata: { free_usage: (free_usage || 0) + 1 },
      });
    }

    res.status(200).json({ mongo_id });
  } catch (err) {
    console.error("--- webUpload error, initiating rollback ---", err);

    if (mongo_id) {
      await Web.findByIdAndDelete(mongo_id);
      await qdrantClient.delete(collectionName, {
        filter: { must: [{ key: "mongoId", match: { value: mongo_id } }] },
      });
    }

    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Something went wrong during web processing" });
    }
  }
};