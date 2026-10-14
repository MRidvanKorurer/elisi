const { translatePattern } = require('../i18n/contentGlossary');

const FREE_SHIPPING_LIMIT = 1000;
const SHIPPING_FEE = 100;
const RETURN_DAYS = 14;

const formatPrice = (value, lang = 'tr') =>
  Number(value || 0).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const TEXT = {
  tr: {
    size: 'Ölçü',
    strap: 'Sap',
    weight: 'Ağırlık',
    fits: 'Sığanlar',
    use: 'Kullanım',
    sizeOrMeasure: 'Beden / ölçü',
    readyTitle: 'Hemen kargoda',
    readyDetail: 'Sipariş onayından sonra 24 saat içinde kargoya verilir.',
    readyTime: '1 iş günü',
    customTitle: 'Sipariş üzerine üretim',
    customDetail: (time) => `Atölye bu parçayı senin siparişinle hazırlar. Üretim süresi: ${time}.`,
    customTime: '1-3 iş günü',
    freeShipping: (limit) => `${limit} ₺ ve üzeri kargo bedava`,
    shippingDetail: (limit, fee) => `${limit} ₺ altındaki siparişlerde kargo ${fee} ₺.`,
    returnsTitle: (days) => `${days} gün içinde iade`,
    returnsReady: (days) => `Kullanılmamış ürünleri ${days} gün içinde ücretsiz iade edebilirsin.`,
    returnsCustom: 'Kişiye özel üretimde iade, kullanılmamış ve kişiselleştirilmemiş ürünlerde geçerlidir.'
  },
  en: {
    size: 'Size',
    strap: 'Strap',
    weight: 'Weight',
    fits: 'Fits',
    use: 'Use',
    sizeOrMeasure: 'Size / measurements',
    readyTitle: 'Ships right away',
    readyDetail: 'Handed to the courier within 24 hours of order confirmation.',
    readyTime: '1 business day',
    customTitle: 'Made to order',
    customDetail: (time) => `The atelier makes this piece for your order. Production time: ${time}.`,
    customTime: '1-3 business days',
    freeShipping: (limit) => `Free shipping on orders of ₺${limit} or more`,
    shippingDetail: (limit, fee) => `Shipping is ₺${fee} on orders under ₺${limit}.`,
    returnsTitle: (days) => `${days}-day returns`,
    returnsReady: (days) => `Return unused items free of charge within ${days} days.`,
    returnsCustom: 'Made-to-order pieces can be returned if unused and not personalized.'
  }
};

const productionTimeEn = (value = '') => translatePattern(value) || String(value || '').trim() || TEXT.en.customTime;

const parseDimensions = (sizes = [], text) => {
  const tokens = (Array.isArray(sizes) ? sizes : [sizes]).map((item) => String(item || '').trim()).filter(Boolean);
  const found = [];

  tokens.forEach((token) => {
    const match = token.match(
      /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*(cm)?/i
    );
    if (match) {
      const parts = [match[1], match[2], match[3]].filter(Boolean).map((part) => part.replace('.', ','));
      found.push({ label: text.size, value: `${parts.join(' × ')} cm` });
    }
  });

  return found;
};

const buildFulfillment = (product = {}, lang = 'tr') => {
  const text = TEXT[lang] || TEXT.tr;
  const ready = product.immediateDelivery !== false;
  const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
  const dims = product.dimensions || {};
  const measures = [];

  if (dims.widthCm || dims.heightCm || dims.depthCm) {
    const parts = [dims.widthCm, dims.heightCm, dims.depthCm].filter((n) => n != null && n !== '');
    measures.push({ label: text.size, value: `${parts.join(' × ')} cm` });
  } else {
    measures.push(...parseDimensions(sizes, text));
  }

  if (dims.strapCm) measures.push({ label: text.strap, value: `${dims.strapCm} cm` });
  if (dims.weightG) measures.push({ label: text.weight, value: `${dims.weightG} g` });
  if (dims.fits) measures.push({ label: text.fits, value: dims.fits });
  if (product.measureNote) measures.push({ label: text.use, value: product.measureNote });

  if (!measures.length && sizes.length) {
    measures.push({ label: text.sizeOrMeasure, value: sizes.join(', ') });
  }

  const rawTime = product.customProductionTime || '';
  const productionTime = lang === 'en'
    ? (rawTime ? productionTimeEn(rawTime) : text.customTime)
    : (rawTime || text.customTime);
  const limit = formatPrice(FREE_SHIPPING_LIMIT, lang);
  const fee = formatPrice(SHIPPING_FEE, lang);

  return {
    delivery: ready
      ? { kind: 'ready', title: text.readyTitle, detail: text.readyDetail, time: text.readyTime }
      : { kind: 'custom', title: text.customTitle, detail: text.customDetail(productionTime), time: productionTime },
    shipping: {
      freeFrom: FREE_SHIPPING_LIMIT,
      fee: SHIPPING_FEE,
      title: text.freeShipping(limit),
      detail: text.shippingDetail(limit, fee)
    },
    returns: {
      days: RETURN_DAYS,
      title: text.returnsTitle(RETURN_DAYS),
      detail: ready ? text.returnsReady(RETURN_DAYS) : text.returnsCustom
    },
    measures
  };
};

module.exports = {
  FREE_SHIPPING_LIMIT,
  SHIPPING_FEE,
  RETURN_DAYS,
  formatPrice,
  buildFulfillment
};
