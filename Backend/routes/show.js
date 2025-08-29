import express from "express";
import getPdf from "../controllers/showDocs.js";
// import auth from "../middleware/auth.js";

const router = express.Router();


router.get("/docs/:id", getPdf);

export default router;
