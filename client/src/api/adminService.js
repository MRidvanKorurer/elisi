import API from './api';

const multipart = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 };

export const adminService = {
  overview: async () => (await API.get('/admin/overview')).data,
  orders: async () => (await API.get('/admin/orders')).data,
  updateOrder: async (id, payload) => (await API.put(`/admin/orders/${id}`, payload)).data,
  users: async () => (await API.get('/admin/users')).data,
  setUserRole: async (id, rol) => (await API.put(`/admin/users/${id}/role`, { rol })).data,
  sellers: async () => (await API.get('/admin/sellers')).data,
  setSellerStatus: async (id, payload) => (await API.put(`/admin/sellers/${id}/status`, payload)).data,
  products: async () => (await API.get('/admin/products')).data,
  updateProduct: async (id, payload) =>
    (await API.put(`/admin/products/${id}`, payload, payload instanceof FormData ? multipart : undefined)).data,
  setProductApproval: async (id, payload) => (await API.put(`/admin/products/${id}/approval`, payload)).data,
  hideProduct: async (id) => (await API.delete(`/admin/products/${id}`)).data,
  featured: async (params) => (await API.get('/admin/featured', { params })).data,
  reviewFeatured: async (id, payload) => (await API.put(`/admin/featured/${id}`, payload)).data,
  removeFeatured: async (id, payload) => (await API.put(`/admin/featured/${id}/remove`, payload)).data
};
