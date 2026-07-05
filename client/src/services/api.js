import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Emergency Services
export const emergencyService = {
  create: (data) => api.post('/emergencies', data),
  getAll: (params) => api.get('/emergencies', { params }),
  getMy: () => api.get('/emergencies/my'),
  getById: (id) => api.get(`/emergencies/${id}`),
  update: (id, data) => api.put(`/emergencies/${id}`, data),
  assignDoctor: (id) => api.put(`/emergencies/${id}/assign-doctor`),
  assignDriver: (id, driverId) => api.put(`/emergencies/${id}/assign-driver`, { driverId }),
  declineDriver: (id) => api.put(`/emergencies/${id}/decline-driver`),
  resolve: (id, notes) => api.put(`/emergencies/${id}/resolve`, { resolutionNotes: notes }),
  getActive: () => api.get('/emergencies/active'),
  getTimeline: (id) => api.get(`/emergencies/${id}/timeline`),
};

// IoT Services
export const iotService = {
  getVitals: (patientId) => api.get(`/iot/vitals/${patientId}`),
  updateVitals: (data) => api.post('/iot/vitals', data)
};

// Hospital Services
export const hospitalService = {
  create: (data) => api.post('/hospitals', data),
  getAll: () => api.get('/hospitals')
};

// Chat Services
export const chatService = {
  getMessages: (emergencyId) => api.get(`/chat/${emergencyId}`),
  sendMessage: (data) => api.post('/chat', data),
  markAsRead: (messageId) => api.put(`/chat/read/${messageId}`),
  uploadImage: (formData) => api.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Notification Services
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

// Analytics Services
export const analyticsService = {
  getOverview: () => api.get('/analytics/overview'),
  getHospitals: () => api.get('/analytics/hospitals'),
};

export default api;
