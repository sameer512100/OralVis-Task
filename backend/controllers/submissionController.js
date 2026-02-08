import Submission from "../models/submissionModel.js";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import ejs from "ejs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { Readable } from "stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let gridfsBucket;
const getGridFSBucket = () => {
  if (!gridfsBucket) {
    if (!mongoose.connection?.db) {
      throw new Error("MongoDB connection not ready");
    }
    gridfsBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });
  }
  return gridfsBucket;
};

const uploadBufferToGridFS = (buffer, filename, contentType) => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
    });
    Readable.from(buffer)
      .pipe(uploadStream)
      .on("error", (err) => reject(err))
      .on("finish", () => resolve(uploadStream.id));
  });
};

const streamFileById = async (res, fileId) => {
  const bucket = getGridFSBucket();
  let _id;
  try {
    _id = new ObjectId(fileId);
  } catch {
    res.status(400).json({ message: "Invalid file id" });
    return;
  }
  const files = await bucket.find({ _id }).toArray();
  if (!files || files.length === 0) {
    res.status(404).json({ message: "File not found" });
    return;
  }
  const file = files[0];
  res.setHeader(
    "Content-Type",
    file.contentType || "application/octet-stream"
  );
  bucket.openDownloadStream(_id).pipe(res);
};

// Helper function to render the HTML template
const renderTemplate = async (templatePath, data) => {
  const template = await fs.promises.readFile(templatePath, "utf8");
  return ejs.render(template, data);
};

export const getGeneratedImage = async (req, res) => {
  const { id } = req.params;
  try {
    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).send("Image not found");
    }
    const url = submission.annotatedImageUrl || submission.imageUrl;
    if (!url) {
      return res.status(404).send("Image not found");
    }
    const fileId = url.split("/").pop();
    return streamFileById(res, fileId);
  } catch (err) {
    res.status(500).send("Failed to fetch image");
  }
};

export const getFileById = async (req, res) => {
  try {
    await streamFileById(res, req.params.fileId);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch file" });
  }
};

export const createSubmission = async (req, res) => {
  const { name, patientId, email, note, imageBase64 } = req.body;
  let imageUrl = "";
  if (imageBase64) {
    const filename = `original_${uuidv4()}.png`;
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    try {
      const fileId = await uploadBufferToGridFS(
        buffer,
        filename,
        "image/png"
      );
      imageUrl = `/submissions/files/${fileId}`;
    } catch (err) {
      return res.status(500).json({
        message: "Failed to upload image to MongoDB",
        error: err.message,
      });
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
      /^data:image\/\w+;base64,/,
      ""
    );
    const buffer = Buffer.from(base64Data, "base64");
    try {
      const fileId = await uploadBufferToGridFS(
        buffer,
        filename,
        "image/png"
      );
      annotatedImageUrl = `/submissions/files/${fileId}`;
    } catch (err) {
      return res.status(500).json({
        message: "Failed to upload annotated image to MongoDB",
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

    // Robust template path
    const templatePath = path.join(
      __dirname,
      "../templates/reportTemplate.ejs"
    );
    let htmlContent;
    try {
      htmlContent = await renderTemplate(templatePath, data);
    } catch (err) {
      console.error("EJS template rendering error:", err);
      return res
        .status(500)
        .json({ message: "Template rendering failed", error: err.message });
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: "new",
        executablePath: puppeteer.executablePath(), // Ensures Chrome/Chromium is found
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
      });
    } catch (err) {
      console.error("Puppeteer launch error:", err);
      return res
        .status(500)
        .json({ message: "Puppeteer launch failed", error: err.message });
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
      return res
        .status(500)
        .json({ message: "PDF generation failed", error: err.message });
    }

    // Upload PDF to MongoDB (GridFS)
    const pdfFilename = `report_${submission._id}_${Date.now()}.pdf`;
    let pdfUrl = "";
    try {
      const fileId = await uploadBufferToGridFS(
        pdfBuffer,
        pdfFilename,
        "application/pdf"
      );
      pdfUrl = `/submissions/files/${fileId}`;
    } catch (err) {
      console.error("PDF upload error:", err);
      return res.status(500).json({
        message: "Failed to upload PDF to MongoDB",
        error: err.message,
      });
    }

    // Update submission with PDF URL and status
    submission.status = "reported";
    submission.pdfUrl = pdfUrl;
    await submission.save();

    // Return PDF URL in response
    res.json({ pdfUrl });
  } catch (error) {
    console.error("PDF generation controller error:", error);
    res
      .status(500)
      .json({
        message: "PDF generation failed.",
        error: error.message || error,
      });
  }
};

