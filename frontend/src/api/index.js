import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:8000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/jwt/create/', credentials),
  register: (userData) => api.post('/auth/users/', userData),
  getUser: () => api.get('/users/me/'),
  updateProfile: (data) => api.patch('/users/update_profile/', data),
};

// User API
export const userAPI = {
  getUsers: (params) => api.get('/users/', { params }),
  getUserById: (id) => api.get(`/users/${id}/`),
  addSkill: (data) => api.post('/user-skills/', data),
  updateSkill: (id, data) => api.patch(`/user-skills/${id}/`, data),
  deleteSkill: (id) => api.delete(`/user-skills/${id}/`),
  getAvailability: (userId) => api.get('/user-availability/', { params: { user_id: userId } }),
  addAvailability: (data) => api.post('/user-availability/', data),
  updateAvailability: (id, data) => api.patch(`/user-availability/${id}/`, data),
  deleteAvailability: (id) => api.delete(`/user-availability/${id}/`),
};

// Category API
export const categoryAPI = {
  getCategories: () => api.get('/categories/'),
};

// Credit API
export const creditAPI = {
  getBalance: () => api.get('/credits/balance/'),
  getTransactions: () => api.get('/credit-transactions/'),
  purchaseCredits: (data) => api.post('/payments/purchase_credits/', data),
};

// Meeting API
export const meetingAPI = {
  getMeetings: (params) => api.get('/meetings/', { params }),
  getMeetingById: (id) => api.get(`/meetings/${id}/`),
  createMeeting: (data) => api.post('/meetings/', data),
  updateMeetingStatus: (id, data) => api.patch(`/meetings/${id}/update_status/`, data),
  getReviews: (params) => api.get('/reviews/', { params }),
  createReview: (data) => api.post('/reviews/', data),
};

// Messaging API
export const messagingAPI = {
  getMessages: (params) => api.get('/messages/', { params }),
  sendMessage: (data) => api.post('/messages/', data),
  markMessageRead: (id) => api.patch(`/messages/${id}/mark_read/`),
  markAllMessagesRead: (senderId) => api.patch('/messages/mark_all_read/', { sender_id: senderId }),
  getNotifications: () => api.get('/notifications/'),
  markNotificationRead: (id) => api.patch(`/notifications/${id}/mark_read/`),
  markAllNotificationsRead: () => api.patch('/notifications/mark_all_read/'),
};

export default api;
