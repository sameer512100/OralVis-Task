import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: String,
    patientId: String,
    email: String,
    note: String,
    imageUrl: String,
    annotatedImageUrl: String,
    annotationJson: Object,
    pdfUrl: String,
    status: {
      type: String,
      enum: ["uploaded", "annotated", "reported"],
      default: "uploaded",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);
