export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const defaultApiUrl = 'http://localhost:5000/api'; // development; production builds set VITE_API_URL
  const apiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || defaultApiUrl;
  const backendBase = apiUrl.replace(/\/api$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanUrl}`;
};
