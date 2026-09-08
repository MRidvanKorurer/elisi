import API from './api';

export const questionService = {
  getQuestions: async (productId, { page = 1, limit = 8 } = {}) => {
    const response = await API.get(`/questions/${encodeURIComponent(productId)}`, {
      params: { page, limit }
    });
    return response.data;
  },

  askQuestion: async (productId, question) => {
    const response = await API.post(`/questions/${encodeURIComponent(productId)}`, { question });
    return response.data;
  },

  getSellerInbox: async (status = 'all') => {
    const response = await API.get('/questions/seller/inbox', { params: { status } });
    return response.data;
  },

  answerQuestion: async (questionId, answer) => {
    const response = await API.put(`/questions/item/${encodeURIComponent(questionId)}/answer`, { answer });
    return response.data;
  },

  deleteQuestion: async (questionId) => {
    const response = await API.delete(`/questions/item/${encodeURIComponent(questionId)}`);
    return response.data;
  }
};

export default questionService;
