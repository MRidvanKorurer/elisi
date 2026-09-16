import API from './api';

export const atelierWeekService = {
  list: async () => (await API.get('/ateliers/week')).data,
  directory: async (params = {}) => (await API.get('/ateliers', { params })).data
};
