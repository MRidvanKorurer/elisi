import API from './api';

// --- MİSAFİR (GUEST) YARDIMCI FONKSİYONLARI ---
const getLocalCart = () => JSON.parse(localStorage.getItem('guestCart')) || [];
const saveLocalCart = (cart) => localStorage.setItem('guestCart', JSON.stringify(cart));

export const cartService = {
  // 1. SEPETİ GETİR
  getCart: async () => {
    try {
      const response = await API.get('/cart');
      return response.data; 
    } catch (error) {
      // Backend'e ulaşılamazsa (Giriş yapılmamışsa vs.) DİREKT yerel sepeti döndür
      return { success: true, items: getLocalCart(), isGuest: true };
    }
  },

  // 2. SEPETE EKLE
  addToCart: async (productData) => {
    try {
      const response = await API.post('/cart', productData);
      return response.data;
    } catch (error) {
      // Hata alınırsa DİREKT misafir sepetine (localStorage) kaydet
      let cart = getLocalCart();
      const existingIndex = cart.findIndex(item => 
        (item.product?._id || item.product || item.id) === productData.productId
      );
      
      if (existingIndex > -1) {
        cart[existingIndex].quantity += (productData.quantity || 1);
      } else {
        cart.push({
          product: { _id: productData.productId }, // Checkout ile uyumlu olması için
          id: productData.productId,
          name: productData.name,
          price: productData.price,
          image: productData.image,
          quantity: productData.quantity || 1
        });
      }
      saveLocalCart(cart);
      return { success: true, message: 'Ürün sepete eklendi.', items: cart, isGuest: true };
    }
  },

  // 3. SEPETTEN SİL / AZALT
  removeFromCart: async (productId) => {
    try {
      const response = await API.delete(`/cart/${productId}`);
      return response.data;
    } catch (error) {
      // Hata alınırsa misafir sepetinden sil/azalt
      let cart = getLocalCart();
      const itemIndex = cart.findIndex(item => 
        (item.product?._id || item.product || item.id) === productId
      );
      
      if (itemIndex > -1) {
        if (cart[itemIndex].quantity > 1) {
          cart[itemIndex].quantity -= 1;
        } else {
          cart.splice(itemIndex, 1);
        }
        saveLocalCart(cart);
      }
      return { success: true, message: 'Ürün sepetten çıkarıldı.', items: cart, isGuest: true };
    }
  },

  // 4. SEPETİ TAMAMEN BOŞALT
  clearCart: async () => {
    try {
      const response = await API.delete('/cart/clear');
      return response.data;
    } catch (error) {
      localStorage.removeItem('guestCart');
      return { success: true, message: 'Sepet temizlendi.', isGuest: true };
    }
  }
};

export default cartService;