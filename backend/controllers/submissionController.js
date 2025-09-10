import Submission from "../models/submissionModel.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

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
  if (!submission) return res.status(404).json({ message: "Not found" });

  const pdfPath = `uploads/report_${submission._id}.pdf`;
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(pdfPath));
  doc.fontSize(18).text("OralVis Patient Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${submission.name}`);
  doc.text(`Patient ID: ${submission.patientId}`);
  doc.text(`Email: ${submission.email}`);
  doc.text(`Note: ${submission.note}`);
  doc.text(`Status: ${submission.status}`);
  doc.text(`Uploaded: ${submission.createdAt}`);
  doc.moveDown();
  doc.text("Original Image:");
  if (submission.imageUrl) {
    doc.image(path.join("uploads", path.basename(submission.imageUrl)), {
      width: 250,
    });
  }
  doc.moveDown();
  doc.text("Annotated Image:");
  if (submission.annotatedImageUrl) {
    doc.image(
      path.join("uploads", path.basename(submission.annotatedImageUrl)),
      { width: 250 }
    );
  }
  doc.moveDown();

  // Add structured annotation data if present
  doc.fontSize(14).text("Structured Annotation Data:", { underline: true });
  if (submission.annotationJson) {
    try {
      const annotation =
        typeof submission.annotationJson === "string"
          ? JSON.parse(submission.annotationJson)
          : submission.annotationJson;
      doc.fontSize(10).text(JSON.stringify(annotation, null, 2));
    } catch (e) {
      doc.fontSize(10).text("Invalid annotation data.");
    }
  } else {
    doc.fontSize(10).text("No annotation data available.");
  }

  doc.end();

  submission.pdfUrl = `/uploads/report_${submission._id}.pdf`;
  submission.status = "reported";
  await submission.save();

  res.json({ pdfUrl: submission.pdfUrl });
};
