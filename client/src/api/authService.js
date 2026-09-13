import API from './api';

export const authService = {
  // Kayıt Ol
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    return response.data;
  },

  // Giriş Yap
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  },

  // Google ile giriş / kayıt (ID token veya access token)
  google: async (payload) => {
    const body = typeof payload === 'string' ? { credential: payload } : payload;
    const response = await API.post('/auth/google', body);
    return response.data;
  },

  // Kullanıcı Profili Getir
  getProfile: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },

  verifyCampaign: async (kod) => {
    const response = await API.post('/auth/verify-campaign', { kod });
    return response.data;
  }
};