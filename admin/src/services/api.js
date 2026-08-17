import axios from 'axios';

// Instantiate global Axios client configured for our MERN backend port
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // 60 seconds — Render free-tier cold starts can take 30-50s
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
