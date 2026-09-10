import API from './api';

export const promoService = {
  verify: async (kod, subtotal, items = []) => {
    const response = await API.post('/promos/verify', { kod, subtotal, items });
    return response.data;
  },
  list: async () => (await API.get('/admin/promos')).data,
  create: async (payload) => (await API.post('/admin/promos', payload)).data,
  update: async (id, payload) => (await API.put(`/admin/promos/${id}`, payload)).data,
  remove: async (id) => (await API.delete(`/admin/promos/${id}`)).data
};
