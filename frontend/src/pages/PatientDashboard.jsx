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


  const API_BASE_URL = "https://oralvis-backend-dxgf.onrender.com";
  function getAbsoluteUrl(url) {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  }

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
    const file = e.target.files[0];
    if (!file) {
      setFormData({ ...formData, image: null });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result });
    };
    reader.readAsDataURL(file);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const submitData = {
        name: formData.name,
        patientId: formData.patientId,
        email: formData.email,
        note: formData.note,
        imageBase64: formData.image,
      };
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
      <div className="bg-white shadow-lg rounded-2xl mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
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
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            <div className="rounded-md bg-red-50 border border-red-300 p-4 shadow-sm">
              <p className="text-sm text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 border border-green-300 p-4 shadow-sm">
              <p className="text-sm text-green-700 font-semibold">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !formData.image}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-t-2 border-white border-t-blue-400"></span>
                <span>Uploading...</span>
              </span>
            ) : (
              "Upload Image"
            )}
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* My Submissions */}
      <div className="bg-white shadow-lg rounded-2xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
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
            <div className="flex flex-col items-center py-8 text-gray-500">
              <FileText className="h-10 w-10 mb-2 text-gray-300" />
              <p>No submissions yet. Upload your first medical image above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                  className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-lg hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(submission.status)}
                        <h3 className="text-sm font-medium text-gray-900">
                          Submission from{" "}
                          {new Date(submission.createdAt).toLocaleString()}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full shadow ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {submission.status.charAt(0).toUpperCase() +
                            submission.status.slice(1)}
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

                    {submission.status === "reported" && submission.pdfUrl && (
                      <a
                        href={getAbsoluteUrl(submission.pdfUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download your annotated report"
                        className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors mb-1"
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
}

export default PatientDashboard;
