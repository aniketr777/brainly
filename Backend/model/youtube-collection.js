import mongoose from "mongoose";

const youtubeSchema = new mongoose.Schema({
  metadata: {
    type: Object,
    default: {},
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  link: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  chunk: {
    type: Number,
  },type:{
    type:String,
    required:true
  }
});

const Youtube = mongoose.model("Youtube", youtubeSchema);

export default Youtube;
