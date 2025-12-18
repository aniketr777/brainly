import express from "express";
import {
  chatController,
} from "../controllers/chatController.js";
import {
  appendChatMessages,
  createChatSession,
  deleteChatSession,
  getChatById,
  listChatSessions,
  updateChatMeta,
} from "../controllers/chatSessionController.js";
import auth from "../middleware/auth.js";
import { convertor  } from "../controllers/AudioConverter.js";
import {upload} from "../middleware/audioUpload.js";
import { textToSpeech } from "../controllers/TextToSpeech.js";
const router = express.Router();

router.post("/chat/", auth, chatController);

router.get("/chats", auth, listChatSessions);
router.get("/chats/:id", auth, getChatById);
router.post("/chats", auth, createChatSession);
router.patch("/chats/:id", auth, updateChatMeta);
router.post("/chats/:id/messages", auth, appendChatMessages);
router.delete("/chats/:id", auth, deleteChatSession);

router.post("/convert-audio", upload.single("file"), convertor);
// router.get("/chatList",auth,getChatList);
// router.get("/getChat",auth, getChatById);
// router.delete("/deletechat/:id",auth, deleteChatById);
router.post("/text-speech",textToSpeech)
export default router;
