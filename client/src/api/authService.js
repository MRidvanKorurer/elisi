import API from './api';

export const authService = {
  google: async (payload) => {
    const body = typeof payload === 'string' ? { credential: payload } : payload;
    const response = await API.post('/auth/google', body);
    return response.data;
  },

  getProfile: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },

  verifyCampaign: async (kod) => {
    const response = await API.post('/auth/verify-campaign', { kod });
    return response.data;
  }
};
