export const FREE_SHIPPING_LIMIT = 500;
export const SHIPPING_FEE = 49.9;
export const RETURN_DAYS = 14;

const formatPrice = (value) =>
  Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const parseDimensions = (sizes = []) => {
  const tokens = (Array.isArray(sizes) ? sizes : [sizes]).map((item) => String(item || '').trim()).filter(Boolean);
  const found = [];

  tokens.forEach((token) => {
    const match = token.match(
      /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*(cm)?/i
    );
    if (match) {
      const parts = [match[1], match[2], match[3]].filter(Boolean).map((part) => part.replace('.', ','));
      found.push({ label: 'Ölçü', value: `${parts.join(' × ')} cm` });
    }
  });

  return found;
};

export const buildFulfillment = (product = {}) => {
  if (product.fulfillment?.delivery && product.fulfillment?.shipping && product.fulfillment?.returns) {
    return {
      ...product.fulfillment,
      measures: Array.isArray(product.fulfillment.measures) ? product.fulfillment.measures : []
    };
  }

  const ready = product.immediateDelivery !== false;
  const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
  const dims = product.dimensions || {};
  const measures = [];

  if (dims.widthCm || dims.heightCm || dims.depthCm) {
    const parts = [dims.widthCm, dims.heightCm, dims.depthCm].filter((n) => n != null && n !== '');
    measures.push({ label: 'Ölçü', value: `${parts.join(' × ')} cm` });
  } else {
    measures.push(...parseDimensions(sizes));
  }

  if (dims.strapCm) measures.push({ label: 'Sap', value: `${dims.strapCm} cm` });
  if (dims.weightG) measures.push({ label: 'Ağırlık', value: `${dims.weightG} g` });
  if (dims.fits) measures.push({ label: 'Sığanlar', value: dims.fits });
  if (product.measureNote) measures.push({ label: 'Kullanım', value: product.measureNote });
  if (!measures.length && sizes.length) {
    measures.push({ label: 'Beden / ölçü', value: sizes.join(', ') });
  }

  return {
    delivery: ready
      ? {
          kind: 'ready',
          title: 'Hemen kargoda',
          detail: 'Sipariş onayından sonra 24 saat içinde kargoya verilir.',
          time: '1 iş günü'
        }
      : {
          kind: 'custom',
          title: 'Sipariş üzerine üretim',
          detail: `Atölye bu parçayı senin siparişinle hazırlar. Üretim süresi: ${product.customProductionTime || '1-3 iş günü'}.`,
          time: product.customProductionTime || '1-3 iş günü'
        },
    shipping: {
      freeFrom: FREE_SHIPPING_LIMIT,
      fee: SHIPPING_FEE,
      title: `${formatPrice(FREE_SHIPPING_LIMIT)} ₺ ve üzeri kargo bedava`,
      detail: `${formatPrice(FREE_SHIPPING_LIMIT)} ₺ altındaki siparişlerde kargo ${formatPrice(SHIPPING_FEE)} ₺.`
    },
    returns: {
      days: RETURN_DAYS,
      title: `${RETURN_DAYS} gün içinde iade`,
      detail: ready
        ? 'Kullanılmamış ürünleri 14 gün içinde ücretsiz iade edebilirsin.'
        : 'Kişiye özel üretimde iade, kullanılmamış ve kişiselleştirilmemiş ürünlerde geçerlidir.'
    },
    measures
  };
};
