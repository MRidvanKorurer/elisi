const mongoose = require('mongoose');
const WeeklyAtelier = require('../models/WeeklyAtelier');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const User = require('../models/User');
const SiteSetting = require('../models/SiteSetting');
const { ATELIER_WEEK_SLOTS, ATELIER_WEEK_PACKAGE, packageOf, packageList } = require('../utils/atelierWeek');
const { DEFAULT_BANK } = require('../utils/featuredPackages');
const { serializePublicAtelier } = require('../utils/publicAtelier');
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
  if (status === 'live' && item.endsAt && new Date(item.endsAt) <= now) return 'ended';
  return status;
};

const getBank = async () => {
  const settings = await SiteSetting.findOne({ key: 'site' }).lean();
  return {
    name: settings?.featuredBankName || DEFAULT_BANK.name,
    iban: settings?.featuredBankIban || DEFAULT_BANK.iban
  };
};

const liveProductCount = async (userId) => Product.countDocuments({
  seller: userId,
  isActive: true,
  approvalStatus: 'approved'
});

const expireWeeklyAteliers = async () => {
  const now = new Date();
  await WeeklyAtelier.updateMany(
    { status: 'live', endsAt: { $lte: now } },
    { $set: { status: 'ended' } }
  );

  const grouped = await WeeklyAtelier.aggregate([
    { $match: { status: 'live' } },
    { $group: { _id: '$seller', until: { $max: '$endsAt' } } }
  ]);
  const liveUserIds = grouped.map((row) => row._id).filter(Boolean);
  await Promise.all(grouped.map((row) => (
    Seller.updateOne(
      { user: row._id },
      { $set: { isWeeklyAtelier: true, weeklyUntil: row.until || null } }
    )
  )));
  await Seller.updateMany(
    { isWeeklyAtelier: true, ...(liveUserIds.length ? { user: { $nin: liveUserIds } } : {}) },
    { $set: { isWeeklyAtelier: false, weeklyUntil: null } }
  );
};

const liveSellerIds = async (now = new Date()) => {
  await expireWeeklyAteliers();
  const ids = await WeeklyAtelier.distinct('seller', {
    status: 'live',
    $or: [{ endsAt: { $gt: now } }, { endsAt: null }]
  });
  return ids.map(String);
};

const slotsOf = async () => {
  const now = new Date();
  const ids = await liveSellerIds(now);
  const next = await WeeklyAtelier.find({ status: 'live' }).sort({ endsAt: 1 }).select('endsAt').lean();
  return {
    used: ids.length,
    total: ATELIER_WEEK_SLOTS,
    free: Math.max(0, ATELIER_WEEK_SLOTS - ids.length),
    nextFreeAt: ids.length >= ATELIER_WEEK_SLOTS ? (next[0]?.endsAt || null) : null
  };
};

const shopByUser = async (userId) => Seller.findOne({ user: userId }).lean();

const shopsByUsers = async (userIds) => {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return new Map();
  const shops = await Seller.find({ user: { $in: ids } }).lean();
  return new Map(shops.map((shop) => [String(shop.user), shop]));
};

const serializeRequest = (doc, shop = null, user = null, now = new Date()) => {
  const item = doc.toObject ? doc.toObject() : doc;
  const seller = item.seller && typeof item.seller === 'object' ? item.seller : user;
  const status = canonicalStatus(item, now);
  const endsAt = item.endsAt || shop?.weeklyUntil || null;
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
    seller: {
      id: seller?._id || item.seller,
      adSoyad: seller?.adSoyad || '',
      email: seller?.email || '',
      magazaAdi: shop?.magazaAdi || '',
      slug: shop?.slug || '',
      shopId: shop?._id || null,
      isWeeklyAtelier: Boolean(shop?.isWeeklyAtelier) || status === 'live',
      weeklyUntil: shop?.weeklyUntil || endsAt
    }
  };
};

const syncShopWeek = async (userId) => {
  const shop = await Seller.findOne({ user: userId });
  if (!shop) return null;
  const now = new Date();
  const live = await WeeklyAtelier.find({
    seller: userId,
    status: 'live',
    $or: [{ endsAt: { $gt: now } }, { endsAt: null }]
  }).sort({ endsAt: -1 }).lean();

  if (!live.length) {
    shop.isWeeklyAtelier = false;
    shop.weeklyUntil = null;
  } else {
    shop.isWeeklyAtelier = true;
    shop.weeklyUntil = live.reduce((max, item) => {
      if (!item.endsAt) return max;
      const end = new Date(item.endsAt);
      return !max || end > max ? end : max;
    }, null);
  }
  await shop.save();
  return shop;
};

