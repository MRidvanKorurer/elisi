const PromoCode = require('../models/PromoCode');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { normalizeCode, money } = require('./welcomeCoupon');

const promoDiscountOf = (subtotal, percent) =>
  money((Number(subtotal) || 0) * (Number(percent) || 0) / 100);

const salePriceOf = (product) => {
  if (!product) return 0;
  const discountRate = Number(product.discountPercentage || 0);
  const price = Number(product.price || 0);
  return discountRate > 0 ? money(price - (price * discountRate / 100)) : money(price);
};

const normalizeEvaluateInput = (input) => {
  if (input == null || typeof input === 'number') {
    return { subtotal: money(input), items: [] };
  }
  return {
    subtotal: money(input.subtotal),
    items: Array.isArray(input.items) ? input.items : []
  };
};

const sellerIdOf = (value) => {
  if (!value) return '';
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const eligibleSubtotalOf = (promo, items, fallbackSubtotal) => {
  if (!promo.seller) return money(fallbackSubtotal);
  const sellerId = sellerIdOf(promo.seller);
  return money(items.reduce((sum, item) => {
    if (sellerIdOf(item.seller) !== sellerId) return sum;
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
  }, 0));
};

const resolvePromoItems = async (rawItems = []) => {
  const list = Array.isArray(rawItems) ? rawItems : [];
  const ids = [...new Set(
    list
      .map((item) => String(item.product || item.productId || item.id || ''))
      .filter((id) => /^[a-f0-9]{24}$/i.test(id))
  )];
  if (!ids.length) return [];

  const products = await Product.find({ _id: { $in: ids } }).select('_id seller price discountPercentage');
  const byId = new Map(products.map((product) => [String(product._id), product]));

  return list.flatMap((item) => {
    const id = String(item.product || item.productId || item.id || '');
    const product = byId.get(id);
    if (!product) return [];
    return [{
      product: product._id,
      seller: product.seller,
      quantity: Math.max(1, Number(item.quantity) || 1),
      price: salePriceOf(product)
    }];
  });
};

const shopNameOf = async (sellerId) => {
  if (!sellerId) return '';
  const shop = await Seller.findOne({ user: sellerId }).select('magazaAdi');
  return shop?.magazaAdi || 'bu atölye';
};

const evaluatePromo = async (rawCode, input) => {
  const code = normalizeCode(rawCode);
  if (!code) {
    return { ok: false, status: 400, mesaj: 'Bir kampanya kodu yaz.' };
  }
  if (code.startsWith('NIK10-')) {
    return { ok: false, status: 400, mesaj: 'Bu kişisel hoş geldin kodudur. Yukarıdaki alana yaz.' };
  }

  const promo = await PromoCode.findOne({ code });
  if (!promo || !promo.isActive) {
    return { ok: false, status: 400, mesaj: 'Bu kampanya kodu geçersiz veya süresi doldu.' };
  }

  const { subtotal, items } = normalizeEvaluateInput(input);
  const sellerScoped = Boolean(promo.seller);
  const shopName = sellerScoped ? await shopNameOf(promo.seller) : '';
  const base = eligibleSubtotalOf(promo, items, subtotal);

  if (sellerScoped && (!items.length || base <= 0)) {
    return {
      ok: false,
      status: 400,
      mesaj: `Bu kod yalnızca ${shopName} ürünlerinde geçerlidir. Sepette o atölyeden ürün yok.`
    };
  }

  const min = money(promo.minSubtotal);
  if (base < min) {
    return {
      ok: false,
      status: 400,
      mesaj: sellerScoped
        ? `Bu kod ${shopName} ürünlerinde ${min.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ve üzeri alışverişte geçerlidir.`
        : `Bu kod ${min.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ve üzeri siparişlerde geçerlidir.`
    };
  }

  const minLabel = min.toLocaleString('tr-TR', { minimumFractionDigits: 0 });
  return {
    ok: true,
    promo,
    kod: promo.code,
    indirimOrani: promo.percent,
    indirim: promoDiscountOf(base, promo.percent),
    minSubtotal: min,
    eligibleSubtotal: base,
    sellerScoped,
    sellerId: sellerScoped ? String(promo.seller) : null,
    shopName,
    mesaj: sellerScoped
      ? (min > 0
        ? `${shopName} ürünlerinde ${minLabel} ₺ üzeri %${promo.percent} indirim uygulandı.`
        : `${shopName} ürünlerinde %${promo.percent} indirim uygulandı.`)
      : (min > 0
        ? `${minLabel} ₺ üzeri %${promo.percent} indirim uygulandı.`
        : `%${promo.percent} kampanya indirimi uygulandı.`)
  };
};

module.exports = {
  normalizeCode,
  promoDiscountOf,
  evaluatePromo,
  resolvePromoItems
};
