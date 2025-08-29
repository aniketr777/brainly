import express from "express";
import {
 chatController
} from "../controllers/chatController.js";
import auth from "../middleware/auth.js";
const router = express.Router();

router.post("/chat", auth, chatController);

export default router;
