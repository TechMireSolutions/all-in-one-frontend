import axios from 'axios';

// Resolve VITE_API_BASE_URL (which has '/api/') to the main server root URL
const baseApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/';
const API_BASE_URL = baseApiUrl.replace(/\/api\/?$/, '') || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export { API_BASE_URL };
