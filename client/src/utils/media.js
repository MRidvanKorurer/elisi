export const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

// Eski kayıtlar /uploads/... ; yeni görseller Cloudinary https adresidir.
export const toRelativeUpload = (url = '') =>
  typeof url === 'string' && url.startsWith(`${API_ORIGIN}/uploads/`) ? url.slice(API_ORIGIN.length) : url;
