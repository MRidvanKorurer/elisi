import API from './api';

export const productService = {
  getAllProducts: async () => {
    const response = await API.get('/products');
    return response.data;
  },
  getProductById: async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
  },
  // BEST SELLERS İÇİN EKLENEN YENİ FONKSİYON:
  getBestSellers: async () => {
    const response = await API.get('/products/bestsellers');
    return response.data;
  },

  getSponsoredProducts: async () => {
    try {
      const response = await API.get('/products/sponsored');
      return response.data;
    } catch (error) {
      console.error("Sponsorlu ürünler çekilemedi:", error);
      return { success: false, products: [] };
    }
  }

};