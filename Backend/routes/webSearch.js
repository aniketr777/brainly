import express from "express";
import  webSearch from "../controllers/webSearch.js";

const router = express.Router();

router.post("/webSearch", webSearch);

export default router;