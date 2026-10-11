import axios from 'axios';
import { API_BASE_URL, API_ORIGIN } from '../utils/publicUrls';

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

const userMessage = (error, fallback = 'Bir sorun oluştu. Lütfen tekrar deneyin.') => {
  if (error?.code === 'ECONNABORTED' || /timeout of \d/i.test(error?.message || '')) {
    return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }
  if (!error?.response) return 'Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.';
  const data = error.response.data;
  const raw = data?.mesaj || data?.message || '';
  if (raw && !internalText(raw)) return raw;
  if (error.response.status === 401) return 'Oturumunuz sona erdi. Lütfen yeniden giriş yapın.';
  if (error.response.status === 403) return 'Bu işlem için yetkiniz yok.';
  if (error.response.status === 404) return 'Aradığınız kayıt bulunamadı.';
  return fallback;
};

API.interceptors.response.use(
  (response) => {
    response.data = resolveUploads(response.data);
    return response;
  },
  (error) => {
    const message = userMessage(error);
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data.mesaj = error.response.data.mesaj && !internalText(error.response.data.mesaj)
        ? error.response.data.mesaj
        : message;
      error.response.data.message = error.response.data.message && !internalText(error.response.data.message)
        ? error.response.data.message
        : message;
      delete error.response.data.hata;
      delete error.response.data.error;
    }
    error.message = message;
    return Promise.reject(error);
  }
);

export default API;