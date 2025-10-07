import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema({
  metadata: {
    filename: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    uploadedAt: { type: Date, default: Date.now },
  },
  filepath: { type: String, required: true }, // stored path
  thumbnail:{type:String},
  user_id: { type: String, required: true },
  chunk: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  type: { type: String, enum: ["pdf"], default: "pdf" },
  public_id: { type: String, required: true }, // cloudinary public id
});

const Pdf = mongoose.model("Pdf", pdfSchema);

export default Pdf;
