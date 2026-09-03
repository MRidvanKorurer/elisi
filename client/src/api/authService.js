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

  // Kullanıcı Profili Getir
  getProfile: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  }
};