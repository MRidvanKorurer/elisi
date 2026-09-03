


import API from './api';

export const productService = {
  // 1. GENEL KULLANIM: Ana sayfa, kategoriler, genel listelemeler
  getAllProducts: async (params = {}) => {
    const response = await API.get('/products', { params });
    return response.data;
  },

  // 2. FİLTRELEME SAYFASI: Gelişmiş arama, fiyat slider, pagination ve sıralama
  getFilteredProducts: async (filters = {}) => {
    const response = await API.get('/products/filter', { params: filters });
    return response.data;
  },

  // 3. TEK ÜRÜN DETAYI
  getProductById: async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
  },

  // 4. ÇOK SATANLAR (Best Sellers)
  getBestSellers: async () => {
    const response = await API.get('/products/bestsellers');
    return response.data;
  },

  // 5. SPONSORLU ÜRÜNLER
  getSponsoredProducts: async () => {
    try {
      const response = await API.get('/products/sponsored');
      return response.data;
    } catch (error) {
      console.error("Sponsorlu ürünler çekilemedi:", error);
      return { success: false, products: [] };
    }
  },
  // YENİ EKLENEN KATEGORİ FONKSİYONU:
  getCategories: async () => {
    const response = await API.get('/products/categories');
    return response.data;
  },
};

export default productService;