// Sepete Ürün Ekle (Kayıt şartı yok)
export const addToCart = (product) => {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item => item._id === product._id);

  if (existingItem) {
    existingItem.adet += 1;
  } else {
    cart.push({ ...product, adet: 1 });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated')); // Navbar'daki sepet sayacını güncellemek için
};

// Sepeti Getir
export const getCart = () => {
  return JSON.parse(localStorage.getItem('cart')) || [];
};

// Sepeti Temizle (Sipariş tamamlanınca)
export const clearCart = () => {
  localStorage.removeItem('cart');
  window.dispatchEvent(new Event('cartUpdated'));
};