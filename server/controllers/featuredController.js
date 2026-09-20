const mongoose = require('mongoose');
const FeaturedRequest = require('../models/FeaturedRequest');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const SiteSetting = require('../models/SiteSetting');
const { packageOf, packageList, FEATURED_SLOTS } = require('../utils/featuredPackages');
const { resolveBank } = require('../utils/bank');
const { receiptPublicPath, removeUpload } = require('../middleware/uploadMiddleware');

const MS_DAY = 24 * 60 * 60 * 1000;

const remainingDaysOf = (endsAt, now = new Date()) => {
  if (!endsAt) return 0;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime()) || end <= now) return 0;
  return Math.ceil((end.getTime() - now.getTime()) / MS_DAY);
};

const canonicalStatus = (item, now = new Date()) => {
  const status = item?.status;
  if (status === 'removed') return 'ended';
  if (status === 'approved') {
    if (item.endsAt && new Date(item.endsAt) <= now) return 'ended';
    return 'live';
  }
  if (status === 'live' && item.endsAt && new Date(item.endsAt) <= now) return 'ended';
  return status;
};

const getBank = () => resolveBank();

const expireFeaturedProducts = async () => {
  const now = new Date();
  await FeaturedRequest.updateMany(
    { status: { $in: ['live', 'approved'] }, endsAt: { $lte: now } },
    { $set: { status: 'ended' } }
  );
  await FeaturedRequest.updateMany(
    { status: 'approved', $or: [{ endsAt: { $gt: now } }, { endsAt: null }] },
    { $set: { status: 'live' } }
  );
  await FeaturedRequest.updateMany(
    { status: 'removed' },
    { $set: { status: 'ended' } }
  );

  const grouped = await FeaturedRequest.aggregate([
    { $match: { status: 'live' } },
    { $group: { _id: '$product', until: { $max: '$endsAt' } } }
  ]);
  const liveIds = grouped.map((row) => row._id).filter(Boolean);
  await Promise.all(grouped.map((row) => (
    Product.updateOne(
      { _id: row._id },
      { $set: { isSponsored: true, sponsoredUntil: row.until || null } }
    )
  )));
  await Product.updateMany(
    { isSponsored: true, ...(liveIds.length ? { _id: { $nin: liveIds } } : {}) },
    { $set: { isSponsored: false, sponsoredUntil: null } }
  );
};

const liveProductIds = async (now = new Date()) => {
  await expireFeaturedProducts();
  const ids = await FeaturedRequest.distinct('product', {
    status: 'live',
    $or: [{ endsAt: { $gt: now } }, { endsAt: null }]
  });
  return ids.map(String);
};

const slotsOf = async () => {
  const now = new Date();
  const ids = await liveProductIds(now);
  const next = await FeaturedRequest.find({ status: 'live' }).sort({ endsAt: 1 }).select('endsAt').lean();
  return {
    used: ids.length,
    total: FEATURED_SLOTS,
    free: Math.max(0, FEATURED_SLOTS - ids.length),
    nextFreeAt: ids.length >= FEATURED_SLOTS ? (next[0]?.endsAt || null) : null
  };
};

