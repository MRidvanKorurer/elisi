import API from './api';

export const atelierWeekService = {
  list: async () => (await API.get('/ateliers/week')).data
};
