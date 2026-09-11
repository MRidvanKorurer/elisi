import API from './api';

const SESSION_KEY = 'nb_ad_session';

const sessionId = () => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
};

const asEvent = (item) => {
  if (!item) return null;
  const product = item.product || item.productId;
  if (product && !/^[a-f0-9]{24}$/i.test(String(product))) return null;
  return {
    type: item.type === 'impression' ? 'impression' : 'click',
    surface: item.surface || 'product',
    product: product || null,
    seller: (item.seller && item.seller._id) || item.seller || null,
    session: sessionId(),
    path: typeof window !== 'undefined' ? window.location.pathname : ''
  };
};

export const adsService = {
  track: (events) => {
    const list = (Array.isArray(events) ? events : [events]).map(asEvent).filter(Boolean);
    if (!list.length) return Promise.resolve();
    return API.post('/ads/events', { events: list }).catch(() => {});
  }
};
