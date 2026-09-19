import { API_ORIGIN } from './publicUrls';

export { API_ORIGIN };

// Eski kayıtlar /uploads/... ; yeni görseller Cloudinary https adresidir.
export const toRelativeUpload = (url = '') =>
  typeof url === 'string' && url.startsWith(`${API_ORIGIN}/uploads/`) ? url.slice(API_ORIGIN.length) : url;
