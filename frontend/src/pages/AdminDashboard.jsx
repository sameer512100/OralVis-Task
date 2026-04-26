import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllSubmissions } from "../api/submissions";
import Layout from "../components/Layout";
<<<<<<< HEAD
import SubmissionTimeline from "../components/SubmissionTimeline";
=======
>>>>>>> e3467850beb133d5751683f6f0d9ce34f94ca84f
import {
  FileText,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Download,
} from "lucide-react";

// Helper to get absolute image URLs from backend
const API_BASE_URL = "https://oralvis-backend-dxgf.onrender.com";
function getAbsoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
<<<<<<< HEAD
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
=======
>>>>>>> e3467850beb133d5751683f6f0d9ce34f94ca84f

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const data = await getAllSubmissions();
      setSubmissions(data);
    } catch (error) {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "uploaded":
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
      case "uploaded":
        return "bg-yellow-100 text-yellow-800";
      case "annotated":
        return "bg-blue-100 text-blue-800";
      case "reported":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusCount = (status) => {
    return submissions.filter((s) => s.status === status).length;
  };

  const filteredSubmissions = submissions.filter((submission) => {
<<<<<<< HEAD
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [submission.name, submission.patientId, submission.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
=======
    if (statusFilter === "all") return true;
    return submission.status === statusFilter;
>>>>>>> e3467850beb133d5751683f6f0d9ce34f94ca84f
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage and annotate patient submissions
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Submissions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {submissions.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Uploaded
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {getStatusCount("uploaded")}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Annotated
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {getStatusCount("annotated")}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {getStatusCount("reported")}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                All Submissions
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="uploaded">Uploaded</option>
                  <option value="annotated">Annotated</option>
                  <option value="reported">Reported</option>
                </select>
<<<<<<< HEAD
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient"
                  className="text-sm border rounded-md px-2 py-1"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="status">Status</option>
                </select>
=======
>>>>>>> e3467850beb133d5751683f6f0d9ce34f94ca84f
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {error ? (
              <div className="p-6">
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
<<<<<<< HEAD
            ) : sortedSubmissions.length === 0 ? (
=======
            ) : filteredSubmissions.length === 0 ? (
>>>>>>> e3467850beb133d5751683f6f0d9ce34f94ca84f
              <div className="p-6 text-center text-gray-500 flex flex-col items-center">
                <FileText className="h-10 w-10 mb-2 text-gray-300" />
                <p>No submissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-b-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submission Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
<<<<<<< HEAD
                    {sortedSubmissions.map((submission) => (
                      <React.Fragment key={submission._id}>
                      <tr className="hover:bg-blue-50 transition-colors duration-150">
=======
                    {filteredSubmissions.map((submission) => (
                      <tr
                        key={submission._id}
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
>>>>>>> e3467850beb133d5751683f6f0d9ce34f94ca84f
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={getAbsoluteUrl(
                              submission.annotatedImageUrl ||
                                submission.imageUrl
                            )}
                            alt="Submission"
                            className="h-16 w-16 object-cover rounded shadow"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {submission.patientId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.email}
                          </div>
<<<<<<< HEAD
                          {submission.duplicateFlag && (
                            <div className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                              Duplicate
                            </div>
                          )}
=======
>>>>>>> e3467850beb133d5751683f6f0d9ce34f94ca84f
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(submission.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(submission.status)}
                            <span
                              className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full shadow ${getStatusColor(
                                submission.status
                              )}`}
                            >
                              {submission.status.charAt(0).toUpperCase() +
                                submission.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {submission.note || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex flex-col gap-2">
                          <Link
                            to={`/admin/submission/${submission._id}`}
                            title="View or annotate this submission"
<<<<<<< HEAD
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <SubmissionTimeline submission={submission} />
                        </td>
                      </tr>
                      </React.Fragment>
                    ))}
=======
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors mb-1"
>>>>>>> e3467850beb133d5751683f6f0d9ce34f94ca84f
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Annotate / View
                          </Link>
                          {submission.pdfUrl && (
                            <a
                              href={getAbsoluteUrl(submission.pdfUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
