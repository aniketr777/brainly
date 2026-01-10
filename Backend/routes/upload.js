import express from "express";
import { youtubeUpload, pdfUpload, textUpload, webUpload } from "../controllers/upload/index.js";
import upload from "../middleware/upload.js"; 
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/yt", auth, youtubeUpload);
router.post("/pdf", auth, upload.single("file"), pdfUpload);
router.post("/text", auth, textUpload);
router.post("/web", auth, webUpload);

export default router;

