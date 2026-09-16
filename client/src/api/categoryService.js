import API from './api';
import { cachedGet, invalidateCache } from './cache';

const multipart = { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 };

const bustCategoryCaches = () => {
  invalidateCache('categories:');
  invalidateCache('products:categories');
  invalidateCache('products:filter-options');
};

export const categoryService = {
  getAllCategories: async () =>
    cachedGet(
      'categories:all',
      async () => {
        const response = await API.get('/categories');
        const data = response.data;
        if (Array.isArray(data)) {
          return { success: true, categories: data, totalProducts: 0 };
        }
        return {
          success: Boolean(data?.success ?? true),
          categories: data?.categories || [],
          totalProducts: data?.totalProducts || 0
        };
      },
      5 * 60_000
    ),

  adminList: async () => (await API.get('/admin/categories')).data,

  adminCreate: async (payload) => {
    const data = (
      await API.post(
        '/admin/categories',
        payload,
        payload instanceof FormData ? multipart : undefined
      )
    ).data;
    bustCategoryCaches();
    return data;
  },

  adminUpdate: async (id, payload) => {
    const data = (
      await API.put(
        `/admin/categories/${id}`,
        payload,
        payload instanceof FormData ? multipart : undefined
      )
    ).data;
    bustCategoryCaches();
    return data;
  },

  adminRemove: async (id) => {
    const data = (await API.delete(`/admin/categories/${id}`)).data;
    bustCategoryCaches();
    return data;
  }
};

export default categoryService;
