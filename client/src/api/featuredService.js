import API from './api';

export const featuredService = {
  meta: async () => (await API.get('/featured/meta')).data
};
