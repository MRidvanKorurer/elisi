import API from './api'; // Axios instance'ın nerede tanımlıysa ona göre yolunu ayarla

export const bannerService = {
  getActiveBanners: async () => {
    const response = await API.get('/banners');
    return response.data;
  }
};