const serializeRequest = (doc, shopName = '', now = new Date()) => {
  const item = doc.toObject ? doc.toObject() : doc;
  const product = item.product && typeof item.product === 'object' ? item.product : null;
  const seller = item.seller && typeof item.seller === 'object' ? item.seller : null;
  const status = canonicalStatus(item, now);
  const endsAt = item.endsAt || product?.sponsoredUntil || null;
  return {
    id: item._id,
    days: item.days,
    price: item.price,
    status,
    rawStatus: item.status,
    complimentary: Number(item.price) === 0,
    note: item.note || '',
    receiptUrl: item.receiptUrl || '',
    receiptName: item.receiptName || '',
    rejectionReason: item.rejectionReason || '',
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt || null,
    startsAt: item.startsAt || null,
    endsAt,
    remainingDays: status === 'live' ? remainingDaysOf(endsAt, now) : 0,
    product: product
      ? {
          id: product._id,
          title: product.title,
          image: product.image,
          price: product.price,
          isSponsored: Boolean(product.isSponsored) || status === 'live',
          sponsoredUntil: product.sponsoredUntil || endsAt
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

const updateFeaturedSettings = async (req, res) => {
  try {
    const holder = String(req.body.holder || req.body.featuredBankHolder || '').trim();
    const name = String(req.body.name || req.body.featuredBankName || '').trim() || holder;
    const iban = String(req.body.iban || req.body.featuredBankIban || '').replace(/\s+/g, ' ').trim();
    if (!(holder || name) || iban.replace(/\s/g, '').length < 10) {
      return res.status(400).json({ mesaj: 'Alıcı ad soyad ve geçerli bir IBAN yaz.' });
    }
    const settings = await SiteSetting.findOneAndUpdate(
      { key: 'site' },
      { $set: { featuredBankName: name, featuredBankHolder: holder || name, featuredBankIban: iban } },
      { upsert: true, new: true }
    );
    return res.json({
      success: true,
      mesaj: 'Vitrin havale bilgisi kaydedildi.',
      bank: {
        name: settings.featuredBankName,
        holder: settings.featuredBankHolder,
        iban: settings.featuredBankIban
      }
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Ayar kaydedilemedi.', hata: error.message });
  }
};

const listMyFeatured = async (req, res) => {
  try {
    await expireFeaturedProducts();
    const items = await FeaturedRequest.find({ seller: req.user._id })
      .populate('product', 'title image price isSponsored sponsoredUntil')
      .sort({ createdAt: -1 })
      .lean();
    const shop = await shopNameFor(req.user._id);
    const slots = await slotsOf();
    return res.json({
      success: true,
      slots,
      bank: await getBank(),
      packages: packageList(),
      requests: items.map((item) => serializeRequest(item, shop))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Talepler alınamadı.', hata: error.message });
  }
};

const createFeatured = async (req, res) => {
  const uploaded = receiptPublicPath(req.file);
  try {
    await expireFeaturedProducts();
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

    const slots = await slotsOf();
    const extending = Boolean(product.isSponsored);
    if (!extending && slots.free <= 0) {
      removeUpload(uploaded);
      return res.status(400).json({
        mesaj: `Vitrin dolu (${slots.used}/${slots.total}). Bir yer boşalınca tekrar dene.`,
        slots
      });
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
      mesaj: extending
        ? 'Uzatma dekontu alındı. Onaylanınca mevcut vitrin süren uzar.'
        : 'Dekont alındı. Onaylanınca ürün 12 kişilik vitrine çıkar.',
      slots,
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
    await expireFeaturedProducts();
    const status = String(req.query.status || 'all');
    let match = {};
    if (status === 'live' || status === 'approved') match = { status: { $in: ['live', 'approved'] } };
    else if (status === 'ended' || status === 'removed') match = { status: { $in: ['ended', 'removed'] } };
    else if (status !== 'all') match = { status };
    const items = await FeaturedRequest.find(match)
      .populate('product', 'title image price isSponsored sponsoredUntil seller')
      .populate('seller', 'adSoyad email')
      .sort({ status: 1, createdAt: -1 })
      .lean();
    const names = await shopNamesByUser(items.map((item) => item.seller?._id || item.seller));
    const slots = await slotsOf();
    return res.json({
      success: true,
      slots,
      bank: await getBank(),
      packages: packageList(),
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
    status: 'live',
    $or: [{ endsAt: { $gt: now } }, { endsAt: null }]
  }).sort({ endsAt: -1 }).lean();

  if (!live.length) {
    product.isSponsored = false;
    product.sponsoredUntil = null;
  } else {
    product.isSponsored = true;
    product.sponsoredUntil = live.reduce((max, item) => {
      if (!item.endsAt) return max;
      const end = new Date(item.endsAt);
      return !max || end > max ? end : max;
    }, null);
  }
  await product.save();
  return product;
};

const endLiveFeaturedForProduct = async (productId, adminId, reason = '') => {
  const now = new Date();
  const live = await FeaturedRequest.find({
    product: productId,
    status: { $in: ['live', 'approved'] },
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
        status: 'ended',
        endsAt: now,
        reviewedBy: adminId || null,
        reviewedAt: now,
        rejectionReason: reason || 'Süper admin vitrinden aldı.'
      }
    }
  );
  await syncProductSponsorship(productId);
  return live.length;
};

const reviewFeatured = async (req, res) => {
  try {
    await expireFeaturedProducts();
    const raw = String(req.body.status || '');
    const approve = raw === 'approved' || raw === 'live';
    const reject = raw === 'rejected';
    if (!approve && !reject) {
      return res.status(400).json({ mesaj: 'Geçerli bir karar seçin.' });
    }

    const request = await FeaturedRequest.findById(req.params.id).populate('product');
    if (!request) {
      return res.status(404).json({ mesaj: 'Talep bulunamadı.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ mesaj: 'Bu talep zaten sonuçlandırılmış.' });
    }
    if (approve && !request.receiptUrl && Number(request.price) > 0) {
      return res.status(400).json({ mesaj: 'Dekont olmadan onay verilemez.' });
    }

    const product = await Product.findById(request.product._id || request.product);
    if (!product) {
      return res.status(404).json({ mesaj: 'Ürün bulunamadı, onay verilemedi.' });
    }

    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = reject ? String(req.body.rejectionReason || req.body.note || '').trim() : '';

    if (reject) {
      request.status = 'rejected';
      await request.save();
    } else {
      const slots = await slotsOf();
      const extending = Boolean(product.isSponsored);
      if (!extending && slots.free <= 0) {
        return res.status(400).json({
          mesaj: `Vitrin dolu (${slots.used}/${slots.total}). Bir yer boşalınca onaylayabilirsin.`,
          slots
        });
      }
      const now = new Date();
      const base = product.sponsoredUntil && new Date(product.sponsoredUntil) > now
        ? new Date(product.sponsoredUntil)
        : now;
      const endsAt = new Date(base.getTime() + request.days * MS_DAY);
      request.status = 'live';
      request.startsAt = extending ? base : now;
      request.endsAt = endsAt;
      await request.save();
      await syncProductSponsorship(product._id);
    }

    await request.populate('seller', 'adSoyad email');
    await request.populate('product', 'title image price isSponsored sponsoredUntil');

    return res.json({
      mesaj: approve
        ? (product.isSponsored && request.startsAt > new Date(Date.now() - 1000)
          ? 'Süre uzatıldı, ürün vitrinde kalmaya devam eder.'
          : 'Ürün vitrine alındı.')
        : 'Talep reddedildi.',
      slots: await slotsOf(),
      request: serializeRequest(request, await shopNameFor(request.seller._id || request.seller))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Talep güncellenemedi.', hata: error.message });
  }
};

const giftFeatured = async (req, res) => {
  try {
    await expireFeaturedProducts();
    const productId = req.body.productId || req.body.product;
    const pack = packageOf(req.body.days || 3);
    if (!pack) return res.status(400).json({ mesaj: '3, 5 veya 7 gün seç.' });
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ mesaj: 'Geçerli bir ürün seç.' });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ mesaj: 'Ürün bulunamadı.' });
    if (product.approvalStatus !== 'approved' || !product.isActive) {
      return res.status(400).json({ mesaj: 'Yalnızca yayındaki ürüne ücretsiz vitrin verilebilir.' });
    }

    const slots = await slotsOf();
    const extending = Boolean(product.isSponsored);
    if (!extending && slots.free <= 0) {
      return res.status(400).json({ mesaj: `Vitrin dolu (${slots.used}/${slots.total}).`, slots });
    }

    const now = new Date();
    const base = product.sponsoredUntil && new Date(product.sponsoredUntil) > now
      ? new Date(product.sponsoredUntil)
      : now;
    const endsAt = new Date(base.getTime() + pack.days * MS_DAY);
    const request = await FeaturedRequest.create({
      seller: product.seller,
      product: product._id,
      days: pack.days,
      price: 0,
      status: 'live',
      note: String(req.body.note || '').trim() || 'Süper admin ücretsiz vitrin verdi.',
      startsAt: extending ? base : now,
      endsAt,
      reviewedBy: req.user._id,
      reviewedAt: now
    });
    await syncProductSponsorship(product._id);
    await request.populate('product', 'title image price isSponsored sponsoredUntil');
    await request.populate('seller', 'adSoyad email');
    return res.status(201).json({
      mesaj: extending ? 'Ücretsiz süre eklendi.' : 'Ürün ücretsiz vitrine alındı.',
      slots: await slotsOf(),
      request: serializeRequest(request, await shopNameFor(product.seller))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Ücretsiz vitrin verilemedi.', hata: error.message });
  }
};

const removeFeatured = async (req, res) => {
  try {
    const request = await FeaturedRequest.findById(req.params.id).populate('product');
    if (!request) {
      return res.status(404).json({ mesaj: 'Talep bulunamadı.' });
    }
    if (!['live', 'approved'].includes(request.status)) {
      return res.status(400).json({ mesaj: 'Yalnızca yayındaki kayıt vitrinden alınabilir.' });
    }

    const now = new Date();
    const stillRunning = !request.endsAt || new Date(request.endsAt) > now || Boolean(request.product?.isSponsored);
    if (!stillRunning) {
      return res.status(400).json({ mesaj: 'Bu ürünün vitrin süresi zaten bitmiş.' });
    }

    request.status = 'ended';
    request.endsAt = now;
    request.reviewedBy = req.user._id;
    request.reviewedAt = now;
    request.rejectionReason = String(req.body.note || req.body.reason || '').trim() || 'Süper admin vitrinden aldı.';
    await request.save();

    await syncProductSponsorship(request.product?._id || request.product);
    await request.populate('seller', 'adSoyad email');
    await request.populate('product', 'title image price isSponsored sponsoredUntil');

    return res.json({
      mesaj: 'Ürün vitrinden alındı.',
      slots: await slotsOf(),
      request: serializeRequest(request, await shopNameFor(request.seller._id || request.seller))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Ürün vitrinden alınamadı.', hata: error.message });
  }
};

module.exports = {
  expireFeaturedProducts,
  endLiveFeaturedForProduct,
  liveProductIds,
  slotsOf,
  listMyFeatured,
  createFeatured,
  cancelFeatured,
  listAdminFeatured,
  reviewFeatured,
  removeFeatured,
  giftFeatured,
  updateFeaturedSettings
};
