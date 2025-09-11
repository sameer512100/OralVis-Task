import Submission from "../models/submissionModel.js";
import AWS from "aws-sdk";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer"; // ✅ use full puppeteer, not puppeteer-core
import ejs from "ejs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const S3_BUCKET = process.env.AWS_S3_BUCKET;

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

  const imagePath = path.join("uploads", path.basename(submission.imageUrl));
  try {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    res.setHeader("Content-Type", "image/png");
    canvas.pngStream().pipe(res);
  } catch (err) {
    res.status(500).send("Failed to generate image");
  }
};

export const createSubmission = async (req, res) => {
  const { name, patientId, email, note, imageBase64 } = req.body;
  let imageUrl = "";
  if (imageBase64) {
    const filename = `original_${uuidv4()}.png`;
    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    try {
      const s3Result = await s3
        .upload({
          Bucket: S3_BUCKET,
          Key: filename,
          Body: buffer,
          ContentEncoding: "base64",
          ContentType: "image/png",
        })
        .promise();
      imageUrl = s3Result.Location;
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Failed to upload image to S3", error: err.message });
    }
  }
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
  const { annotationJson, annotatedImageBase64 } = req.body;
  let annotatedImageUrl = "";

  if (annotatedImageBase64) {
    const filename = `annotated_${uuidv4()}.png`;
    const base64Data = annotatedImageBase64.replace(
      /^data:image\/png;base64,/,
      ""
    );
    const buffer = Buffer.from(base64Data, "base64");
    try {
      const s3Result = await s3
        .upload({
          Bucket: S3_BUCKET,
          Key: filename,
          Body: buffer,
          ContentEncoding: "base64",
          ContentType: "image/png",
        })
        .promise();
      annotatedImageUrl = s3Result.Location;
    } catch (err) {
      return res.status(500).json({
        message: "Failed to upload annotated image to S3",
        error: err.message,
      });
    }
  }

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
    const annotatedImageUrl = submission.annotatedImageUrl || "";
    const imageUrl = submission.imageUrl || "";

    const data = {
      name: submission.name,
      patientId: submission.patientId,
      email: submission.email,
      note: submission.note,
      createdAt: submission.createdAt,
      annotatedImageUrl,
      imageUrl,
      annotationJson: submission.annotationJson,
    };

    // Use robust template path
    const templatePath = path.join(__dirname, "../templates/reportTemplate.ejs");
    let htmlContent;
    try {
      htmlContent = await renderTemplate(templatePath, data);
    } catch (err) {
      console.error("EJS template rendering error:", err);
      return res.status(500).json({ message: "Template rendering failed", error: err.message });
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
        executablePath: puppeteer.executablePath(),
      });
    } catch (err) {
      console.error("Puppeteer launch error:", err);
      return res.status(500).json({ message: "Puppeteer launch failed", error: err.message });
    }

    let pdfBuffer;
    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();
    } catch (err) {
      if (browser) await browser.close();
      console.error("PDF generation error:", err);
      return res.status(500).json({ message: "PDF generation failed", error: err.message });
    }

    // Upload PDF to S3
    const pdfFilename = `report_${submission._id}_${Date.now()}.pdf`;
    let pdfUrl = "";
    try {
      const s3Result = await s3
        .upload({
          Bucket: S3_BUCKET,
          Key: pdfFilename,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        })
        .promise();
      pdfUrl = s3Result.Location;
    } catch (err) {
      console.error("PDF S3 upload error:", err);
      return res.status(500).json({ message: "Failed to upload PDF to S3", error: err.message });
    }

    // Update submission with PDF URL and status
    submission.status = "reported";
    submission.pdfUrl = pdfUrl;
    await submission.save();

    // Return PDF URL in response
    res.json({ pdfUrl });
  } catch (error) {
    console.error("PDF generation controller error:", error);
    res.status(500).json({ message: "PDF generation failed.", error: error.message || error });
  }
};
