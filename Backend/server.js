import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongo.js";
import deleteRoutes from "./routes/delete.js";
import uploadRoutes from "./routes/upload.js";
import chatRoutes from "./routes/chat.js";
import GetDataRoutes from "./routes/data.js";
import webSearchRoutes from "./routes/webSearch.js";
import { clerkMiddleware } from "@clerk/express";
import { errorHandler } from "./utils/errors.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

// Connect to MongoDB
connectDB();

// Health check route
app.get("/", (req, res) => {
  res.json({ 
    success: true,
    message: "Server is working",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api", uploadRoutes);
app.use("/api", deleteRoutes);
app.use("/api", chatRoutes);
app.use("/api", GetDataRoutes);
app.use("/api", webSearchRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

