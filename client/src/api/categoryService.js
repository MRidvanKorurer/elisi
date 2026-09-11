import API from './api';
import { cachedGet } from './cache';

export const categoryService = {
  getAllCategories: async () => cachedGet('categories:all', async () => {
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
  }, 5 * 60_000)
};
