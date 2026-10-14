import i18n from '../i18n';
import { money } from './currency';

export const FREE_SHIPPING_LIMIT = 1000;
export const SHIPPING_FEE = 100;
export const RETURN_DAYS = 14;

const isEn = () => i18n.language === 'en';

const formatPrice = (value) =>
  Number(value || 0).toLocaleString(isEn() ? 'en-US' : 'tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const TEXT = {
  tr: {
    freeShipping: (limit) => `${limit} ₺ ve üzeri kargo bedava`,
    shippingDetail: (limit, fee) => `${limit} ₺ altındaki siparişlerde kargo ${fee} ₺.`,
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
    returnsTitle: (days) => `${days} gün içinde iade`,
    returnsReady: (days) => `Kullanılmamış ürünleri ${days} gün içinde ücretsiz iade edebilirsin.`,
    returnsCustom: 'Kişiye özel üretimde iade, kullanılmamış ve kişiselleştirilmemiş ürünlerde geçerlidir.'
  },
  en: {
    freeShipping: (limit) => `Free shipping on orders of ${limit} or more`,
    shippingDetail: (limit, fee) => `Shipping is ${fee} on orders under ${limit}.`,
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
    returnsTitle: (days) => `${days}-day returns`,
    returnsReady: (days) => `Return unused items free of charge within ${days} days.`,
    returnsCustom: 'Made-to-order pieces can be returned if unused and not personalized.'
  }
};

const text = () => (isEn() ? TEXT.en : TEXT.tr);

const siteShipping = () => ({
  freeFrom: FREE_SHIPPING_LIMIT,
  fee: SHIPPING_FEE,
  title: isEn()
    ? text().freeShipping(money(FREE_SHIPPING_LIMIT))
    : text().freeShipping(formatPrice(FREE_SHIPPING_LIMIT)),
  detail: isEn()
    ? text().shippingDetail(money(FREE_SHIPPING_LIMIT), money(SHIPPING_FEE))
    : text().shippingDetail(formatPrice(FREE_SHIPPING_LIMIT), formatPrice(SHIPPING_FEE))
});

const parseDimensions = (sizes = []) => {
  const tokens = (Array.isArray(sizes) ? sizes : [sizes]).map((item) => String(item || '').trim()).filter(Boolean);
  const found = [];

  tokens.forEach((token) => {
    const match = token.match(
      /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*(cm)?/i
    );
    if (match) {
      const parts = [match[1], match[2], match[3]].filter(Boolean).map((part) => part.replace('.', ','));
      found.push({ label: text().size, value: `${parts.join(' × ')} cm` });
    }
  });

  return found;
};

export const buildFulfillment = (product = {}) => {
  if (product.fulfillment?.delivery && product.fulfillment?.shipping && product.fulfillment?.returns) {
    return {
      ...product.fulfillment,
      shipping: siteShipping(),
      measures: Array.isArray(product.fulfillment.measures) ? product.fulfillment.measures : []
    };
  }

  const copy = text();
  const ready = product.immediateDelivery !== false;
  const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
  const dims = product.dimensions || {};
  const measures = [];

  if (dims.widthCm || dims.heightCm || dims.depthCm) {
    const parts = [dims.widthCm, dims.heightCm, dims.depthCm].filter((n) => n != null && n !== '');
    measures.push({ label: copy.size, value: `${parts.join(' × ')} cm` });
  } else {
    measures.push(...parseDimensions(sizes));
  }

  if (dims.strapCm) measures.push({ label: copy.strap, value: `${dims.strapCm} cm` });
  if (dims.weightG) measures.push({ label: copy.weight, value: `${dims.weightG} g` });
  if (dims.fits) measures.push({ label: copy.fits, value: dims.fits });
  if (product.measureNote) measures.push({ label: copy.use, value: product.measureNote });
  if (!measures.length && sizes.length) {
    measures.push({ label: copy.sizeOrMeasure, value: sizes.join(', ') });
  }

  const productionTime = product.customProductionTime || copy.customTime;

  return {
    delivery: ready
      ? { kind: 'ready', title: copy.readyTitle, detail: copy.readyDetail, time: copy.readyTime }
      : { kind: 'custom', title: copy.customTitle, detail: copy.customDetail(productionTime), time: productionTime },
    shipping: siteShipping(),
    returns: {
      days: RETURN_DAYS,
      title: copy.returnsTitle(RETURN_DAYS),
      detail: ready ? copy.returnsReady(RETURN_DAYS) : copy.returnsCustom
    },
    measures
  };
};
