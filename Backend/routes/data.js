import express from "express";
import {
 GetDataController
} from "../controllers/GetDataController.js";
import auth from "../middleware/auth.js";
const router = express.Router();

router.get("/getData",auth, GetDataController);

export default router;
