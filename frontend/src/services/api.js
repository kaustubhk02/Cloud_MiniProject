import axios from 'axios';

// In dev, prefer same-origin `/api` so Vite proxies to the backend (see vite.config.js).
const envUrl = (import.meta.env.VITE_API_URL || '').trim();
const baseURL =
  envUrl ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL,
  // Don't set Content-Type here - let axios auto-detect (especially for FormData)
});

// Attach JWT token to every request
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

// Handle 401 globally — auto logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
