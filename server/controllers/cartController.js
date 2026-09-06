

const Cart = require('../models/Cart');

// @desc    Kullanıcının sepetini getirir
// @route   GET /api/cart
// @access  Private (Sadece giriş yapmış kullanıcılar)
exports.getCart = async (req, res) => {
  try {
    // req.user._id auth middleware'inden (token/cookie) gelmeli
    const cart = await Cart.findOne({ user: req.user._id });

    // Eğer kullanıcının henüz bir sepeti yoksa boş dizi döndür
    if (!cart) {
      return res.status(200).json({ success: true, items: [] });
    }

    res.status(200).json({ success: true, items: cart.items });
  } catch (error) {
    console.error('Sepet getirme hatası:', error);
    res.status(500).json({ success: false, message: 'Sepet yüklenirken hata oluştu.' });
  }
};

// @desc    Sepete yeni ürün ekler (veya miktarını artırır)
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, color = '', size = '' } = req.body;
    const Product = require('../models/Product');
    const product = await Product.findOne({ _id: productId, isActive: true });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: 'Yetersiz stok.' });
    }

    const discountRate = Number(product.discountPercentage || 0);
    const unitPrice = discountRate > 0
      ? Number((product.price - (product.price * discountRate / 100)).toFixed(2))
      : product.price;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const selectedColor = String(color || '').trim();
    const selectedSize = String(size || '').trim();
    const existingItemIndex = cart.items.findIndex((item) =>
      item.product.toString() === String(productId) &&
      (item.color || '') === selectedColor &&
      (item.size || '') === selectedSize
    );

    if (existingItemIndex > -1) {
      const nextQty = cart.items[existingItemIndex].quantity + qty;
      if (nextQty > product.stock) {
        return res.status(400).json({ success: false, message: 'Yetersiz stok.' });
      }
      cart.items[existingItemIndex].quantity = nextQty;
      cart.items[existingItemIndex].price = unitPrice;
      cart.items[existingItemIndex].name = product.title;
      cart.items[existingItemIndex].image = product.image;
    } else {
      cart.items.push({
        product: productId,
        name: product.title,
        price: unitPrice,
        image: product.image,
        quantity: qty,
        color: selectedColor,
        size: selectedSize
      });
    }

    await cart.save();
    res.status(200).json({ success: true, message: 'Ürün sepete eklendi.', items: cart.items });
  } catch (error) {
    console.error('Sepete ekleme hatası:', error);
    res.status(500).json({ success: false, message: 'Ürün sepete eklenemedi.' });
  }
};

// @desc    Sepeti tamamen boşaltır (Sipariş tamamlandıktan sonra çalışır)
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(200).json({ success: true, message: 'Sepet temizlendi.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sepet temizlenirken hata oluştu.' });
  }
};

// @desc    Sepetten belirli bir ürünü tamamen çıkarır
// @route   DELETE /api/cart/:productId
// @access  Private
const findCartItemIndex = (cart, productId, color = '', size = '') => {
  const selectedColor = String(color || '').trim();
  const selectedSize = String(size || '').trim();
  return cart.items.findIndex((item) =>
    item.product.toString() === String(productId) &&
    (item.color || '') === selectedColor &&
    (item.size || '') === selectedSize
  );
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { all, color = '', size = '' } = req.query;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Sepet bulunamadı.' });
    }

    const itemIndex = findCartItemIndex(cart, productId, color, size);

    if (itemIndex > -1) {
      if (all === 'true' || all === '1' || cart.items[itemIndex].quantity <= 1) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity -= 1;
      }

      await cart.save();
      return res.status(200).json({ success: true, message: 'Sepet güncellendi.', items: cart.items });
    }

    res.status(404).json({ success: false, message: 'Ürün sepette bulunamadı.' });
  } catch (error) {
    console.error('Sepetten silme hatası:', error);
    res.status(500).json({ success: false, message: 'Ürün silinirken hata oluştu.' });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, color = '', size = '' } = req.body;
    const nextQty = parseInt(quantity, 10);

    if (!Number.isFinite(nextQty) || nextQty < 1) {
      return res.status(400).json({ success: false, message: 'Geçersiz adet.' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Sepet bulunamadı.' });
    }

    const itemIndex = findCartItemIndex(cart, productId, color, size);
    if (itemIndex < 0) {
      return res.status(404).json({ success: false, message: 'Ürün sepette bulunamadı.' });
    }

    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    if (!product || product.stock < nextQty) {
      return res.status(400).json({ success: false, message: 'Yetersiz stok.' });
    }

    cart.items[itemIndex].quantity = nextQty;
    await cart.save();
    res.status(200).json({ success: true, message: 'Adet güncellendi.', items: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Adet güncellenemedi.' });
  }
};