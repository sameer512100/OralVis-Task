import express from "express";
import multer from "multer";
import {
  createSubmission,
  getMySubmissions,
  getAllSubmissions,
  getSubmission,
  annotateSubmission,
  generatePDF,
} from "../controllers/submissionController.js";
import { protect } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Patient routes
router.post(
  "/",
  protect,
  requireRole("patient"),
  upload.single("image"),
  createSubmission
);
router.get("/mine", protect, requireRole("patient"), getMySubmissions);

// Admin routes
router.get("/", protect, requireRole("admin"), getAllSubmissions);
router.get("/:id", protect, requireRole("admin"), getSubmission);
router.post("/:id/annotate", protect, requireRole("admin"), annotateSubmission);
router.post("/:id/generate-pdf", protect, requireRole("admin"), generatePDF);

export default router;
