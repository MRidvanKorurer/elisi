const mongoose = require('mongoose');
const FeaturedRequest = require('../models/FeaturedRequest');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { packageOf } = require('../utils/featuredPackages');
const { receiptPublicPath, removeUpload } = require('../middleware/uploadMiddleware');

const expireFeaturedProducts = async () => {
  const now = new Date();
  await Product.updateMany(
    { isSponsored: true, sponsoredUntil: { $lte: now } },
    { $set: { isSponsored: false } }
  );
};

const serializeRequest = (doc, shopName = '') => {
  const item = doc.toObject ? doc.toObject() : doc;
  const product = item.product && typeof item.product === 'object' ? item.product : null;
  const seller = item.seller && typeof item.seller === 'object' ? item.seller : null;
  return {
    id: item._id,
    days: item.days,
    price: item.price,
    status: item.status,
    note: item.note || '',
    receiptUrl: item.receiptUrl || '',
    receiptName: item.receiptName || '',
    rejectionReason: item.rejectionReason || '',
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt || null,
    startsAt: item.startsAt || null,
    endsAt: item.endsAt || null,
    product: product
      ? {
          id: product._id,
          title: product.title,
          image: product.image,
          price: product.price,
          isSponsored: Boolean(product.isSponsored),
          sponsoredUntil: product.sponsoredUntil || null
        }
      : { id: item.product },
    seller: {
      id: seller?._id || item.seller,
      adSoyad: seller?.adSoyad || '',
      email: seller?.email || '',
      magazaAdi: shopName || ''
    }
  };
};

const shopNameFor = async (userId) => {
  const shop = await Seller.findOne({ user: userId }).select('magazaAdi').lean();
  return shop?.magazaAdi || '';
};

const shopNamesByUser = async (userIds) => {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return new Map();
  const shops = await Seller.find({ user: { $in: ids } }).select('user magazaAdi').lean();
  return new Map(shops.map((shop) => [String(shop.user), shop.magazaAdi]));
};

