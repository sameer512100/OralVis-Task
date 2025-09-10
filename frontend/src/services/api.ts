import axios from 'axios';
import { LoginResponse, RegisterData } from '@/types/auth';
import { Submission, SubmissionFormData, AnnotationData } from '@/types/submission';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { email: string; password: string }): Promise<LoginResponse> =>
    api.post('/auth/login', credentials),
  
  register: (userData: RegisterData): Promise<LoginResponse> =>
    api.post('/auth/register', userData),
  
  logout: (): Promise<void> =>
    api.post('/auth/logout'),
};

export const submissionAPI = {
  // Patient endpoints
  uploadSubmission: (formData: FormData): Promise<Submission> =>
    api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getMySubmissions: (): Promise<Submission[]> =>
    api.get('/submissions/mine'),
  
  // Admin endpoints
  getAllSubmissions: (): Promise<Submission[]> =>
    api.get('/submissions'),
  
  getSubmission: (id: string): Promise<Submission> =>
    api.get(`/submissions/${id}`),
  
  saveAnnotation: (id: string, data: { annotationData: AnnotationData; annotatedImage: Blob }): Promise<Submission> => {
    const formData = new FormData();
    formData.append('annotationData', JSON.stringify(data.annotationData));
    formData.append('annotatedImage', data.annotatedImage);
    
    return api.post(`/submissions/${id}/annotate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  generateReport: (id: string): Promise<{ reportUrl: string }> =>
    api.post(`/submissions/${id}/report`),
};

export default api;