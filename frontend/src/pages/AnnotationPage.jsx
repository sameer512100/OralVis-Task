import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSubmissionById,
  saveAnnotation,
  generatePDF,
} from "../api/submissions";
import Layout from "../components/Layout";
import AnnotationCanvas from "../components/AnnotationCanvas";
import { ArrowLeft, User, Hash, Mail, FileText, Download } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "https://oralvis-backend-dxgf.onrender.com";
function getAbsoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}

const AnnotationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [newRecTitle, setNewRecTitle] = useState("");
  const [newRecText, setNewRecText] = useState("");
  const stageRef = useRef();
  // Import AuthContext to get token
  const { token } = useAuth();

  useEffect(() => {
    loadSubmission();
    // eslint-disable-next-line
  }, [id]);

  const loadSubmission = async () => {
    try {
      const data = await getSubmissionById(id);
      setSubmission(data);
      setError("");
      // Load recommendations from annotationJson if available
      if (
        data.annotationJson &&
        Array.isArray(data.annotationJson.recommendations)
      ) {
        setRecommendations(data.annotationJson.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load submission");
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnotation = async (annotationData, canvasDataUrl) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Build annotationJson with recommendations
      const annotationJson = {
        ...annotationData,
        recommendations: recommendations,
      };

      // Send annotationJson and annotatedImageBase64 at top level
      await saveAnnotation(id, {
        annotationJson,
        annotatedImageBase64: canvasDataUrl,
      });

      setSuccess("Annotation saved successfully!");
      await loadSubmission();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save annotation");
    } finally {
      setSaving(false);
    }
  };

  // Download annotated image
  const handleDownloadAnnotatedImage = () => {
  if (!submission.annotatedImageUrl) return;
  const link = document.createElement("a");
  link.href = submission.annotatedImageUrl;
  link.download = `annotated_${submission.patientId || submission._id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  };

  // Add recommendation
  const handleAddRecommendation = () => {
    if (!newRecTitle.trim() || !newRecText.trim()) return;
    setRecommendations((prev) => [
      ...prev,
      { title: newRecTitle, text: newRecText },
    ]);
    setNewRecTitle("");
    setNewRecText("");
  };

  // Remove recommendation
  const handleRemoveRecommendation = (idx) => {
    setRecommendations((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      // Make the POST request to generate the PDF, including Authorization header
      const response = await fetch(`${API_BASE_URL}/submissions/${id}/generate-pdf`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // After successful generation, reload submission to get the new pdfUrl
      setSuccess("PDF generated successfully!");
      await loadSubmission();
    } catch (error) {
      setError(error.message || "Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!submission) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Submission not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Image Annotation</h1>
          <p className="mt-2 text-gray-600">
            Annotate medical images and generate reports
          </p>
        </div>

        {/* Patient Information */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Patient Information
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {submission.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Hash className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Patient ID</p>
                  <p className="text-sm font-medium text-gray-900">
                    {submission.patientId}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {submission.email}
                  </p>
                </div>
              </div>
            </div>

            {submission.note && (
              <div className="mt-4 flex items-start">
                <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Patient Note</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {submission.note}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Submission Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(submission.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  submission.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : submission.status === "annotated"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {submission.status}
              </span>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Recommendations UI */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Treatment Recommendations
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Title (e.g. Oral Hygiene)"
              className="border rounded px-2 py-1 flex-1"
              value={newRecTitle}
              onChange={(e) => setNewRecTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Recommendation text"
              className="border rounded px-2 py-1 flex-2"
              value={newRecText}
              onChange={(e) => setNewRecText(e.target.value)}
            />
            <button
              onClick={handleAddRecommendation}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between bg-blue-50 rounded px-3 py-2"
              >
                <span>
                  <strong>{rec.title}:</strong> {rec.text}
                </span>
                <button
                  onClick={() => handleRemoveRecommendation(idx)}
                  className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Annotation Canvas */}
        <AnnotationCanvas
          ref={stageRef}
          imageUrl={submission.annotatedImageUrl || submission.imageUrl}
          annotationJson={submission.annotationJson}
          onSave={handleSaveAnnotation}
          onGeneratePDF={handleGeneratePDF}
          saving={saving}
          generating={generating}
        />
      </div>
    </Layout>
  );
};

export default AnnotationPage;
