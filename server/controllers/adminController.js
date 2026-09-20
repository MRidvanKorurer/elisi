const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { isSuperAdmin } = require('../utils/roles');
const { applyPaidStock, restorePaidStock } = require('../utils/orderStock');
const { releaseWelcomeCoupon } = require('../utils/welcomeCoupon');
const { releasePromoUse } = require('../utils/promoCode');
const { publicPath, removeUpload } = require('../middleware/uploadMiddleware');
const { sanitizeVideoUrl } = require('../utils/productVideo');
const FeaturedRequest = require('../models/FeaturedRequest');
const WeeklyAtelier = require('../models/WeeklyAtelier');
const {
  clampCommissionPercent,
  trailingSellerGmv,
  effectiveCommissionPercent,
  volumeMeta,
  ratesForSellers
} = require('../utils/commission');
const { endLiveFeaturedForProduct } = require('./featuredController');

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
      topProducts,
      pendingFeatured,
      pendingAtelierWeek,
      feeAgg,
      todayFeeAgg,
      pendingFeeAgg
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
      ]),
      FeaturedRequest.countDocuments({ status: 'pending' }),
      WeeklyAtelier.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { paymentStatus: 'completed', orderStatus: { $ne: 'cancelled' } } },
        {
          $addFields: {
            computedFee: {
              $ifNull: [
                '$platformFee',
                {
                  $round: [{
                    $multiply: [
                      {
                        $sum: {
                          $map: {
                            input: { $ifNull: ['$orderItems', []] },
                            as: 'item',
                            in: { $multiply: [{ $ifNull: ['$$item.price', 0] }, { $ifNull: ['$$item.quantity', 0] }] }
                          }
                        }
                      },
                      0.1
                    ]
                  }, 2]
                }
              ]
            }
          }
        },
        { $group: { _id: null, fee: { $sum: '$computedFee' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'completed', orderStatus: { $ne: 'cancelled' } } },
        {
          $addFields: {
            computedFee: {
              $ifNull: [
                '$platformFee',
                {
                  $round: [{
                    $multiply: [
                      {
                        $sum: {
                          $map: {
                            input: { $ifNull: ['$orderItems', []] },
                            as: 'item',
                            in: { $multiply: [{ $ifNull: ['$$item.price', 0] }, { $ifNull: ['$$item.quantity', 0] }] }
                          }
                        }
                      },
                      0.1
                    ]
                  }, 2]
                }
              ]
            }
          }
        },
        { $group: { _id: null, fee: { $sum: '$computedFee' } } }
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'pending', orderStatus: { $ne: 'cancelled' } } },
        {
          $addFields: {
            computedFee: {
              $ifNull: [
                '$platformFee',
                {
                  $round: [{
                    $multiply: [
                      {
                        $sum: {
                          $map: {
                            input: { $ifNull: ['$orderItems', []] },
                            as: 'item',
                            in: { $multiply: [{ $ifNull: ['$$item.price', 0] }, { $ifNull: ['$$item.quantity', 0] }] }
                          }
                        }
                      },
                      0.1
                    ]
                  }, 2]
                }
              ]
            }
          }
        },
        { $group: { _id: null, fee: { $sum: '$computedFee' } } }
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
        platformFee: feeAgg[0]?.fee || 0,
        todayPlatformFee: todayFeeAgg[0]?.fee || 0,
        pendingPlatformFee: pendingFeeAgg[0]?.fee || 0,
        salesByDay: days,
        paymentMix,
        recentOrders,
        topProducts,
        pendingFeatured,
        pendingAtelierWeek
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

const decorateSellerCommission = async (sellers = []) => {
  const { rates, volumes } = await ratesForSellers(sellers);
  return sellers.map((seller) => {
    const obj = seller.toObject ? seller.toObject() : { ...seller };
    const sid = String(seller.user?._id || seller.user || '');
    obj.komisyonKayit = seller.komisyonOrani != null ? seller.komisyonOrani : 10;
    obj.komisyonOrani = rates[sid] ?? 10;
    obj.komisyonManuel = Boolean(seller.komisyonManuel);
    obj.komisyonHacim = volumeMeta(volumes.get(sid) || 0);
    return obj;
  });
};

const listSellers = async (req, res) => {
  try {
    const sellers = await Seller.find().populate('user', 'adSoyad email rol telefon').sort({ createdAt: -1 });
    return res.json({ success: true, sellers: await decorateSellerCommission(sellers) });
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

const updateSellerCommission = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ mesaj: 'Mağaza bulunamadı.' });

    const auto = req.body.manuel === false || req.body.otomatik === true;
    if (auto) {
      seller.komisyonManuel = false;
      await seller.save();
      const gmv = await trailingSellerGmv(seller.user);
      const percent = effectiveCommissionPercent(seller, gmv);
      return res.json({
        success: true,
        mesaj: `${seller.magazaAdi} komisyonu otomatik hacim kuralına alındı (şu an %${percent}).`,
        seller: (await decorateSellerCommission([seller]))[0]
      });
    }

    if (req.body.komisyonOrani == null && req.body.percent == null) {
      return res.status(400).json({ mesaj: 'Komisyon oranı yaz.' });
    }
    const percent = clampCommissionPercent(req.body.komisyonOrani ?? req.body.percent);
    seller.komisyonOrani = percent;
    seller.komisyonManuel = true;
    await seller.save();
    return res.json({
      success: true,
      mesaj: `${seller.magazaAdi} komisyonu %${percent} olarak kilitlendi. Yeni satışlara uygulanır.`,
      seller: (await decorateSellerCommission([seller]))[0]
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Komisyon güncellenemedi.', hata: error.message });
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

const TEXT_FIELDS = ['title', 'description', 'category', 'careInstructions', 'customProductionTime', 'measureNote', 'video'];
const NUMBER_FIELDS = ['price', 'stock', 'discountPercentage'];
const BOOL_FIELDS = ['isActive', 'isNewProduct', 'immediateDelivery'];
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
    const wasSponsored = Boolean(product.isSponsored);

    TEXT_FIELDS.forEach((field) => {
      if (req.body[field] === undefined) return;
      if (field === 'video') {
        product.video = sanitizeVideoUrl(req.body[field]);
        return;
      }
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
    if (req.body.isSponsored !== undefined && !asBool(req.body.isSponsored) && wasSponsored) {
      await endLiveFeaturedForProduct(product._id, req.user?._id, 'Süper admin ürünü vitrinden aldı.');
    }
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
      return res.status(403).json({ mesaj: 'Sipariş durumunu ilgili satıcı günceller.' });
    }
    if (paymentStatus) {
      if (!['pending', 'completed', 'failed'].includes(paymentStatus)) {
        return res.status(400).json({ mesaj: 'Geçersiz ödeme durumu.' });
      }
      const previous = order.paymentStatus;
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'completed' && previous !== 'completed') {
        await applyPaidStock(order);
      }
      if (previous === 'completed' && paymentStatus !== 'completed') {
        await restorePaidStock(order);
      }
      await order.save();
      if (paymentStatus === 'failed' && previous !== 'failed') {
        await releaseWelcomeCoupon(order);
        await releasePromoUse(order);
      }
    } else {
      await order.save();
    }
    return res.json({ success: true, mesaj: 'Sipariş güncellendi.', order });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Sipariş güncellenemedi.', hata: error.message });
  }
};

module.exports = {
  getOverview,
  listUsers,
  updateUserRole,
  listSellers,
  updateSellerStatus,
  updateSellerCommission,
  listProducts,
  updateProduct,
  deleteProduct,
  setProductApproval,
  listOrders,
  updateOrder
};
