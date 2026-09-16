import API from './api';

export const supportService = {
  chat: async ({ message, history }) => {
    const response = await API.post('/support/chat', { message, history }, { timeout: 25000 });
    return response.data;
  }
};

export default supportService;
