import API from './api';

let cached = null;
let pending = null;

export const getSitePublic = ({ fresh = false } = {}) => {
  if (!fresh && cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = API.get('/site')
    .then((res) => {
      cached = res.data?.site || {};
      return cached;
    })
    .catch(() => cached || {})
    .finally(() => {
      pending = null;
    });
  return pending;
};

export const subscribeNewsletter = (email) => API.post('/site/newsletter', { email });
