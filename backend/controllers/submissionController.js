import Submission from "../models/submissionModel.js";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import ejs from "ejs";

// Helper function to render the HTML template
const renderTemplate = async (templatePath, data) => {
  const template = await fs.promises.readFile(templatePath, "utf8");
  return ejs.render(template, data);
};

export const getGeneratedImage = async (req, res) => {
  const { id } = req.params;
  const submission = await Submission.findById(id);
  if (!submission || !submission.imageUrl) {
    return res.status(404).send("Image not found");
  }

  // Load the original image from disk
  const imagePath = path.join("uploads", path.basename(submission.imageUrl));
  try {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Optionally, draw annotations or overlays here

    res.setHeader("Content-Type", "image/png");
    canvas.pngStream().pipe(res);
  } catch (err) {
    res.status(500).send("Failed to generate image");
  }
};

export const createSubmission = async (req, res) => {
  const { name, patientId, email, note } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";
  try {
    const submission = await Submission.create({
      patient: req.user._id,
      name,
      patientId,
      email,
      note,
      imageUrl,
      status: "uploaded",
    });
    res.json(submission);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getMySubmissions = async (req, res) => {
  const submissions = await Submission.find({ patient: req.user._id });
  res.json(submissions);
};

export const getAllSubmissions = async (req, res) => {
  const submissions = await Submission.find();
  res.json(submissions);
};

export const getSubmission = async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: "Not found" });
  res.json(submission);
};

export const annotateSubmission = async (req, res) => {
  const { annotationJson, annotatedImageUrl } = req.body;
  const submission = await Submission.findByIdAndUpdate(
    req.params.id,
    { annotationJson, annotatedImageUrl, status: "annotated" },
    { new: true }
  );
  res.json(submission);
};

export const generatePDF = async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) {
    return res.status(404).json({ message: "Not found" });
  }

  try {
    const data = {
      name: submission.name,
      patientId: submission.patientId,
      email: submission.email,
      note: submission.note,
      createdAt: submission.createdAt,
      imageUrl: submission.imageUrl,
      annotatedImageUrl: submission.annotatedImageUrl,
      // You may need to process annotationJson here to match your template format
      annotationJson: submission.annotationJson,
    };

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "reportTemplate.ejs"
    );
    const htmlContent = await renderTemplate(templatePath, data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for some environments
    });
    const page = await browser.newPage();

    // Serve static files to Puppeteer to access images
    await page.goto(`data:text/html,${htmlContent}`, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    const pdfPath = `uploads/report_${submission._id}.pdf`;
    fs.writeFileSync(pdfPath, pdfBuffer);

    submission.pdfUrl = `/uploads/report_${submission._id}.pdf`;
    submission.status = "reported";
    await submission.save();

    res.json({ pdfUrl: submission.pdfUrl });
  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({ message: "PDF generation failed." });
  }
};
