import express from "express";
import  webSearch from "../controllers/webSearch.js";
import auth from "../middleware/auth.js";
const router = express.Router();

router.post("/webSearch", webSearch);

export default router;