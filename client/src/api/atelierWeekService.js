import API from './api';

export const atelierWeekService = {
  list: async () => (await API.get('/ateliers/week')).data,
  meta: async () => (await API.get('/ateliers/week/meta')).data
};
