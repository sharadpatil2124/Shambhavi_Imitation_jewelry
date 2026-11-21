export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const isProd = typeof import.meta !== 'undefined' && import.meta.env?.PROD;
  const defaultApiUrl = isProd
    ? 'https://shambhavi-backend-n0ud.onrender.com/api'
    : 'http://localhost:5000/api';
  const apiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || defaultApiUrl;
  const backendBase = apiUrl.replace(/\/api$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanUrl}`;
};
