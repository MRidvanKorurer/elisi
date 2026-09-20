import API from './api';

const GUEST_KEY = 'guestCart';

const asArray = (value) => (Array.isArray(value) ? value : []);

const productIdOf = (item) => String(item?.product?._id || item?.product || item?.id || '');

export const normalizeCartItems = (items) =>
  asArray(items).filter((item) => {
    const id = productIdOf(item);
    const qty = Number(item?.quantity) || 0;
    return Boolean(id) && qty > 0;
  });

export const countCartItems = (items) =>
  normalizeCartItems(items).reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

const getLocalCart = () => {
  try {
    return normalizeCartItems(JSON.parse(localStorage.getItem(GUEST_KEY) || '[]'));
  } catch {
    return [];
  }
};

const saveLocalCart = (cart) => {
  const next = normalizeCartItems(cart);
  if (!next.length) {
    localStorage.removeItem(GUEST_KEY);
    return [];
  }
  localStorage.setItem(GUEST_KEY, JSON.stringify(next));
  return next;
};

const clearLocalCart = () => {
  localStorage.removeItem(GUEST_KEY);
};

const matchesItem = (item, productId, color = '', size = '') =>
  productIdOf(item) === String(productId) &&
  (item.color || '') === (color || '') &&
  (item.size || '') === (size || '');

const fromApi = (data) => ({
  success: true,
  ...data,
  items: normalizeCartItems(data?.items),
  isGuest: false
});

export const cartService = {
  guestCount: () => countCartItems(getLocalCart()),

  getCart: async () => {
    try {
      const response = await API.get('/cart');
      const payload = fromApi(response.data);
      clearLocalCart();
      return payload;
    } catch (error) {
      if (error.response?.status === 401) {
        return { success: true, items: getLocalCart(), isGuest: true };
      }
      throw error;
    }
  },

  mergeGuestCart: async () => {
    const local = getLocalCart();
    if (!local.length) return { success: true, items: [], merged: 0 };
    let merged = 0;
    for (const item of local) {
      try {
        await API.post('/cart', {
          productId: productIdOf(item),
          quantity: Number(item.quantity) || 1,
          color: item.color || '',
          size: item.size || '',
          name: item.name,
          price: item.price,
          image: item.image
        });
        merged += 1;
      } catch {
        /* yayında olmayan satır atlanır */
      }
    }
    clearLocalCart();
    try {
      const response = await API.get('/cart');
      return { ...fromApi(response.data), merged };
    } catch {
      return { success: true, items: [], merged };
    }
  },

  addToCart: async (productData) => {
    try {
      const response = await API.post('/cart', productData);
      clearLocalCart();
      return fromApi(response.data);
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
      return { success: true, message: 'Ürün sepete eklendi.', items: saveLocalCart(cart), isGuest: true };
    }
  },

  removeFromCart: async (productId, options = {}) => {
    const { all = false, color = '', size = '' } = options;
    try {
      const response = await API.delete(`/cart/${productId}`, {
        params: { all: all ? 'true' : undefined, color, size }
      });
      return fromApi(response.data);
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
      }
      return { success: true, message: 'Ürün sepetten çıkarıldı.', items: saveLocalCart(cart), isGuest: true };
    }
  },

  updateCartItem: async (productId, { quantity, color = '', size = '' }) => {
    try {
      const response = await API.patch(`/cart/${productId}`, { quantity, color, size });
      return fromApi(response.data);
    } catch (error) {
      if (error.response?.status && error.response.status !== 401) {
        throw error.response?.data || error;
      }
      const cart = getLocalCart();
      const itemIndex = cart.findIndex((item) => matchesItem(item, productId, color, size));
      if (itemIndex > -1) {
        cart[itemIndex].quantity = Math.max(1, quantity);
      }
      return { success: true, items: saveLocalCart(cart), isGuest: true };
    }
  },

  clearCart: async () => {
    try {
      const response = await API.delete('/cart/clear');
      clearLocalCart();
      return { success: true, ...response.data, items: [] };
    } catch (error) {
      clearLocalCart();
      if (error.response?.status && error.response.status !== 401) {
        throw error.response?.data || error;
      }
      return { success: true, message: 'Sepet temizlendi.', items: [], isGuest: true };
    }
  }
};

export default cartService;
