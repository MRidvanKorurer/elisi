import API from './api';

export const sellerService = {
  register: async (payload) => {
    const response = await API.post('/sellers/register', payload);
    return response.data;
  },

  getMe: async () => {
    const response = await API.get('/sellers/me');
    return response.data;
  }
};
