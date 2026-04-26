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

const deleteFileByUrl = async (fileUrl) => {
  if (!fileUrl) return;

  const fileId = fileUrl.split("/").pop();

  let _id;
  try {
    _id = new ObjectId(fileId);
  } catch (err) {
    return;
  }

  const bucket = getGridFSBucket();

  try {
    await bucket.delete(_id);
  } catch (err) {
    // ignore missing files
  }
};

const streamFileById = async (res, fileId) => {
  const bucket = getGridFSBucket();

  let _id;
  try {
    _id = new ObjectId(fileId);
  } catch (err) {
    return res.status(400).json({ message: "Invalid file id" });
  }

  const files = await bucket.find({ _id }).toArray();

  if (!files || files.length === 0) {
    return res.status(404).json({ message: "File not found" });
  }

  const file = files[0];

  res.setHeader("Content-Type", file.contentType || "application/octet-stream");

  bucket.openDownloadStream(_id).pipe(res);
};

// Render EJS template
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
    res
      .status(500)
      .json({ message: "Failed to fetch file", error: err.message });
  }
};

export const createSubmission = async (req, res) => {
  const {
    name,
    patientId,
    email,
    note,
    imageBase64,
    uploadFingerprint,
    duplicateFlag,
  } = req.body;

  let imageUrl = "";

  const existingDuplicate = uploadFingerprint
    ? await Submission.findOne({
        patient: req.user._id,
        uploadFingerprint,
      })
    : null;

  const isDuplicate = Boolean(duplicateFlag || existingDuplicate);

  if (imageBase64) {
    const filename = `original_${uuidv4()}.png`;
    // FIXED: Escaped the forward slash in the regex
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    try {
      const fileId = await uploadBufferToGridFS(buffer, filename, "image/png");
      imageUrl = `/submissions/files/${fileId}`;
    } catch (err) {
      return res.status(500).json({
        message: "Failed to upload image",
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
      uploadFingerprint,
      duplicateFlag: isDuplicate,
      uploadedAt: new Date(),
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

  if (!submission) {
    return res.status(404).json({ message: "Not found" });
  }

  res.json(submission);
};

export const annotateSubmission = async (req, res) => {
  const { annotationJson, annotatedImageBase64 } = req.body;

  let annotatedImageUrl = "";

  if (annotatedImageBase64) {
    const filename = `annotated_${uuidv4()}.png`;
    // FIXED: Escaped the forward slash in the regex
    const base64Data = annotatedImageBase64.replace(
      /^data:image\/\w+;base64,/,
      "",
    );
    const buffer = Buffer.from(base64Data, "base64");

    try {
      const fileId = await uploadBufferToGridFS(buffer, filename, "image/png");
      annotatedImageUrl = `/submissions/files/${fileId}`;
    } catch (err) {
      return res.status(500).json({
        message: "Failed to upload annotated image",
        error: err.message,
      });
    }
  }

  const submission = await Submission.findByIdAndUpdate(
    req.params.id,
    {
      annotationJson,
      annotatedImageUrl,
      status: "annotated",
      annotatedAt: new Date(),
    },
    { new: true },
  );

  res.json(submission);
};

export const updateSubmission = async (req, res) => {
  const { name, patientId, email, note, imageBase64 } = req.body;

  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return res.status(404).json({ message: "Not found" });
  }

  if (submission.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (submission.status !== "uploaded") {
    return res.status(400).json({ message: "Cannot edit after annotation" });
  }

  let imageUrl = submission.imageUrl;

  if (imageBase64) {
    const filename = `original_${uuidv4()}.png`;
    // FIXED: Escaped the forward slash in the regex
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    try {
      const fileId = await uploadBufferToGridFS(buffer, filename, "image/png");

      if (submission.imageUrl) {
        await deleteFileByUrl(submission.imageUrl);
      }

      imageUrl = `/submissions/files/${fileId}`;
    } catch (err) {
      return res.status(500).json({
        message: "Failed to upload image",
        error: err.message,
      });
    }
  }

  submission.name = name ?? submission.name;
  submission.patientId = patientId ?? submission.patientId;
  submission.email = email ?? submission.email;
  submission.note = note ?? submission.note;
  submission.imageUrl = imageUrl;

  await submission.save();

  res.json(submission);
};

export const deleteSubmission = async (req, res) => {
  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return res.status(404).json({ message: "Not found" });
  }

  if (submission.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (submission.status !== "uploaded") {
    return res.status(400).json({ message: "Cannot delete after annotation" });
  }

  await deleteFileByUrl(submission.imageUrl);
  await deleteFileByUrl(submission.annotatedImageUrl);
  await deleteFileByUrl(submission.pdfUrl);

  await submission.deleteOne();

  res.json({ message: "Deleted" });
};

export const generatePDF = async (req, res) => {
  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return res.status(404).json({ message: "Not found" });
  }

  try {
    // FIXED: Generate a baseUrl so the Puppeteer PDF can correctly request your relative image URLs
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const data = {
      name: submission.name,
      patientId: submission.patientId,
      email: submission.email,
      note: submission.note,
      createdAt: submission.createdAt,
      annotatedImageUrl: submission.annotatedImageUrl || "",
      imageUrl: submission.imageUrl || "",
      annotationJson: submission.annotationJson,
      baseUrl: baseUrl, // <-- Pass this into your EJS template and use it like `<img src="<%= baseUrl %><%= imageUrl %>">`
    };

    const templatePath = path.join(
      __dirname,
      "../templates/reportTemplate.ejs",
    );

    const htmlContent = await renderTemplate(templatePath, data);

    const browser = await puppeteer.launch({
      headless: true, // FIXED: Updated from deprecated "new" to true
      executablePath: puppeteer.executablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    // Use waitUntil: networkidle0 so Puppeteer waits for your GridFS images to finish downloading
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    const pdfFilename = `report_${submission._id}_${Date.now()}.pdf`;

    const fileId = await uploadBufferToGridFS(
      pdfBuffer,
      pdfFilename,
      "application/pdf",
    );

    const pdfUrl = `/submissions/files/${fileId}`;

    submission.status = "reported";
    submission.pdfUrl = pdfUrl;
    submission.reportedAt = new Date();

    await submission.save();

    res.json({ pdfUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "PDF generation failed",
      error: error.message,
    });
  }
};
