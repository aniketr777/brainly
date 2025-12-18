import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    searchType: {
      type: String,
      default: "Doc Search",
    },
    sources: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    results: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: "New Chat",
    },
    userId: {
      type: String,
      required: true,
    },
    searchType: {
      type: String,
      default: "Doc Search",
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true }
);
const Chat = mongoose.model("Chat", chatSchema);



export default Chat;
