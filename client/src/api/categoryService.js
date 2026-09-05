import API from './api'; // Senin mevcut axios instance'ın

export const categoryService = {
  getAllCategories: async () => {
    const response = await API.get('/categories');
    return response.data;
  }
};