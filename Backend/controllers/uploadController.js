
import fetch from "node-fetch";
import { randomUUID } from "crypto";
import { embeddings } from "../services/embedding.js";
import qdrantClient from "../lib/qdrantClient.js";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

import Youtube from "../model/youtube-collection.js";
import Pdf from "../model/pdf-collection.js";
import Text from "../model/text-collection.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import toast from "react-hot-toast";
import uploadPdf from "../lib/uploadPdf.js"

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
          size: 768, 
          distance: "Cosine",
        },
      });
      console.log(` Collection "${collectionName}" created.`);

      // 2. Create a payload index for 'mongoId' for efficient filtering during deletion.
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: "mongoId",
        field_schema: "keyword",
        wait: true,
      });
      

      // 3. Create a payload index for 'userId' for efficient filtering during chat searches.
      await qdrantClient.createPayloadIndex(collectionName, {
        field_name: "userId",
        field_schema: "keyword",
        wait: true,
      });
      console.log(` Payload index for "userId" created.`);
    }
  } catch (err) {
    console.error(
      ` Error in ensureCollectionExists for "${collectionName}":`,
      err
    );
    throw err;
  }
};

export const youtubeUpload = async (req, res) => {
  try {
    const { link } = req.body;
    const { userId } = req.auth();
    const collectionName = "documents_collection"; 

    const response = await fetch("http://127.0.0.1:8000/get-transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link, lang: "en" }),
    });
    if (!response.ok) throw new Error("Failed to fetch transcript");

    const data = await response.json();
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const texts = await textSplitter.splitText(data.transcript);

    const result = await Youtube.create({
      metadata: data.metadata,
      created_at: new Date(),
      link,
      user_id: userId,
      chunk: texts.length,
      type: "youtube",
    });
    const mongo_id = result._id.toString();
    res.json({ mongo_id });

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
    console.log(" YouTube data stored in Mongo + Qdrant");
  } catch (err) {
    console.error(" youtubeUpload error:", err);
    if (!res.headersSent)
      res.status(500).json({ error: "Something went wrong" });
  }
};

// basic Template /
// 1) extract text some how , with metadata
// 2) then convert the text to mebeddings , check for qdrant db if it is there or not (if not then use CreateCollection )
// 3) now first store it in mongo (with userId)
// 4) then store it in qdrant with userId + mongoId + metadata
// 5) now after storeing every thing is done




// export const pdfUpload = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }
//     const { path: filepath, originalname, size } = req.file;
//     const { userId } = req.auth();
//     const collectionName = "documents_collection";

//     const metadata = {
//       filename: originalname,
//       size,
//       uploadedAt: new Date(),
//       type: "pdf",
//     };
//     if(size > 5 * 1024 * 1024){
//       toast.error("File size exceeds 5 MB limit");
//       return res.status(400).json({ error: "File size exceeds 5 MB limit" });
//     }
//     const loader = new PDFLoader(filepath, { splitPages: false }); // entire doc is uploaded as single doc
//     const docs = await loader.load();
//     const fullText = docs.map((d) => d.pageContent).join("\n");
//     const textSplitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 1000,
//       chunkOverlap: 100,
//     });
//     const texts = await textSplitter.splitText(fullText);
//     console.log(filepath)
//     const link = await uploadPdf(filepath);

//     if(!link){
//       toast.error("PDF upload failed");
//       return res.status(500).json({ error: "Something went wrong" });
//     }
//     const result = await Pdf.create({
//       metadata,
//       filepath:link,
//       user_id: userId,
//       chunk: texts.length,
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
//     toast.success("PDF uploaded successfully");
//     console.log(" PDF data stored in Mongo + Qdrant");
//   } catch (err) {
//     toast.error("PDF upload failed");
//     console.error(" pdfUpload error:", err);
//     if (!res.headersSent)
//       res.status(500).json({ error: "Something went wrong" });
//   }
// };
export const pdfUpload = async (req, res) => {
  const fileBuffer = req.file?.buffer;

  try {
    if (!req.file || !fileBuffer) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, size } = req.file;
    const { userId } = req.auth();
    const collectionName = "documents_collection";

    if (size > 5 * 1024 * 1024) {
      
      return res.status(400).json({ error: "File size exceeds 5 MB limit" });
    }

    // 1. Upload to Cloudinary directly from the buffer
    const cloudinary = await uploadPdf(fileBuffer, originalname);

    // 2. Process the PDF from the buffer for text extraction
    const pdfBlob = new Blob([fileBuffer], { type: "application/pdf" });
    const loader = new WebPDFLoader(pdfBlob, { splitPages: false });
    const docs = await loader.load();
    const fullText = docs.map((d) => d.pageContent).join("\n");

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const texts = await textSplitter.splitText(fullText);

    // 3. Save metadata to your database (MongoDB)
    const metadata = {
      filename: originalname,
      size,
      uploadedAt: new Date(),
      type: "pdf",
    };

    const result = await Pdf.create({
      metadata,
      filepath: cloudinary.secure_url, // Store the permanent Cloudinary URL
      user_id: userId,
      chunk: texts.length,
      public_id:cloudinary.public_id
    });
    const mongo_id = result._id.toString();

    // 4. Create embeddings and upsert to vector database (Qdrant)
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

    res.status(200).json({
      message: "PDF uploaded and processed successfully",
      mongo_id: mongo_id,
    });
  } catch (err) {
    console.error("❌ pdfUpload controller error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "An internal server error occurred." });
    }
  }
  // The 'finally' block is no longer needed as there's no temporary file to delete.
};



export const textUpload = async (req, res) => {
  try {
    const {title} =  req.body;
    const { text } = req.body;
    const { userId } = req.auth();
    const collectionName = "documents_collection"; 

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

    const result = await Text.create({
      metadata,
      user_id: userId,
      text,
      chunk: texts.length,
      type: "text",
    });
    const mongo_id = result._id.toString();
    res.json({ mongo_id });

    const vectors = await embeddings.embedDocuments(texts);
    await ensureCollectionExists(collectionName);
    await qdrantClient.upsert(collectionName, {
      points: vectors.map((vector, i) => ({
        id: randomUUID(),
        vector,
        payload: { text: texts[i], userId, mongoId: mongo_id, ...metadata },
      })),
    });
    toast.success("Text uploaded successfully");
    console.log(" Text data stored in Mongo + Qdrant");
  } catch (err) {
    toast.error("Text upload failed");
    console.error(" textUpload error:", err);
    if (!res.headersSent)
      res.status(500).json({ error: "Something went wrong" });
  }
};
