const PromoCode = require('../models/PromoCode');
const Seller = require('../models/Seller');
const { normalizeCode, evaluatePromo, resolvePromoItems } = require('../utils/promoCode');
const { money } = require('../utils/welcomeCoupon');

const publicPromo = (promo, shopName = '') => ({
  id: promo._id,
  code: promo.code,
  percent: promo.percent,
  minSubtotal: promo.minSubtotal,
  note: promo.note || '',
  isActive: promo.isActive,
  usedCount: promo.usedCount || 0,
  createdAt: promo.createdAt,
  sellerId: promo.seller ? String(promo.seller) : null,
  sellerName: shopName || (promo.seller ? 'Atölye' : 'Site'),
  scope: promo.seller ? 'seller' : 'site'
});

const shopNamesByUser = async (userIds) => {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return new Map();
  const shops = await Seller.find({ user: { $in: ids } }).select('user magazaAdi');
  return new Map(shops.map((shop) => [String(shop.user), shop.magazaAdi]));
};

const mapPromos = async (items) => {
  const names = await shopNamesByUser(items.map((promo) => promo.seller));
  return items.map((promo) => publicPromo(
    promo,
    promo.seller ? (names.get(String(promo.seller)) || 'Atölye') : 'Site'
  ));
};

const parsePromoBody = (body) => {
  const code = normalizeCode(body.code || body.kod);
  const percent = Number(body.percent);
  const minSubtotal = Math.max(0, Number(body.minSubtotal) || 0);
  const note = String(body.note || '').trim();

  if (!code || code.length < 3) {
    return { error: 'En az 3 karakterlik bir kod yaz.' };
  }
  if (code.startsWith('NIK10-')) {
    return { error: 'NIK10 kodları kişisel hoş geldin indirimine ayrılır.' };
  }
  if (!Number.isFinite(percent) || percent < 1 || percent > 80) {
    return { error: 'İndirim oranı 1 ile 80 arasında olmalı.' };
  }

  return {
    code,
    percent,
    minSubtotal,
    note,
    isActive: body.isActive !== false
  };
};

const applyPromoUpdates = (promo, body) => {
  if (body.percent != null) {
    const percent = Number(body.percent);
    if (!Number.isFinite(percent) || percent < 1 || percent > 80) {
      return 'İndirim oranı 1 ile 80 arasında olmalı.';
    }
    promo.percent = percent;
  }
  if (body.minSubtotal != null) {
    promo.minSubtotal = Math.max(0, Number(body.minSubtotal) || 0);
  }
  if (body.note != null) promo.note = String(body.note).trim();
  if (body.isActive != null) promo.isActive = Boolean(body.isActive);
  return null;
};

exports.listPromos = async (req, res) => {
  try {
    const items = await PromoCode.find({}).sort({ createdAt: -1 });
    res.json({ success: true, promos: await mapPromos(items) });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kampanya kodları alınamadı.' });
  }
};

exports.createPromo = async (req, res) => {
  try {
    const parsed = parsePromoBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, mesaj: parsed.error });
    }

    const exists = await PromoCode.findOne({ code: parsed.code });
    if (exists) {
      return res.status(400).json({ success: false, mesaj: 'Bu kod zaten kayıtlı.' });
    }

    const promo = await PromoCode.create({
      code: parsed.code,
      percent: parsed.percent,
      minSubtotal: parsed.minSubtotal,
      note: parsed.note,
      isActive: parsed.isActive,
      seller: null
    });

    res.status(201).json({ success: true, mesaj: 'Kampanya kodu eklendi.', promo: publicPromo(promo, 'Site') });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kampanya kodu eklenemedi.', hata: error.message });
  }
};

exports.updatePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ success: false, mesaj: 'Kampanya kodu bulunamadı.' });
    }

    const error = applyPromoUpdates(promo, req.body);
    if (error) {
      return res.status(400).json({ success: false, mesaj: error });
    }

    await promo.save();
    const [mapped] = await mapPromos([promo]);
    res.json({ success: true, mesaj: 'Kampanya güncellendi.', promo: mapped });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kampanya güncellenemedi.' });
  }
};

exports.deletePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) {
      return res.status(404).json({ success: false, mesaj: 'Kampanya kodu bulunamadı.' });
    }
    res.json({ success: true, mesaj: 'Kampanya kodu silindi.' });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kampanya silinemedi.' });
  }
};

exports.listMyPromos = async (req, res) => {
  try {
    const items = await PromoCode.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, promos: await mapPromos(items) });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kampanya kodları alınamadı.' });
  }
};

exports.createMyPromo = async (req, res) => {
  try {
    const parsed = parsePromoBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, mesaj: parsed.error });
    }

    const exists = await PromoCode.findOne({ code: parsed.code });
    if (exists) {
      return res.status(400).json({ success: false, mesaj: 'Bu kod zaten kayıtlı.' });
    }

    const promo = await PromoCode.create({
      code: parsed.code,
      percent: parsed.percent,
      minSubtotal: parsed.minSubtotal,
      note: parsed.note,
      isActive: parsed.isActive,
      seller: req.user._id
    });

    const [mapped] = await mapPromos([promo]);
    res.status(201).json({ success: true, mesaj: 'Kampanya kodu eklendi.', promo: mapped });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kampanya kodu eklenemedi.', hata: error.message });
  }
};

exports.updateMyPromo = async (req, res) => {
  try {
    const promo = await PromoCode.findOne({ _id: req.params.id, seller: req.user._id });
    if (!promo) {
      return res.status(404).json({ success: false, mesaj: 'Kampanya kodu bulunamadı.' });
    }

    const error = applyPromoUpdates(promo, req.body);
    if (error) {
      return res.status(400).json({ success: false, mesaj: error });
    }

    await promo.save();
    const [mapped] = await mapPromos([promo]);
    res.json({ success: true, mesaj: 'Kampanya güncellendi.', promo: mapped });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kampanya güncellenemedi.' });
  }
};

exports.deleteMyPromo = async (req, res) => {
  try {
    const promo = await PromoCode.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    if (!promo) {
      return res.status(404).json({ success: false, mesaj: 'Kampanya kodu bulunamadı.' });
    }
    res.json({ success: true, mesaj: 'Kampanya kodu silindi.' });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kampanya silinemedi.' });
  }
};

exports.verifyPromo = async (req, res) => {
  try {
    const items = await resolvePromoItems(req.body.items);
    const subtotal = items.length
      ? money(items.reduce((sum, item) => sum + item.price * item.quantity, 0))
      : money(req.body.subtotal);
    const result = await evaluatePromo(req.body.kod || req.body.code, { subtotal, items });
    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, mesaj: result.mesaj });
    }
    res.json({
      success: true,
      mesaj: result.mesaj,
      kod: result.kod,
      indirimOrani: result.indirimOrani,
      indirim: result.indirim,
      minSubtotal: result.minSubtotal,
      eligibleSubtotal: result.eligibleSubtotal,
      sellerScoped: result.sellerScoped,
      sellerId: result.sellerId,
      shopName: result.shopName || ''
    });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kod doğrulanamadı.' });
  }
};
