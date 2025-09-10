import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: 'https://medannotate-opal.vercel.app',
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/uploads", (req, res, next) => {
  if (req.path.endsWith(".pdf")) {
    res.setHeader("Content-Type", "application/pdf");
  }
  next();
}, express.static("uploads")); // Serve static files

// Routes
app.use("/auth", authRoutes);
app.use("/submissions", submissionRoutes);

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;


app.get("/",(req,res)=>{
  res.send("ORAL-VIS backend is running !!!!")
})

// MongoDB connection & server start
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if DB connection fails
  });