const getAtelierWeekMeta = async (req, res) => {
  try {
    const [slots, bank] = await Promise.all([slotsOf(), getBank()]);
    return res.json({
      success: true,
      packages: packageList(),
      slots,
      bank
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Haftanın atölyeleri bilgisi alınamadı.', hata: error.message });
  }
};

const listPublicWeek = async (req, res) => {
  try {
    await expireWeeklyAteliers();
    const now = new Date();
    const live = await WeeklyAtelier.find({
      status: 'live',
      $or: [{ endsAt: { $gt: now } }, { endsAt: null }]
    }).sort({ endsAt: -1 }).lean();

    const uniqueUsers = [];
    const seen = new Set();
    live.forEach((row) => {
      const id = String(row.seller);
      if (seen.has(id)) return;
      seen.add(id);
      uniqueUsers.push(row.seller);
    });

    const shops = await Seller.find({ user: { $in: uniqueUsers }, durum: 'approved' }).lean();
    const shopMap = new Map(shops.map((shop) => [String(shop.user), shop]));
    const makers = await User.find({ _id: { $in: uniqueUsers } }).select('adSoyad avatarUrl').lean();
    const makerMap = new Map(makers.map((user) => [String(user._id), user]));

    const ateliers = [];
    for (const userId of uniqueUsers) {
      const shop = shopMap.get(String(userId));
      if (!shop) continue;
      const [productCount, covers] = await Promise.all([
        Product.countDocuments({ seller: userId, isActive: true, approvalStatus: { $nin: ['pending', 'rejected'] } }),
        Product.find({ seller: userId, isActive: true, approvalStatus: { $nin: ['pending', 'rejected'] } })
          .sort({ soldCount: -1, createdAt: -1 })
          .select('image')
          .limit(4)
          .lean()
      ]);
      ateliers.push(serializePublicAtelier(shop, makerMap.get(String(userId)), {
        productCount,
        coverImages: covers.map((item) => item.image).filter(Boolean),
        isWeeklyAtelier: true
      }));
      if (ateliers.length >= ATELIER_WEEK_SLOTS) break;
    }

    return res.json({
      success: true,
      ateliers,
      slots: await slotsOf()
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Haftanın atölyeleri alınamadı.', hata: error.message });
  }
};

const listMyWeek = async (req, res) => {
  try {
    await expireWeeklyAteliers();
    const items = await WeeklyAtelier.find({ seller: req.user._id }).sort({ createdAt: -1 }).lean();
    const shop = await shopByUser(req.user._id);
    return res.json({
      success: true,
      slots: await slotsOf(),
      bank: await getBank(),
      packages: packageList(),
      live: Boolean(shop?.isWeeklyAtelier),
      requests: items.map((item) => serializeRequest(item, shop, req.user))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Talepler alınamadı.', hata: error.message });
  }
};

const createWeek = async (req, res) => {
  const uploaded = receiptPublicPath(req.file);
  try {
    await expireWeeklyAteliers();
    const pack = packageOf(req.body.days || 7);
    if (!pack) {
      removeUpload(uploaded);
      return res.status(400).json({ mesaj: 'Haftanın atölyesi yalnızca 7 günlük pakettir.' });
    }
    if (!uploaded) {
      return res.status(400).json({ mesaj: 'Ödeme dekontunu yükleyin. Süper admin bu dekonta göre onaylar.' });
    }

    const shop = await Seller.findOne({ user: req.user._id, durum: 'approved' });
    if (!shop) {
      removeUpload(uploaded);
      return res.status(400).json({ mesaj: 'Onaylı bir atölyeniz yok.' });
    }
    const liveCount = await liveProductCount(req.user._id);
    if (liveCount < 1) {
      removeUpload(uploaded);
      return res.status(400).json({ mesaj: 'Yayında en az bir onaylı ürününüz olmalı.' });
    }

    const existing = await WeeklyAtelier.findOne({ seller: req.user._id, status: 'pending' });
    if (existing) {
      removeUpload(uploaded);
      return res.status(400).json({ mesaj: 'Zaten onay bekleyen bir talebiniz var.' });
    }

    const slots = await slotsOf();
    const extending = Boolean(shop.isWeeklyAtelier);
    if (!extending && slots.free <= 0) {
      removeUpload(uploaded);
      return res.status(400).json({
        mesaj: `Vitrin dolu (${slots.used}/${slots.total}). Bir yer boşalınca tekrar dene.`,
        slots
      });
    }

    const request = await WeeklyAtelier.create({
      seller: req.user._id,
      days: pack.days,
      price: pack.price,
      note: String(req.body.note || '').trim(),
      receiptUrl: uploaded,
      receiptName: String(req.file.originalname || req.file.filename || '').slice(0, 180)
    });

    return res.status(201).json({
      mesaj: extending
        ? 'Uzatma dekontu alındı. Onaylanınca mevcut hafta süren uzar.'
        : 'Dekont alındı. Onaylanınca atölyen 3 kişilik haftalık vitrine çıkar.',
      slots,
      request: serializeRequest(request, shop, req.user)
    });
  } catch (error) {
    removeUpload(uploaded);
    return res.status(500).json({ mesaj: 'Talep oluşturulamadı.', hata: error.message });
  }
};

const cancelWeek = async (req, res) => {
  try {
    const request = await WeeklyAtelier.findOne({ _id: req.params.id, seller: req.user._id });
    if (!request) return res.status(404).json({ mesaj: 'Talep bulunamadı.' });
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

const listAdminWeek = async (req, res) => {
  try {
    await expireWeeklyAteliers();
    const status = String(req.query.status || 'all');
    let match = {};
    if (status === 'live') match = { status: 'live' };
    else if (status === 'ended') match = { status: 'ended' };
    else if (status !== 'all') match = { status };
    const items = await WeeklyAtelier.find(match)
      .populate('seller', 'adSoyad email')
      .sort({ status: 1, createdAt: -1 })
      .lean();
    const shops = await shopsByUsers(items.map((item) => item.seller?._id || item.seller));
    return res.json({
      success: true,
      slots: await slotsOf(),
      bank: await getBank(),
      packages: packageList(),
      requests: items.map((item) => serializeRequest(item, shops.get(String(item.seller?._id || item.seller)), item.seller))
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Talepler alınamadı.', hata: error.message });
  }
};

const reviewWeek = async (req, res) => {
  try {
    await expireWeeklyAteliers();
    const raw = String(req.body.status || '');
    const approve = raw === 'approved' || raw === 'live';
    const reject = raw === 'rejected';
    if (!approve && !reject) {
      return res.status(400).json({ mesaj: 'Geçerli bir karar seçin.' });
    }

    const request = await WeeklyAtelier.findById(req.params.id).populate('seller', 'adSoyad email');
    if (!request) return res.status(404).json({ mesaj: 'Talep bulunamadı.' });
    if (request.status !== 'pending') {
      return res.status(400).json({ mesaj: 'Bu talep zaten sonuçlandırılmış.' });
    }
    if (approve && !request.receiptUrl && Number(request.price) > 0) {
      return res.status(400).json({ mesaj: 'Dekont olmadan onay verilemez.' });
    }

    const shop = await shopByUser(request.seller._id || request.seller);
    if (!shop || shop.durum !== 'approved') {
      return res.status(400).json({ mesaj: 'Satıcı onaylı değil, onay verilemedi.' });
    }

    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectionReason = reject ? String(req.body.rejectionReason || req.body.note || '').trim() : '';

    if (reject) {
      request.status = 'rejected';
      await request.save();
    } else {
      const slots = await slotsOf();
      const extending = Boolean(shop.isWeeklyAtelier);
      if (!extending && slots.free <= 0) {
        return res.status(400).json({
          mesaj: `Vitrin dolu (${slots.used}/${slots.total}). Bir yer boşalınca onaylayabilirsin.`,
          slots
        });
      }
      const now = new Date();
      const base = shop.weeklyUntil && new Date(shop.weeklyUntil) > now
        ? new Date(shop.weeklyUntil)
        : now;
      request.status = 'live';
      request.startsAt = extending ? base : now;
      request.endsAt = new Date(base.getTime() + request.days * MS_DAY);
      await request.save();
      await syncShopWeek(shop.user);
    }

    return res.json({
      mesaj: approve
        ? (shop.isWeeklyAtelier ? 'Süre uzatıldı, atölye vitrinde kalmaya devam eder.' : 'Atölye haftanın vitrine alındı.')
        : 'Talep reddedildi.',
      slots: await slotsOf(),
      request: serializeRequest(request, await shopByUser(request.seller._id || request.seller), request.seller)
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Talep güncellenemedi.', hata: error.message });
  }
};

const giftWeek = async (req, res) => {
  try {
    await expireWeeklyAteliers();
    const sellerId = req.body.sellerId || req.body.seller;
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ mesaj: 'Geçerli bir atölye seç.' });
    }
    const shop = await Seller.findById(sellerId);
    if (!shop) return res.status(404).json({ mesaj: 'Atölye bulunamadı.' });
    if (shop.durum !== 'approved') {
      return res.status(400).json({ mesaj: 'Yalnızca onaylı atölyeye ücretsiz hafta verilebilir.' });
    }
    const liveCount = await liveProductCount(shop.user);
    if (liveCount < 1) {
      return res.status(400).json({ mesaj: 'Yayında ürünü olmayan atölyeye vitrin verilemez.' });
    }

    const slots = await slotsOf();
    const extending = Boolean(shop.isWeeklyAtelier);
    if (!extending && slots.free <= 0) {
      return res.status(400).json({ mesaj: `Vitrin dolu (${slots.used}/${slots.total}).`, slots });
    }

    const now = new Date();
    const base = shop.weeklyUntil && new Date(shop.weeklyUntil) > now
      ? new Date(shop.weeklyUntil)
      : now;
    const request = await WeeklyAtelier.create({
      seller: shop.user,
      days: ATELIER_WEEK_PACKAGE.days,
      price: 0,
      status: 'live',
      note: String(req.body.note || '').trim() || 'Süper admin ücretsiz haftanın atölyesi verdi.',
      startsAt: extending ? base : now,
      endsAt: new Date(base.getTime() + ATELIER_WEEK_PACKAGE.days * MS_DAY),
      reviewedBy: req.user._id,
      reviewedAt: now
    });
    await syncShopWeek(shop.user);
    await request.populate('seller', 'adSoyad email');
    return res.status(201).json({
      mesaj: extending ? 'Ücretsiz süre eklendi.' : 'Atölye ücretsiz haftanın vitrine alındı.',
      slots: await slotsOf(),
      request: serializeRequest(request, await Seller.findById(shop._id).lean(), request.seller)
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Ücretsiz hafta verilemedi.', hata: error.message });
  }
};

const removeWeek = async (req, res) => {
  try {
    const request = await WeeklyAtelier.findById(req.params.id).populate('seller', 'adSoyad email');
    if (!request) return res.status(404).json({ mesaj: 'Talep bulunamadı.' });
    if (request.status !== 'live') {
      return res.status(400).json({ mesaj: 'Yalnızca yayındaki kayıt vitrinden alınabilir.' });
    }

    const now = new Date();
    const stillRunning = !request.endsAt || new Date(request.endsAt) > now;
    if (!stillRunning) {
      return res.status(400).json({ mesaj: 'Bu atölyenin haftası zaten bitmiş.' });
    }

    request.status = 'ended';
    request.endsAt = now;
    request.reviewedBy = req.user._id;
    request.reviewedAt = now;
    request.rejectionReason = String(req.body.note || req.body.reason || '').trim() || 'Süper admin vitrinden aldı.';
    await request.save();
    await syncShopWeek(request.seller._id || request.seller);

    return res.json({
      mesaj: 'Atölye haftanın vitrinden alındı.',
      slots: await slotsOf(),
      request: serializeRequest(request, await shopByUser(request.seller._id || request.seller), request.seller)
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Atölye vitrinden alınamadı.', hata: error.message });
  }
};

module.exports = {
  expireWeeklyAteliers,
  slotsOf,
  getAtelierWeekMeta,
  listPublicWeek,
  listMyWeek,
  createWeek,
  cancelWeek,
  listAdminWeek,
  reviewWeek,
  giftWeek,
  removeWeek
};
