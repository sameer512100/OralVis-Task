import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSubmissionById,
  saveAnnotation,
  generatePDF,
} from "../api/submissions";
import Layout from "../components/Layout";
import AnnotationCanvas from "../components/AnnotationCanvas";
import { ArrowLeft, User, Hash, Mail, FileText } from "lucide-react";

const AnnotationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const loadSubmission = async () => {
    try {
      const data = await getSubmissionById(id);
      setSubmission(data);
    } catch (error) {
      setError("Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnotation = async (annotationData) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await saveAnnotation(id, annotationData);
      setSuccess("Annotation saved successfully!");
      // Reload submission to get updated status
      await loadSubmission();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save annotation");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      await generatePDF(id);
      setSuccess("PDF generated successfully!");
      // Reload submission to get updated status and PDF URL
      await loadSubmission();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to generate PDF");
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

        {/* Annotation Canvas */}
        <AnnotationCanvas
          imageUrl={submission.imageUrl}
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
