import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('healix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for handling token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('healix_token');
        localStorage.removeItem('healix_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  getPublicHospitals: () => api.get('/hospitals/list'),
};

export const hospitalAPI = {
  getDashboard: () => api.get('/hospital/dashboard'),
  getDataset: () => api.get('/hospital/dataset'),
  uploadDataset: (formData) => api.post('/hospital/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  trainModel: (params) => api.post('/hospital/train', params || {}),
  getTrainingStatus: () => api.get('/hospital/training-status'),
  submitUpdate: () => api.post('/hospital/submit-update'),
  getUpdates: () => api.get('/hospital/updates'),
  getGlobalStatus: () => api.get('/hospital/global-model-status'),
  syncGlobalModel: () => api.post('/hospital/sync-global'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getClients: () => api.get('/admin/clients'),
  addHospital: (data) => api.post('/admin/hospitals', data),
  deleteHospital: (hospitalId) => api.delete(`/admin/hospitals/${hospitalId}`),
  runFederatedAverage: () => api.post('/admin/aggregate'),
  distributeGlobalModel: () => api.post('/admin/distribute'),
  getPerformance: () => api.get('/admin/performance'),
};

export const predictionAPI = {
  predictAndExplain: (patientData) => api.post('/predict', patientData),
};

export default api;
