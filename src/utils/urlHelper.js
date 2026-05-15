/**
 * Generates a full URL for an image or document path.
 * Handles both absolute S3 URLs and relative local paths.
 * 
 * @param {string} path - The file path or URL from the backend.
 * @param {string} baseUrl - The base API URL (e.g., from import.meta.env.VITE_API_BASE_URL).
 * @returns {string} The full absolute URL.
 */
export const getFullUrl = (path, baseUrl) => {
  if (!path) return '';
  
  // If it's already an absolute URL (S3, etc.), return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Otherwise, prepend the base domain (stripping /api if present in the base URL)
  const base = (baseUrl || '').replace('/api', '');
  
  // Ensure we include /uploads prefix if it's a relative path and doesn't have it
  // Most local uploads are stored in the uploads folder and accessed via /uploads route
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!cleanPath.startsWith('/uploads/')) {
    cleanPath = `/uploads${cleanPath}`;
  }
  
  return `${base}${cleanPath}`;
};
