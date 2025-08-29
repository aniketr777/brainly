import mongoose from "mongoose";

const textSchema = new mongoose.Schema({
  metadata: {
    type: Object,
    default: {},
  },
  user_id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  chunk: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },type:{
    type:String,
    required:true
  }
});

const Text = mongoose.model("Text", textSchema);

export default Text;
