import Submission from "../models/submissionModel.js";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import ejs from "ejs";
import { v4 as uuidv4 } from "uuid";

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
  const { annotationJson, annotatedImageBase64 } = req.body;
  let annotatedImageUrl = "";

  if (annotatedImageBase64) {
    const filename = `annotated_${uuidv4()}.png`;
    const filePath = path.join("uploads", filename);
    const base64Data = annotatedImageBase64.replace(
      /^data:image\/png;base64,/,
      ""
    );
    try {
      fs.writeFileSync(filePath, base64Data, "base64");
      annotatedImageUrl = `/uploads/${filename}`;
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Failed to save annotated image" });
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
    const annotatedImageUrl = submission.annotatedImageUrl
      ? `http://localhost:3000${submission.annotatedImageUrl}`
      : "";
    const imageUrl = submission.imageUrl
      ? `http://localhost:3000${submission.imageUrl}`
      : "";

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

    const templatePath = path.join(
      process.cwd(),
      "templates",
      "reportTemplate.ejs"
    );
    const htmlContent = await renderTemplate(templatePath, data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

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
    res.status(500).json({ message: "PDF generation failed." });
  }
};
