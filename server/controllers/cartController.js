// const Cart = require('../models/Cart');

// // @desc    Kullanıcının sepetini getirir
// // @route   GET /api/cart
// // @access  Private (Sadece giriş yapmış kullanıcılar)
// exports.getCart = async (req, res) => {
//   try {
//     // req.user._id auth middleware'inden (token/cookie) gelmeli
//     const cart = await Cart.findOne({ user: req.user._id });

//     // Eğer kullanıcının henüz bir sepeti yoksa boş dizi döndür
//     if (!cart) {
//       return res.status(200).json({ success: true, items: [] });
//     }

//     res.status(200).json({ success: true, items: cart.items });
//   } catch (error) {
//     console.error('Sepet getirme hatası:', error);
//     res.status(500).json({ success: false, message: 'Sepet yüklenirken hata oluştu.' });
//   }
// };

// // @desc    Sepete yeni ürün ekler (veya miktarını artırır)
// // @route   POST /api/cart
// // @access  Private
// exports.addToCart = async (req, res) => {
//   try {
//     const { productId, name, price, image, quantity } = req.body;
//     let cart = await Cart.findOne({ user: req.user._id });

//     // Kullanıcının sepeti yoksa yeni sepet oluştur
//     if (!cart) {
//       cart = new Cart({ user: req.user._id, items: [] });
//     }

//     // Ürün sepette zaten var mı diye kontrol et
//     const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

//     if (existingItemIndex > -1) {
//       // Ürün varsa sadece miktarını artır
//       cart.items[existingItemIndex].quantity += quantity;
//     } else {
//       // Ürün yoksa sepete yeni obje olarak ekle
//       cart.items.push({ product: productId, name, price, image, quantity });
//     }

//     await cart.save();
//     res.status(200).json({ success: true, message: 'Ürün sepete eklendi.', items: cart.items });
//   } catch (error) {
//     console.error('Sepete ekleme hatası:', error);
//     res.status(500).json({ success: false, message: 'Ürün sepete eklenemedi.' });
//   }
// };

// // @desc    Sepeti tamamen boşaltır (Sipariş tamamlandıktan sonra çalışır)
// // @route   DELETE /api/cart/clear
// // @access  Private
// exports.clearCart = async (req, res) => {
//   try {
//     await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
//     res.status(200).json({ success: true, message: 'Sepet temizlendi.' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Sepet temizlenirken hata oluştu.' });
//   }
// };



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
    const { productId, name, price, image, quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });

    // Kullanıcının sepeti yoksa yeni sepet oluştur
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Ürün sepette zaten var mı diye kontrol et
    const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (existingItemIndex > -1) {
      // Ürün varsa sadece miktarını artır
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Ürün yoksa sepete yeni obje olarak ekle
      cart.items.push({ product: productId, name, price, image, quantity });
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
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Sepet bulunamadı.' });
    }

    // Ürünün sepetteki sırasını (index) bul
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Eğer ürünün adeti 1'den büyükse, sadece 1 azalt
      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1;
      } 
      // Eğer ürünün adeti 1 ise, diziden tamamen çıkar (sil)
      else {
        cart.items.splice(itemIndex, 1);
      }

      await cart.save();
      res.status(200).json({ success: true, message: 'Sepet güncellendi.', items: cart.items });
    } else {
      res.status(404).json({ success: false, message: 'Ürün sepette bulunamadı.' });
    }

  } catch (error) {
    console.error('Sepetten silme hatası:', error);
    res.status(500).json({ success: false, message: 'Ürün silinirken hata oluştu.' });
  }
};