import axios from 'axios';

const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD;
const defaultApiUrl = isProd
  ? 'https://shambhavi-backend-n0ud.onrender.com/api'
  : 'http://localhost:5000/api';

// Instantiate global Axios client configured for our MERN backend port
const api = axios.create({
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || defaultApiUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // 60 seconds (allows for Render cold starts if sleeping)
});

// Request Interceptor: Automatically inject secure JWT Bearer authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format errors into clean, readable user messages
api.interceptors.response.use(
  (response) => response.data, // Strip axios data envelope and return raw payload directly
  (error) => {
    let errorMessage = 'An unexpected network error occurred. Please try again.';

    if (error.response) {
      // The server responded with a status code out of the 2xx range
      if (error.response.status === 401 && !error.config.url.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      // The request was made but no response was received (e.g. Server is offline)
      errorMessage = 'Unable to reach the server. Please check your internet connection or try again later.';
    }

    console.error('⚠️ [API Request Error]:', errorMessage, error);
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
