/** Canlı storefront ve API. Env yoksa production bu değerlere düşer. */
export const PRODUCTION_SITE_URL = 'https://nikbagstore.com';
export const PRODUCTION_API_BASE = 'https://elisi-fxey.onrender.com/api';

const trimSlash = (value = '') => String(value || '').replace(/\/$/, '');

export const SITE_URL = trimSlash(import.meta.env.VITE_SITE_URL || PRODUCTION_SITE_URL);
export const API_BASE_URL = trimSlash(import.meta.env.VITE_API_BASE_URL || PRODUCTION_API_BASE);
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
