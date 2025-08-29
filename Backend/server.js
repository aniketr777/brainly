import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongo.js";
import deleteRoutes from "./routes/delete.js";
import uploadRoutes from "./routes/upload.js";
import qdrantClient from "./lib/qdrantClient.js";
import chatRoutes from "./routes/chat.js";
import GetDataRoutes from "./routes/data.js";
import { clerkMiddleware } from "@clerk/express";
import showRoutes from "./routes/show.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());
const PORT = process.env.PORT || 5000;

// app.get("/", (req, res) => {
//   res.send("Hello World");
// });
// const collections = await qdrantClient.getCollections();
// console.log(collections);

connectDB();


app.use("/api",uploadRoutes)
app.use("/api",deleteRoutes)
app.use("/api", chatRoutes);
app.use("/api", GetDataRoutes);
// app.use("/api", showRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
