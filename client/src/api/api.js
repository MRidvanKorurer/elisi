import axios from 'axios';
import { API_BASE_URL, API_ORIGIN } from '../utils/publicUrls';
import { localeFromPath } from '../i18n/locale';

/** İçerik dili adres çubuğundan okunur; dil değişimi efektlerinden önce de doğru sonuç verir. */
export const currentLocale = () =>
  (typeof window === 'undefined' ? 'tr' : localeFromPath(window.location.pathname));

// 1. Axios Instance Oluşturma
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // HttpOnly Cookie'lerin (JWT) otomatik gönderilmesini sağlar
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 25000
});

// 2. Request Interceptor: İstek öncesi kontroller
API.interceptors.request.use(
  (config) => {
    // HttpOnly Cookie kullanıldığı için Authorization başlığına elle token eklenmez,
    // tarayıcı çerezi otomatik olarak isteğe ekler.
    if (currentLocale() === 'en' && !String(config.url || '').startsWith('/admin')) {
      config.params = { ...(config.params || {}), lang: 'en' };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Sunucudan gelen /uploads yolları tarayıcıda API adresine göre çözülür

const resolveUploads = (value) => {
  if (typeof value === 'string') {
    return value.startsWith('/uploads/') ? `${API_ORIGIN}${value}` : value;
  }
  if (Array.isArray(value)) return value.map(resolveUploads);
  if (value && typeof value === 'object') {
    Object.keys(value).forEach((key) => {
      value[key] = resolveUploads(value[key]);
    });
  }
  return value;
};

// 3. Response Interceptor: Global Yetki ve Hata Yönetimi
const internalText = (value) =>
  /is not defined|ECONN|Mongo|Cast to|ValidationError|Cannot read|E11000|status code \d|timeout of \d|Network Error|\/node_modules\//i
    .test(String(value || ''));

const MESSAGES = {
  tr: {
    fallback: 'Bir sorun oluştu. Lütfen tekrar deneyin.',
    timeout: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
    offline: 'Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.',
    401: 'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.',
    403: 'Bu işlem için yetkiniz yok.',
    404: 'Aradığınız kayıt bulunamadı.'
  },
  en: {
    fallback: 'Something went wrong. Please try again.',
    timeout: 'The request timed out. Please try again.',
    offline: 'Could not connect. Check your internet connection and try again.',
    401: 'Your session has ended. Please sign in again.',
    403: 'You do not have permission to do this.',
    404: 'We could not find what you were looking for.'
  }
};

const TURKISH_TEXT = /[çğıöşüÇĞİÖŞÜ]/;

const userMessage = (error) => {
  const locale = currentLocale();
  const text = MESSAGES[locale] || MESSAGES.tr;
  if (error?.code === 'ECONNABORTED' || /timeout of \d/i.test(error?.message || '')) return text.timeout;
  if (!error?.response) return text.offline;
  const data = error.response.data;
  const raw = data?.mesaj || data?.message || '';
  const readable = raw && !internalText(raw) && !(locale === 'en' && TURKISH_TEXT.test(raw));
  if (readable) return raw;
  return text[error.response.status] || text.fallback;
};

API.interceptors.response.use(
  (response) => {
    response.data = resolveUploads(response.data);
    return response;
  },
  (error) => {
    const message = userMessage(error);
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data.mesaj = message;
      error.response.data.message = message;
      delete error.response.data.hata;
      delete error.response.data.error;
    }
    error.message = message;
    return Promise.reject(error);
  }
);

export default API;