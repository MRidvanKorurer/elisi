import userService from '../api/userService';

export const FAVORITES_UPDATED = 'favoritesUpdated';

let ids = new Set();
let loaded = false;
let inflight = null;

const toId = (value) => String(value?._id || value?.id || value || '');

const notify = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED, { detail: { ids: [...ids] } }));
};

export const isProductFavorite = (productId) => Boolean(productId) && ids.has(String(productId));

export const setFavoriteIds = (list = []) => {
  ids = new Set((list || []).map(toId).filter(Boolean));
  loaded = true;
  notify();
};

export const setProductFavorite = (productId, on) => {
  const key = String(productId || '');
  if (!key) return;
  if (on) ids.add(key);
  else ids.delete(key);
  loaded = true;
  notify();
};

export const clearFavoriteCache = () => {
  ids = new Set();
  loaded = false;
  inflight = null;
  notify();
};

export const loadFavoriteIds = async (force = false) => {
  if (!force && loaded) return ids;
  if (inflight && !force) return inflight;

  if (inflight && force) {
    try { await inflight; } catch { /* önceki istek bitsin */ }
  }

  inflight = userService.getFavorites()
    .then((res) => {
      setFavoriteIds(res?.favorites || []);
      return ids;
    })
    .catch((error) => {
      if (error?.response?.status === 401) {
        ids = new Set();
        loaded = true;
        notify();
      }
      return ids;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
};
