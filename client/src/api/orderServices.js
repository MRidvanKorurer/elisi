import API from './api'; // api.js dosyanın bulunduğu yolu kendi yapına göre ayarla
import i18n from '../i18n';

const fallback = (key, defaultValue) => ({ message: i18n.t(`orderErrors.${key}`, { ns: 'checkout', defaultValue }) });

export const orderService = {
  
  // 1. Yeni Sipariş Oluşturma İsteği
  createOrder: async (orderData) => {
    try {
      // baseURL zaten '/api' içerdiği için sadece '/orders' ekliyoruz
      const response = await API.post('/orders/create', orderData, { timeout: 30000 });
      
      return response.data; 
    } catch (error) {
      console.error("Sipariş API Hatası:", error);
      throw {
        success: false,
        message: error.message || fallback('create', 'Siparişiniz şu an alınamadı. Lütfen tekrar deneyin.').message
      };
    }
  },

  guestThread: async (orderId, email) => {
    try {
      const response = await API.get(`/orders/guest/${orderId}`, { params: { email } });
      return response.data;
    } catch (error) {
      throw error.response?.data || fallback('thread', 'Sipariş notları alınamadı.');
    }
  },

  guestNote: async (orderId, email, text) => {
    try {
      const response = await API.post(`/orders/guest/${orderId}/notes`, { email, text });
      return response.data;
    } catch (error) {
      throw error.response?.data || fallback('question', 'Soru iletilemedi.');
    }
  },

  addNote: async (orderId, text) => {
    try {
      const response = await API.post(`/orders/myorders/${orderId}/notes`, { text });
      return response.data;
    } catch (error) {
      throw error.response?.data || fallback('note', 'Not iletilemedi.');
    }
  }
};
