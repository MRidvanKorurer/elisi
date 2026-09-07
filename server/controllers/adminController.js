const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { isSuperAdmin } = require('../utils/roles');
const { publicPath, categoryPublicPath, removeUpload } = require('../middleware/uploadMiddleware');

const serializeUser = (user) => ({
  id: user._id,
  adSoyad: user.adSoyad,
  email: user.email,
  telefon: user.telefon || '',
  rol: user.rol,
  createdAt: user.createdAt
});

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getOverview = async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const weekStart = startOfDay(new Date());
    weekStart.setDate(weekStart.getDate() - 6);

    const [
      users,
      sellers,
      products,
      pendingSellers,
      pendingProducts,
      orders,
      pendingPayment,
      processing,
      shipped,
      cancelled,
      lowStock,
      revenueAgg,
      todayAgg,
      salesByDay,
      paymentMix,
      recentOrders,
      topProducts
    ] = await Promise.all([
      User.countDocuments({ rol: { $ne: 'superadmin' } }),
      Seller.countDocuments(),
      Product.countDocuments(),
      Seller.countDocuments({ durum: 'pending' }),
      Product.countDocuments({ approvalStatus: 'pending' }),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Order.countDocuments({ orderStatus: 'processing', paymentStatus: { $ne: 'failed' } }),
      Order.countDocuments({ orderStatus: 'shipped' }),
      Order.countDocuments({ orderStatus: 'cancelled' }),
      Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today } } },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, '$totalPrice', 0] }
            }
          }
        }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekStart }, paymentStatus: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$totalPrice' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalPrice' } } }
      ]),
      Order.find().sort({ createdAt: -1 }).limit(8).lean(),
      Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.name',
            qty: { $sum: '$orderItems.quantity' },
            revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
          }
        },
        { $sort: { qty: -1 } },
        { $limit: 6 }
      ])
    ]);

    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const found = salesByDay.find((row) => row._id === key);
      days.push({
        date: key,
        label: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }),
        total: found?.total || 0,
        count: found?.count || 0
      });
    }

    return res.json({
      success: true,
      overview: {
        users,
        sellers,
        products,
        pendingSellers,
        pendingProducts,
        orders,
        pendingPayment,
        processing,
        shipped,
        cancelled,
        lowStock,
        revenue: revenueAgg[0]?.revenue || 0,
        paidOrders: revenueAgg[0]?.count || 0,
        todayOrders: todayAgg[0]?.orders || 0,
        todayRevenue: todayAgg[0]?.revenue || 0,
        salesByDay: days,
        paymentMix,
        recentOrders,
        topProducts
      }
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Özet alınamadı.', hata: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-sifre').sort({ createdAt: -1 }).limit(200);
    return res.json({ success: true, users: users.map(serializeUser) });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Kullanıcılar alınamadı.', hata: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { rol } = req.body;
    if (!['user', 'seller'].includes(rol)) {
      return res.status(400).json({ mesaj: 'Rol yalnızca user veya seller olabilir.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ mesaj: 'Kullanıcı bulunamadı.' });
    if (isSuperAdmin(user.rol)) {
      return res.status(403).json({ mesaj: 'Süper admin rolü buradan değiştirilemez.' });
    }
    user.rol = rol;
    await user.save();
    return res.json({ success: true, mesaj: 'Rol güncellendi.', user: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Rol güncellenemedi.', hata: error.message });
  }
};

const listSellers = async (req, res) => {
  try {
    const sellers = await Seller.find().populate('user', 'adSoyad email rol telefon').sort({ createdAt: -1 });
    return res.json({ success: true, sellers });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Mağazalar alınamadı.', hata: error.message });
  }
};

const updateSellerStatus = async (req, res) => {
  try {
    const { durum, reddetmeNedeni = '' } = req.body;
    if (!['pending', 'approved', 'rejected', 'suspended'].includes(durum)) {
      return res.status(400).json({ mesaj: 'Geçersiz mağaza durumu.' });
    }
    const seller = await Seller.findById(req.params.id).populate('user');
    if (!seller) return res.status(404).json({ mesaj: 'Mağaza bulunamadı.' });

    seller.durum = durum;
    seller.reddetmeNedeni = durum === 'rejected' ? String(reddetmeNedeni).trim() : '';
    await seller.save();

    if (seller.user && !isSuperAdmin(seller.user.rol)) {
      if (durum === 'approved') seller.user.rol = 'seller';
      if (durum === 'rejected') seller.user.rol = 'user';
      await seller.user.save();
    }

    return res.json({ success: true, mesaj: 'Mağaza durumu güncellendi.', seller });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Mağaza güncellenemedi.', hata: error.message });
  }
};

const listProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'adSoyad email')
      .sort({ approvalStatus: 1, createdAt: -1 })
      .limit(300);
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Ürünler alınamadı.', hata: error.message });
  }
};

const setProductApproval = async (req, res) => {
  try {
    const { approvalStatus, rejectionReason = '' } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({ mesaj: 'Geçersiz onay durumu.' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ mesaj: 'Ürün bulunamadı.' });

    product.approvalStatus = approvalStatus;
    product.rejectionReason = approvalStatus === 'rejected' ? String(rejectionReason).trim() : '';
    product.approvedAt = approvalStatus === 'approved' ? new Date() : undefined;
    product.isActive = approvalStatus === 'approved';
    await product.save();

    return res.json({
      success: true,
      mesaj: approvalStatus === 'approved' ? 'Ürün yayına alındı.' : 'Ürün durumu güncellendi.',
      product
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Ürün onaylanamadı.', hata: error.message });
  }
};

const TEXT_FIELDS = ['title', 'description', 'category', 'careInstructions', 'customProductionTime'];
const NUMBER_FIELDS = ['price', 'stock', 'discountPercentage'];
const BOOL_FIELDS = ['isActive', 'isSponsored', 'isNewProduct', 'immediateDelivery'];
const LIST_FIELDS = ['colors', 'sizes', 'features'];

const asBool = (value) => value === true || value === 'true' || value === '1';
const asList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ mesaj: 'Ürün bulunamadı.' });

    TEXT_FIELDS.forEach((field) => {
      if (req.body[field] === undefined) return;
      product[field] = field === 'category' ? String(req.body[field]).toLowerCase().trim() : String(req.body[field]).trim();
    });
    NUMBER_FIELDS.forEach((field) => {
      if (req.body[field] === undefined || req.body[field] === '') return;
      product[field] = Number(req.body[field]);
    });
    BOOL_FIELDS.forEach((field) => {
      if (req.body[field] === undefined) return;
      product[field] = asBool(req.body[field]);
    });
    LIST_FIELDS.forEach((field) => {
      if (req.body[field] === undefined) return;
      product[field] = asList(req.body[field]);
    });

    // Galeriden çıkarılan görseller diskten de silinir
    if (req.body.removeImages) {
      const removals = asList(req.body.removeImages);
      product.additionalImages = (product.additionalImages || []).filter((url) => !removals.includes(url));
      removals.forEach(removeUpload);
    }

    const mainFile = req.files?.image?.[0];
    if (mainFile) {
      removeUpload(product.image);
      product.image = publicPath(mainFile);
    }

    const galleryFiles = req.files?.gallery || [];
    if (galleryFiles.length) {
      product.additionalImages = [...(product.additionalImages || []), ...galleryFiles.map(publicPath)].slice(0, 8);
    }

    await product.save();
    return res.json({ success: true, mesaj: 'Ürün güncellendi.', product });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Ürün güncellenemedi.', hata: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ mesaj: 'Ürün bulunamadı.' });
    product.isActive = false;
    await product.save();
    return res.json({ success: true, mesaj: 'Ürün yayından alındı.', product });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Ürün kaldırılamadı.', hata: error.message });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Siparişler alınamadı.', hata: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ mesaj: 'Sipariş bulunamadı.' });

    const { orderStatus, paymentStatus } = req.body;
    if (orderStatus) {
      if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
        return res.status(400).json({ mesaj: 'Geçersiz sipariş durumu.' });
      }
      order.orderStatus = orderStatus;
    }
    if (paymentStatus) {
      if (!['pending', 'completed', 'failed'].includes(paymentStatus)) {
        return res.status(400).json({ mesaj: 'Geçersiz ödeme durumu.' });
      }
      order.paymentStatus = paymentStatus;
    }
    await order.save();
    return res.json({ success: true, mesaj: 'Sipariş güncellendi.', order });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Sipariş güncellenemedi.', hata: error.message });
  }
};

const listCategories = async (_req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Kategoriler alınamadı.', hata: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      categoryId: String(req.params.id || '').toLowerCase()
    });
    if (!category) {
      return res.status(404).json({ mesaj: 'Kategori bulunamadı.' });
    }

    const { name, description, order, isActive } = req.body;
    if (typeof name === 'string' && name.trim()) category.name = name.trim();
    if (typeof description === 'string') category.description = description.trim();
    if (order !== undefined) category.order = Number(order) || 0;
    if (isActive !== undefined) category.isActive = isActive === true || isActive === 'true';

    const uploaded = categoryPublicPath(req.file);
    if (uploaded) {
      if (category.image) removeUpload(category.image);
      category.image = uploaded;
    }

    await category.save();
    return res.json({ success: true, mesaj: 'Kategori güncellendi.', category });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Kategori güncellenemedi.', hata: error.message });
  }
};

module.exports = {
  getOverview,
  listUsers,
  updateUserRole,
  listSellers,
  updateSellerStatus,
  listProducts,
  updateProduct,
  deleteProduct,
  setProductApproval,
  listOrders,
  updateOrder,
  listCategories,
  updateCategory
};
