import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { createSubmission, getMySubmissions } from "../api/submissions";
import Layout from "../components/Layout";
import {
  Upload,
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: user?.name || "",
    patientId: user?.patientId || "",
    email: user?.email || "",
    note: "",
    image: null,
  });

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await getMySubmissions();
      setSubmissions(data);
    } catch (error) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("patientId", formData.patientId);
      submitData.append("email", formData.email);
      submitData.append("note", formData.note);
      submitData.append("image", formData.image);

      await createSubmission(submitData);
      setSuccess("Image uploaded successfully!");
      setFormData({
        ...formData,
        note: "",
        image: null,
      });
      // Reset file input
      const fileInput = document.getElementById("image");
      if (fileInput) fileInput.value = "";

      // Reload submissions
      loadSubmissions();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "annotated":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "reported":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "annotated":
        return "bg-blue-100 text-blue-800";
      case "reported":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Patient Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Upload medical images and track your submissions
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload New Image
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  htmlFor="patientId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Patient ID
                </label>
                <input
                  type="text"
                  name="patientId"
                  id="patientId"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.patientId}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label
                htmlFor="note"
                className="block text-sm font-medium text-gray-700"
              >
                Note (Optional)
              </label>
              <textarea
                name="note"
                id="note"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Add any additional notes about this image..."
              />
            </div>

            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700"
              >
                Medical Image
              </label>
              <input
                type="file"
                name="image"
                id="image"
                accept="image/*"
                required
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={handleFileChange}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !formData.image}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Upload Image"
              )}
            </button>
          </form>
        </div>

        {/* My Submissions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              My Submissions
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No submissions yet
              </p>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission._id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(submission.status)}
                          <h3 className="text-sm font-medium text-gray-900">
                            Submission from{" "}
                            {new Date(
                              submission.createdAt
                            ).toLocaleDateString()}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              submission.status
                            )}`}
                          >
                            {submission.status}
                          </span>
                        </div>
                        {submission.note && (
                          <p className="mt-1 text-sm text-gray-600">
                            {submission.note}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          ID: {submission._id}
                        </p>
                      </div>

                      {submission.status === "reported" &&
                        submission.pdfUrl && (
                          <a
                            href={`https://oralvis-backend-dxgf.onrender.com${submission.pdfUrl}`}
                            download
                            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download Report
                          </a>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PatientDashboard;
