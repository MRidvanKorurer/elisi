
import axios from 'axios';

// 1. Axios Instance Oluşturma
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
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

// 3. Response Interceptor: Global Yetki ve Hata Yönetimi
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Oturum süresi dolduğunda veya yetkisiz istekte çalışır
      // İsteğe bağlı yönlendirme: window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default API;