const listMyFeatured = async (req, res) => {
  try {
    const items = await FeaturedRequest.find({ seller: req.user._id })
      .populate('product', 'title image price isSponsored sponsoredUntil')
      .sort({ createdAt: -1 })
      .lean();
    const shop = await shopNameFor(req.user._id);
    return res.json({
      success: true,
      requests: items.map((item) => serializeRequest(item, shop))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Talepler alınamadı.', hata: error.message });
  }
};

const createFeatured = async (req, res) => {
  const uploaded = receiptPublicPath(req.file);
  try {
    const productId = req.body.productId || req.body.product;
    const pack = packageOf(req.body.days);
    if (!pack) {
      removeUpload(uploaded);
      return res.status(400).json({ mesaj: 'Geçerli bir paket seçin: 3, 5 veya 7 gün.' });
    }
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      removeUpload(uploaded);
      return res.status(400).json({ mesaj: 'Geçerli bir ürün seçin.' });
    }
    if (!uploaded) {
      return res.status(400).json({ mesaj: 'Ödeme dekontunu yükleyin. Süper admin bu dekonta göre onaylar.' });
    }

    const product = await Product.findOne({ _id: productId, seller: req.user._id });
    if (!product) {
      removeUpload(uploaded);
      return res.status(404).json({ mesaj: 'Ürün bulunamadı.' });
    }
    if (product.approvalStatus !== 'approved' || !product.isActive) {
      removeUpload(uploaded);
      return res.status(400).json({ mesaj: 'Yalnızca yayındaki ürünler için talep açabilirsiniz.' });
    }

    const existing = await FeaturedRequest.findOne({ product: product._id, seller: req.user._id, status: 'pending' });
    if (existing) {
      removeUpload(uploaded);
      return res.status(400).json({ mesaj: 'Bu ürün için zaten onay bekleyen bir talebiniz var.' });
    }

    const request = await FeaturedRequest.create({
      seller: req.user._id,
      product: product._id,
      days: pack.days,
      price: pack.price,
      note: String(req.body.note || '').trim(),
      receiptUrl: uploaded,
      receiptName: String(req.file.originalname || req.file.filename || '').slice(0, 180)
    });
    await request.populate('product', 'title image price isSponsored sponsoredUntil');

    return res.status(201).json({
      mesaj: 'Dekont alındı. Süper admin ödemeyi kontrol edip onaylarsa ürün önerilenlere çıkar.',
      request: serializeRequest(request, await shopNameFor(req.user._id))
    });
  } catch (error) {
    removeUpload(uploaded);
    return res.status(500).json({ mesaj: 'Talep oluşturulamadı.', hata: error.message });
  }
};

const cancelFeatured = async (req, res) => {
  try {
    const request = await FeaturedRequest.findOne({ _id: req.params.id, seller: req.user._id });
    if (!request) {
      return res.status(404).json({ mesaj: 'Talep bulunamadı.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ mesaj: 'Yalnızca bekleyen talepler iptal edilebilir.' });
    }
    request.status = 'cancelled';
    request.reviewedAt = new Date();
    await request.save();
    return res.json({ mesaj: 'Talep iptal edildi.' });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Talep iptal edilemedi.', hata: error.message });
  }
};

const listAdminFeatured = async (req, res) => {
  try {
    const status = String(req.query.status || 'all');
    const match = status !== 'all' ? { status } : {};
    const items = await FeaturedRequest.find(match)
      .populate('product', 'title image price isSponsored sponsoredUntil')
      .populate('seller', 'adSoyad email')
      .sort({ status: 1, createdAt: -1 })
      .lean();
    const names = await shopNamesByUser(items.map((item) => item.seller?._id || item.seller));
    return res.json({
      success: true,
      requests: items.map((item) => serializeRequest(item, names.get(String(item.seller?._id || item.seller)) || ''))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Talepler alınamadı.', hata: error.message });
  }
};

const syncProductSponsorship = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) return null;
  const now = new Date();
  const live = await FeaturedRequest.find({
    product: product._id,
    status: 'approved',
    $or: [{ endsAt: { $gt: now } }, { endsAt: null }]
  }).sort({ endsAt: -1 }).lean();

  if (!live.length) {
    product.isSponsored = false;
    product.sponsoredUntil = null;
  } else {
    product.isSponsored = true;
    const latest = live.reduce((max, item) => {
      if (!item.endsAt) return max;
      const end = new Date(item.endsAt);
      return !max || end > max ? end : max;
    }, null);
    product.sponsoredUntil = latest;
  }
  await product.save();
  return product;
};

const endLiveFeaturedForProduct = async (productId, adminId, reason = '') => {
  const now = new Date();
  const live = await FeaturedRequest.find({
    product: productId,
    status: 'approved',
    $or: [{ endsAt: { $gt: now } }, { endsAt: null }]
  });
  if (!live.length) {
    await Product.findByIdAndUpdate(productId, { $set: { isSponsored: false, sponsoredUntil: null } });
    return 0;
  }
  await FeaturedRequest.updateMany(
    { _id: { $in: live.map((item) => item._id) } },
    {
      $set: {
        status: 'removed',
        endsAt: now,
        reviewedBy: adminId || null,
        reviewedAt: now,
        rejectionReason: reason || 'Süper admin önerilenlerden aldı.'
      }
    }
  );
  await syncProductSponsorship(productId);
  return live.length;
};

const reviewFeatured = async (req, res) => {
  try {
    const status = String(req.body.status || '');
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ mesaj: 'Geçerli bir karar seçin.' });
    }

    const request = await FeaturedRequest.findById(req.params.id).populate('product');
    if (!request) {
      return res.status(404).json({ mesaj: 'Talep bulunamadı.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ mesaj: 'Bu talep zaten sonuçlandırılmış.' });
    }
    if (status === 'approved' && !request.receiptUrl) {
      return res.status(400).json({ mesaj: 'Dekont olmadan onay verilemez. Satıcının ödeme belgesini yüklemesi gerekir.' });
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = status === 'rejected' ? String(req.body.rejectionReason || req.body.note || '').trim() : '';

    if (status === 'approved') {
      const product = await Product.findById(request.product._id || request.product);
      if (!product) {
        return res.status(404).json({ mesaj: 'Ürün bulunamadı, onay verilemedi.' });
      }
      const now = new Date();
      const base = product.sponsoredUntil && new Date(product.sponsoredUntil) > now
        ? new Date(product.sponsoredUntil)
        : now;
      const endsAt = new Date(base.getTime() + request.days * 24 * 60 * 60 * 1000);
      product.isSponsored = true;
      product.sponsoredUntil = endsAt;
      await product.save();
      request.startsAt = now;
      request.endsAt = endsAt;
    }

    await request.save();
    await request.populate('seller', 'adSoyad email');
    await request.populate('product', 'title image price isSponsored sponsoredUntil');

    return res.json({
      mesaj: status === 'approved' ? 'Ürün önerilenlere alındı.' : 'Talep reddedildi.',
      request: serializeRequest(request, await shopNameFor(request.seller._id || request.seller))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Talep güncellenemedi.', hata: error.message });
  }
};

const removeFeatured = async (req, res) => {
  try {
    const request = await FeaturedRequest.findById(req.params.id).populate('product');
    if (!request) {
      return res.status(404).json({ mesaj: 'Talep bulunamadı.' });
    }
    if (request.status !== 'approved') {
      return res.status(400).json({ mesaj: 'Yalnızca yayındaki öne çıkanlar vitrinden alınabilir.' });
    }

    const now = new Date();
    const stillRunning = !request.endsAt || new Date(request.endsAt) > now || Boolean(request.product?.isSponsored);
    if (!stillRunning) {
      return res.status(400).json({ mesaj: 'Bu ürünün öne çıkma süresi zaten bitmiş.' });
    }

    request.status = 'removed';
    request.endsAt = now;
    request.reviewedBy = req.user._id;
    request.reviewedAt = now;
    request.rejectionReason = String(req.body.note || req.body.reason || '').trim() || 'Süper admin önerilenlerden aldı.';
    await request.save();

    await syncProductSponsorship(request.product?._id || request.product);
    await request.populate('seller', 'adSoyad email');
    await request.populate('product', 'title image price isSponsored sponsoredUntil');

    return res.json({
      mesaj: 'Ürün önerilenlerden kaldırıldı.',
      request: serializeRequest(request, await shopNameFor(request.seller._id || request.seller))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Ürün vitrinden alınamadı.', hata: error.message });
  }
};

module.exports = {
  expireFeaturedProducts,
  endLiveFeaturedForProduct,
  listMyFeatured,
  createFeatured,
  cancelFeatured,
  listAdminFeatured,
  reviewFeatured,
  removeFeatured
};
