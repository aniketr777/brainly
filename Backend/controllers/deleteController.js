import qdrantClient from "../lib/qdrantClient.js";
import Youtube from "../model/youtube-collection.js";
import Pdf from "../model/pdf-collection.js";
import Text from "../model/text-collection.js";
import Web from "../model/web-collection.js";
import toast from "react-hot-toast";
import deleteFromCloudinary from "../lib/deleteFromCloudinary.js";
import { clerkClient } from "@clerk/express";

// Decrement usage after deletion
const decrementUsage = async (userId, plan, free_usage) => {
  if (plan !== "premium" && free_usage > 0) {
    await clerkClient.users.updateUser(userId, {
      privateMetadata: { free_usage: free_usage - 1 },
    });
  }
};

export const deleteController = async (req, res) => {
  try {
    const { type, mongo_id } = req.body;
    const { userId } = req.auth();
    const { plan, free_usage } = req; 
    const collectionName = "store";

    if (!mongo_id) {
      return res.status(400).json({ error: "Missing document ID" });
    }

    let Model;
    if (type === "youtube") Model = Youtube;
    else if (type === "pdf") Model = Pdf;
    else if (type === "text") Model = Text;
    else if(type=== "web") Model = Web;
    else return res.status(400).json({ error: "Invalid type" });

    const doc = await Model.findOne({ _id: mongo_id, user_id: userId });
    if (!doc)
      return res.status(404).json({ error: `${type} document not found` });

    if (type === "pdf" && doc.public_id) {
      await deleteFromCloudinary(doc.public_id);
    }

    await Model.deleteOne({ _id: mongo_id, user_id: userId });

    try {
      await qdrantClient.delete(collectionName, {
        filter: { must: [{ key: "mongoId", match: { value: mongo_id } }] },
      });
    } catch (qdrantErr) {
      console.error("❌ Qdrant delete failed, rolling back Mongo:", qdrantErr);
      await Model.create(doc.toObject());
      return res.status(500).json({
        error: "Delete failed in Qdrant, Mongo rolled back",
      });
    }

    // Decrement free usage if user is free tier
    await decrementUsage(userId, plan, free_usage);

    toast.success("Document Deleted Successfully");
    res.json({ message: "✅ Document deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
