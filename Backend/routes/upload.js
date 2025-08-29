import express from "express";
import { youtubeUpload,pdfUpload ,textUpload} from "../controllers/uploadController.js";
import upload from "../middleware/upload.js"; 
const router = express.Router();
import auth from "../middleware/auth.js";


router.post("/yt", auth, youtubeUpload);
router.post("/pdf", auth, upload.single("file"), pdfUpload);
router.post("/text", auth, textUpload);
export default router;
