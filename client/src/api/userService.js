import API from './api'; // Kendi oluşturduğun Axios instance'ını içe aktar (Yolu projene göre düzenle)

// Ana dizin api.js içinde '/api' olarak tanımlı olduğu için 
// burada sadece '/users' ile devam ediyoruz.
const USER_URL = '/users';

// ==========================================
// PROFİL İŞLEMLERİ
// ==========================================

// 1. Kullanıcının tüm profil verilerini (Adresler, Kartlar dahil) getirir
const getProfile = async () => {
    const response = await API.get(`${USER_URL}/profile`);
    return response.data;
};

// 2. Kullanıcının temel bilgilerini günceller (Ad Soyad, Telefon)
const updateProfile = async (userData) => {
    const response = await API.put(`${USER_URL}/profile/update`, userData);
    return response.data;
};

// 3. Şifre değiştirme işlemini yapar
const changePassword = async (passwordData) => {
    const response = await API.put(`${USER_URL}/profile/change-password`, passwordData);
    return response.data;
};

// ==========================================
// ADRES İŞLEMLERİ
// ==========================================

// 4. Yeni adres kaydeder
const addAddress = async (addressData) => {
    const response = await API.post(`${USER_URL}/addresses`, addressData);
    return response.data;
};

// 5. Kayıtlı adresi ID'sine göre siler
const deleteAddress = async (addressId) => {
    const response = await API.delete(`${USER_URL}/addresses/${addressId}`);
    return response.data;
};



// ==========================================
// KART İŞLEMLERİ
// ==========================================

const addCard = async (cardData) => {
    const response = await API.post(`${USER_URL}/cards`, cardData);
    return response.data;
};

const deleteCard = async (cardId) => {
    const response = await API.delete(`${USER_URL}/cards/${cardId}`);
    return response.data;
};


const getOrders = async () => {
    const response = await API.get(`/orders/myorders`); // Burası güncellendi
    return response.data;
};

const getOrderById = async (orderId) => {
    const response = await API.get(`/orders/myorders/${orderId}`); // Burası güncellendi
    return response.data;
};

// ==========================================
// FAVORİ İŞLEMLERİ
// ==========================================
const getFavorites = async () => {
    const response = await API.get(`${USER_URL}/favorites`);
    return response.data;
};

const addFavorite = async (productId) => {
    const response = await API.post(`${USER_URL}/favorites`, { productId });
    return response.data;
};

const removeFavorite = async (productId) => {
    const response = await API.delete(`${USER_URL}/favorites/${productId}`);
    return response.data;
};

// İhracı (Export) Güncelle:
const userService = {
    getProfile, updateProfile, changePassword,
    addAddress, deleteAddress, 
    addCard, deleteCard,
    getOrders, getOrderById,
    getFavorites, addFavorite, removeFavorite 
};







export default userService;