import API from './api'; // api.js dosyanın bulunduğu yolu kendi yapına göre ayarla

export const orderService = {
  
  // 1. Yeni Sipariş Oluşturma İsteği
  createOrder: async (orderData) => {
    try {
      // baseURL zaten '/api' içerdiği için sadece '/orders' ekliyoruz
      const response = await API.post('/orders/create', orderData);
      
      return response.data; 
    } catch (error) {
      console.error("Sipariş API Hatası:", error);
      throw error.response?.data || { success: false, message: 'Sunucuya bağlanırken bir hata oluştu.' };
    }
  },
};