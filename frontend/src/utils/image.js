/**
 * Utility helper to resolve relative image paths to the MERN backend server URL.
 * Handles both absolute URLs (e.g. Unsplash) and local upload relative paths.
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanUrl}`;
};
