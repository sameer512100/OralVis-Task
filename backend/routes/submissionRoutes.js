import express from "express";
import multer from "multer";
import path from "path";
import {
  createSubmission,
  getMySubmissions,
  getAllSubmissions,
  getSubmission,
  annotateSubmission,
  generatePDF,
  getGeneratedImage,
} from "../controllers/submissionController.js";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";


const router = express.Router();

// Patient routes
router.post(
  "/",
  protect,
  requireRole("patient"),
  createSubmission
);
router.get("/mine", protect, requireRole("patient"), getMySubmissions);
router.get("/:id/generated-image", protect, getGeneratedImage);

// Admin routes
router.get("/", protect, requireRole("admin"), getAllSubmissions);
router.get("/:id", protect, requireRole("admin"), getSubmission);
router.post("/:id/annotate", protect, requireRole("admin"), annotateSubmission);
router.post("/:id/generate-pdf", protect, requireRole("admin"), generatePDF);

export default router;
