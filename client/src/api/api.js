import axios from 'axios';
import { API_BASE_URL, API_ORIGIN } from '../utils/publicUrls';

// 1. Axios Instance Oluşturma
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // HttpOnly Cookie'lerin (JWT) otomatik gönderilmesini sağlar
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 saniye zaman aşımı
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
API.interceptors.response.use(
  (response) => {
    response.data = resolveUploads(response.data);
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Oturum süresi dolduğunda veya yetkisiz istekte çalışır
      // İsteğe bağlı yönlendirme: window.location.href = '/giris';
    }
    return Promise.reject(error);
  }
);

export default API;