import axios from 'axios';

// Instantiate global Axios client configured for our MERN backend port
const api = axios.create({
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
});

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

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let errorMessage = 'An unexpected network error occurred. Please try again.';

    if (error.response) {
      if (error.response.status === 401 && !error.config.url.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      errorMessage = 'Unable to reach the server. Please check your internet connection or try again later.';
    }

    console.error('⚠️ [API Request Error]:', errorMessage, error);
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
