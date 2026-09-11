import API from './api';

const getLocalCart = () => JSON.parse(localStorage.getItem('guestCart')) || [];
const saveLocalCart = (cart) => localStorage.setItem('guestCart', JSON.stringify(cart));

const itemKey = (item) =>
  `${item.product?._id || item.product || item.id || ''}|${item.color || ''}|${item.size || ''}`;

const matchesItem = (item, productId, color = '', size = '') =>
  String(item.product?._id || item.product || item.id) === String(productId) &&
  (item.color || '') === (color || '') &&
  (item.size || '') === (size || '');

export const cartService = {
  guestCount: () => {
    try {
      const items = JSON.parse(localStorage.getItem('guestCart') || '[]');
      return items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    } catch {
      return 0;
    }
  },

  getCart: async ({ guest = false } = {}) => {
    if (guest) {
      return { success: true, items: getLocalCart(), isGuest: true };
    }
    try {
      const response = await API.get('/cart');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return { success: true, items: getLocalCart(), isGuest: true };
      }
      throw error;
    }
  },

  addToCart: async (productData) => {
    try {
      const response = await API.post('/cart', productData);
      return response.data;
    } catch (error) {
      if (error.response?.status && error.response.status !== 401) {
        throw error.response?.data || error;
      }
      const cart = getLocalCart();
      const existingIndex = cart.findIndex((item) =>
        matchesItem(item, productData.productId, productData.color, productData.size)
      );

      if (existingIndex > -1) {
        cart[existingIndex].quantity += (productData.quantity || 1);
      } else {
        cart.push({
          product: { _id: productData.productId },
          id: productData.productId,
          name: productData.name,
          price: productData.price,
          image: productData.image,
          quantity: productData.quantity || 1,
          color: productData.color || '',
          size: productData.size || ''
        });
      }
      saveLocalCart(cart);
      return { success: true, message: 'Ürün sepete eklendi.', items: cart, isGuest: true };
    }
  },

  removeFromCart: async (productId, options = {}) => {
    const { all = false, color = '', size = '' } = options;
    try {
      const response = await API.delete(`/cart/${productId}`, {
        params: { all: all ? 'true' : undefined, color, size }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status && error.response.status !== 401) {
        throw error.response?.data || error;
      }
      const cart = getLocalCart();
      const itemIndex = cart.findIndex((item) => matchesItem(item, productId, color, size));
      if (itemIndex > -1) {
        if (all || cart[itemIndex].quantity <= 1) {
          cart.splice(itemIndex, 1);
        } else {
          cart[itemIndex].quantity -= 1;
        }
        saveLocalCart(cart);
      }
      return { success: true, message: 'Ürün sepetten çıkarıldı.', items: cart, isGuest: true };
    }
  },

  updateCartItem: async (productId, { quantity, color = '', size = '' }) => {
    try {
      const response = await API.patch(`/cart/${productId}`, { quantity, color, size });
      return response.data;
    } catch (error) {
      if (error.response?.status && error.response.status !== 401) {
        throw error.response?.data || error;
      }
      const cart = getLocalCart();
      const itemIndex = cart.findIndex((item) => matchesItem(item, productId, color, size));
      if (itemIndex > -1) {
        cart[itemIndex].quantity = Math.max(1, quantity);
        saveLocalCart(cart);
      }
      return { success: true, items: cart, isGuest: true };
    }
  },

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

export { itemKey };
export default cartService;
