import mongoose from "mongoose";
import { title } from "process";

const WebSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  user_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  type: { type: String, enum: ["web"], default: "web" },
  chunk: { type: Number, required: true },
  image:{type:String},
  title:{type:String},
  metadata: {
    type: Object,
    default: {},
  },
});

const Web = mongoose.model("Web", WebSchema);

export default Web;
