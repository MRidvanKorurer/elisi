import API from './api';

export const sellerService = {
  register: async (payload) => {
    const response = await API.post('/sellers/register', payload);
    return response.data;
  },

  getMe: async () => {
    const response = await API.get('/sellers/me');
    return response.data;
  },

  updateMe: async (payload) => {
    const response = await API.put('/sellers/me', payload);
    return response.data;
  },

  getOverview: async () => {
    const response = await API.get('/sellers/me/overview');
    return response.data;
  },

  getMyOrders: async () => {
    const response = await API.get('/sellers/me/orders');
    return response.data;
  },

  updateMyOrder: async (id, payload) => {
    const response = await API.put(`/sellers/me/orders/${id}`, payload);
    return response.data;
  },

  getMyProducts: async () => {
    const response = await API.get('/sellers/me/products');
    return response.data;
  },

  getQuestions: async (status = 'all') => {
    const response = await API.get('/questions/seller/inbox', { params: { status } });
    return response.data;
  },

  createProduct: async (payload) => {
    const response = await API.post(
      '/sellers/me/products',
      payload,
      payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 } : undefined
    );
    return response.data;
  },

  updateProduct: async (id, payload) => {
    const response = await API.put(
      `/sellers/me/products/${id}`,
      payload,
      payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 } : undefined
    );
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await API.delete(`/sellers/me/products/${id}`);
    return response.data;
  },

  getMyPromos: async () => {
    const response = await API.get('/sellers/me/promos');
    return response.data;
  },

  createPromo: async (payload) => {
    const response = await API.post('/sellers/me/promos', payload);
    return response.data;
  },

  updatePromo: async (id, payload) => {
    const response = await API.put(`/sellers/me/promos/${id}`, payload);
    return response.data;
  },

  deletePromo: async (id) => {
    const response = await API.delete(`/sellers/me/promos/${id}`);
    return response.data;
  },

  getMyFeatured: async () => {
    const response = await API.get('/sellers/me/featured');
    return response.data;
  },

  createFeatured: async (payload) => {
    const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
    const response = await API.post(
      '/sellers/me/featured',
      payload,
      isForm ? { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 } : undefined
    );
    return response.data;
  },

  cancelFeatured: async (id) => {
    const response = await API.delete(`/sellers/me/featured/${id}`);
    return response.data;
  },

  getPublic: async (slug, params = {}) => {
    const response = await API.get(`/sellers/public/${encodeURIComponent(slug)}`, { params });
    return response.data;
  }
};
