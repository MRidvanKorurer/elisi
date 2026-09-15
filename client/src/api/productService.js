import API from './api';
import { cachedGet } from './cache';

export const productService = {
  getFilteredProducts: async (filters = {}) => {
    const response = await API.get('/products/filter', { params: filters });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
  },

  getBestSellers: async () => cachedGet('products:bestsellers', async () => {
    const response = await API.get('/products/bestsellers');
    return response.data;
  }, 90_000),

  getSponsoredProducts: async () => {
    try {
      const response = await API.get('/products/sponsored');
      return response.data;
    } catch (error) {
      console.error("Sponsorlu ürünler çekilemedi:", error);
      return { success: false, products: [] };
    }
  },

  getCategories: async () => cachedGet('products:categories', async () => {
    const response = await API.get('/products/categories');
    return response.data;
  }, 5 * 60_000),

  getFilterOptions: async () => cachedGet('products:filter-options', async () => {
    const response = await API.get('/products/filter-options');
    return response.data;
  }, 5 * 60_000),
};

export default productService;
