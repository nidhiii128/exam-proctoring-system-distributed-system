import axios from 'axios';

// Prefer env override, otherwise derive from current host so mobiles on LAN work
const resolvedHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL) || `http://${resolvedHost}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth endpoints
export const login = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  if (res.data?.token) {
    localStorage.setItem('jwt', res.data.token);
  }
  return res;
};
export const register = (payload) => api.post('/auth/register', payload);
export const logout = (userData) => api.post('/auth/logout', userData);

// Exam endpoints
export const createExam = (examData) => api.post('/exam/create', examData);
export const updateExam = (examId, examData) => api.put(`/exam/${examId}`, examData);
export const deleteExam = (examId) => api.delete(`/exam/${examId}`);
export const getExam = (examId) => api.get(`/exam/${examId}`);
export const getAllExams = () => api.get('/exam/all');
export const getTeacherExams = (teacherId) => api.get(`/exam/teacher/${teacherId}`);
export const startExam = (examId, userId) => api.post(`/exam/${examId}/start`, { userId });
export const stopExam = (examId, userId) => api.post(`/exam/${examId}/stop`, { userId });
export const getExamForStudent = (examId, userId) => api.get(`/exam/${examId}/take`, { params: { userId } });
export const getExamDetails = (examId) => api.get(`/exam/${examId}/details`);
export const getAvailableExams = (userId) => api.get('/exam/available', { params: { userId } });
export const getExamResults = (examId) => api.get(`/exam/${examId}/results`);
export const releaseMarks = (examId, userId) => api.post(`/exam/${examId}/release-marks`, { userId });
export const releaseMarksForStudent = (examId, userId) => api.post(`/exam/${examId}/release-marks/${userId}`);
export const acquireWriteLock = (examId, userId) => api.post(`/exam/${examId}/acquire-write-lock`, { userId });
export const releaseWriteLock = (examId, userId) => api.post(`/exam/${examId}/release-write-lock`, { userId });
export const updateStudentMarks = (examId, userId, marks, maxMarks) => api.put(`/exam/${examId}/update-marks/${userId}`, { marks, maxMarks });
export const getExamAnalytics = (examId) => api.get(`/exam/${examId}/analytics`);
export const getTeacherAnalytics = (teacherId) => api.get(`/teacher/${teacherId}/analytics`);
export const getStudentAnalytics = (studentId) => api.get(`/student/${studentId}/analytics`);
export const getSystemAnalytics = () => api.get('/admin/analytics');
export const exportExamResults = (examId, format = 'csv') => api.get(`/exam/${examId}/export/${format}`, { responseType: 'blob' });
export const exportTeacherReport = (teacherId, format = 'pdf') => api.get(`/teacher/${teacherId}/report/${format}`, { responseType: 'blob' });
export const duplicateExam = (examId) => api.post(`/exam/${examId}/duplicate`);
export const archiveExam = (examId) => api.post(`/exam/${examId}/archive`);
export const restoreExam = (examId) => api.post(`/exam/${examId}/restore`);
export const importExamCsv = (formData) => api.post('/exam/import-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const downloadExamCsvTemplate = () => api.get('/exam/template-csv', { responseType: 'blob' });

// Students (teacher-managed)
export const getStudentsForTeacher = (teacherId) => api.get(`/students/teacher/${teacherId}`);
export const addStudent = (payload) => api.post('/students', payload);
export const removeStudent = (studentId) => api.delete(`/students/${studentId}`);
export const importStudentsCsv = (formData) => api.post('/students/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const clearAllStudents = (teacherId) => api.post('/students/clear', { teacherId });

// Submission endpoints
export const submitExam = (submissionData) => api.post('/submission/submit', submissionData);
export const getStudentMarks = (userId, examId) => api.get(`/submission/${userId}/${examId}/marks`);
export const getStudentAllMarks = (userId) => api.get(`/submission/${userId}/marks`);
// Lock helpers
export const acquireReadLock = (userId) => api.post(`/submission/${userId}/acquire-read-lock`);
export const releaseReadLock = (userId) => api.post(`/submission/${userId}/release-read-lock`);

// Admin endpoints
export const getSystemStatus = () => api.get('/admin/status');
export const getSystemOverview = () => api.get('/admin/overview');
export const getSystemMetrics = () => api.get('/admin/metrics');
export const getActiveExams = () => api.get('/admin/exams/active');
export const getSystemLogs = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.limit != null) params.set('limit', String(filters.limit));
  if (filters.type) params.set('type', filters.type);
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.since) params.set('since', filters.since);
  const qs = params.toString();
  return api.get(`/admin/logs${qs ? `?${qs}` : ''}`);
};
export const getSystemHealth = () => api.get('/admin/health');
export const getLoadBalancerStatus = () => api.get('/admin/load-balancer/status');
export const getReplicationStatus = () => api.get('/admin/replication/status');
export const getClockSyncStatus = () => api.get('/admin/clock-sync/status');
export const getMutexStatus = () => api.get('/admin/mutex/status');
export const restartService = (serviceName) => api.post(`/admin/services/${serviceName}/restart`);
export const updateSystemConfig = (config) => api.post('/admin/config', config);
export const clearSystemLogs = () => api.delete('/admin/logs');
export const exportSystemLogs = (params = {}) => api.get('/admin/logs/export', { params, responseType: 'blob' });
export const simulateEvent = (type, data = {}) => api.post(`/admin/simulate/${type}`, data);

export default api;
