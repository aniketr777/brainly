import express from "express";
import {
  deleteController
} from "../controllers/deleteController.js";
import auth from "../middleware/auth.js";
const router = express.Router();

router.delete("/deleteDocs",auth, deleteController);

export default router;
