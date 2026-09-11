import API from './api';
import { cachedGet } from './cache';

const apiOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const mediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
  if (path.startsWith('/uploads/')) return `${apiOrigin}${path}`;
  if (path.startsWith('/')) return path;
  return path;
};

export const lookbookService = {
  list: async (all = false, placement) => {
    const fetchList = async () => {
      const response = await API.get(all ? '/lookbook/admin' : '/lookbook', {
        params: placement ? { placement } : undefined
      });
      return response.data;
    };
    if (all) return fetchList();
    return cachedGet(`lookbook:${placement || 'all'}`, fetchList, 90_000);
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
