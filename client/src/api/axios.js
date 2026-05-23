import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT for admin routes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        message: 'Service temporarily unavailable — please try again in a few minutes.',
        isNetworkError: true,
      });
    }
    if (error.response.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    let msg = error.response.data?.error || error.response.data?.message || 'An unexpected error occurred.';
    if (typeof msg === 'object') {
      msg = msg.message || JSON.stringify(msg);
    }
    return Promise.reject({ message: msg, status: error.response.status });
  }
);

export default api;
