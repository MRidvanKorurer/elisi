import API from './api'; // api.js dosyanın bulunduğu yolu kendi yapına göre ayarla

export const orderService = {
  
  // 1. Yeni Sipariş Oluşturma İsteği
  createOrder: async (orderData) => {
    try {
      // baseURL zaten '/api' içerdiği için sadece '/orders' ekliyoruz
      const response = await API.post('/orders/create', orderData, { timeout: 30000 });
      
      return response.data; 
    } catch (error) {
      console.error("Sipariş API Hatası:", error);
      throw error.response?.data || { success: false, message: error.response?.data?.message || 'Sunucuya bağlanırken bir hata oluştu.' };
    }
  },

  guestThread: async (orderId, email) => {
    try {
      const response = await API.get(`/orders/guest/${orderId}`, { params: { email } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Sipariş notları alınamadı.' };
    }
  },

  guestNote: async (orderId, email, text) => {
    try {
      const response = await API.post(`/orders/guest/${orderId}/notes`, { email, text });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Soru iletilemedi.' };
    }
  },

  addNote: async (orderId, text) => {
    try {
      const response = await API.post(`/orders/myorders/${orderId}/notes`, { text });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Not iletilemedi.' };
    }
  }
};