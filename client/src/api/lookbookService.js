import API from './api';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const mediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
  if (path.startsWith('/uploads/')) return `${apiOrigin}${path}`;
  return '';
};

export const lookbookService = {
  list: async (all = false, placement) => {
    const response = await API.get(all ? '/lookbook/admin' : '/lookbook', {
      params: placement ? { placement } : undefined
    });
    return response.data;
  },
  create: async (formData) => {
    const response = await API.post('/lookbook', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000
    });
    return response.data;
  },
  remove: async (id) => {
    const response = await API.delete(`/lookbook/${id}`);
    return response.data;
  }
};
