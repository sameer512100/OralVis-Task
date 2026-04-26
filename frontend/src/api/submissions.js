import apiClient from "./client";

export const createSubmission = async (formData) => {
  const response = await apiClient.post("/submissions", formData);
  return response.data;
};

export const getMySubmissions = async () => {
  const response = await apiClient.get("/submissions/mine");
  return response.data;
};

export const getAllSubmissions = async () => {
  const response = await apiClient.get("/submissions");
  return response.data;
};

export const getSubmissionById = async (id) => {
  const response = await apiClient.get(`/submissions/${id}`);
  return response.data;
};

export const saveAnnotation = async (id, annotationData) => {
  const response = await apiClient.post(
    `/submissions/${id}/annotate`,
    annotationData
  );
  return response.data;
};

export const generatePDF = async (id) => {
  const response = await apiClient.post(`/submissions/${id}/generate-pdf`);
  return response.data;
};

export const updateSubmission = async (id, data) => {
  const response = await apiClient.put(`/submissions/${id}`, data);
  return response.data;
};

export const deleteSubmission = async (id) => {
  const response = await apiClient.delete(`/submissions/${id}`);
  return response.data;
};
