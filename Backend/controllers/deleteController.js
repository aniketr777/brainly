import qdrantClient from "../lib/qdrantClient.js";
import Youtube from "../model/youtube-collection.js";
import Pdf from "../model/pdf-collection.js";
import Text from "../model/text-collection.js";
import toast from "react-hot-toast";
import deleteFromCloudinary from "../lib/deleteFromCloudinary.js";

export const deleteController = async (req, res) => {
  try {
    const { type } = req.body;
    const { mongo_id } = req.body;
    const { userId } = req.auth();
    const collectionName = "documents_collection";

    if (!mongo_id) {
      // toast.error("Invalid Document ");
      return res.status(400).json({ error: "Missing document ID" });
    }

    // Determine the correct MongoDB model based on the document type.
    // This is still needed to interact with the correct Mongo collection.
    let Model;
    if (type === "youtube") {
      Model = Youtube;
    } else if (type === "pdf") {
      Model = Pdf;
    } else if (type === "text") {
      Model = Text;
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    // 1. Fetch the document from MongoDB for potential rollback.
    const doc = await Model.findOne({ _id: mongo_id, user_id: userId });
    if (!doc) {
      return res.status(404).json({ error: `${type} document not found` });
    }
    if (type === "pdf") {
      const public_id = doc.public_id;
      await deleteFromCloudinary(public_id);
    }
    // 2. Delete the document from MongoDB.
    await Model.deleteOne({ _id: mongo_id, user_id: userId });

    // 3. Delete the corresponding vectors from the single Qdrant collection.
    try {
      await qdrantClient.delete(collectionName, {
        filter: {
          must: [
            {
              key: "mongoId",
              match: { value: mongo_id },
            },
          ],
        },
      });
    } catch (qdrantErr) {
      console.error("❌ Qdrant delete failed, rolling back Mongo:", qdrantErr);
      // Rollback: Re-create the document in MongoDB if Qdrant operation fails.
      await Model.create(doc.toObject());
      return res.status(500).json({
        error: "Delete failed in Qdrant, Mongo rolled back",
      });
    }
    toast.success("Document Deleted Successfully ");
    res.json({ message: "✅ Document deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
