import i18n from '../i18n';
import { dateLocale } from '../i18n/locale';

export const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

export const formatTRY = (value) =>
  roundMoney(value).toLocaleString(dateLocale(i18n.language), { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const salePriceOf = (product) => {
  const list = Number(product?.price ?? product?.fiyat ?? 0);
  const discount = Number(product?.discountPercentage ?? product?.indirimOrani ?? 0);
  if (discount > 0) return roundMoney(list - (list * discount) / 100);
  if (product?.finalPrice != null && product.finalPrice !== '') return roundMoney(product.finalPrice);
  return roundMoney(list);
};

export const lineTotalOf = (item) =>
  roundMoney(Number(item?.price || 0) * Number(item?.quantity || 1));

export const orderChargeRows = (order) => {
  const items = order?.orderItems || [];
  const subtotal = roundMoney(
    order?.subtotal != null && order.subtotal !== ''
      ? order.subtotal
      : items.reduce((sum, item) => sum + lineTotalOf(item), 0)
  );
  const couponDiscount = roundMoney(order?.couponDiscount || 0);
  const promoDiscount = roundMoney(order?.promoDiscount || 0);
  const shipping = roundMoney(order?.shippingCost || 0);
  const total = roundMoney(
    order?.totalPrice != null && order.totalPrice !== ''
      ? order.totalPrice
      : Math.max(0, subtotal - couponDiscount - promoDiscount) + shipping
  );

  const t = (key, defaultValue, options = {}) => i18n.t(`charges.${key}`, { ns: 'checkout', defaultValue, ...options });
  const percentLabel = (value) => (i18n.language === 'en' ? `${value}%` : `%${value}`);

  const rows = [{ label: t('subtotal', 'Ara toplam'), value: subtotal }];
  if (couponDiscount > 0) {
    const bits = [];
    if (order.couponPercent) bits.push(percentLabel(order.couponPercent));
    if (order.couponCode) bits.push(order.couponCode);
    rows.push({
      label: bits.length
        ? t('welcomeWith', 'Hoş geldin ({{detail}})', { detail: bits.join(' · ') })
        : t('welcome', 'Hoş geldin indirimi'),
      value: -couponDiscount,
      accent: true
    });
  }
  if (promoDiscount > 0) {
    const bits = [];
    if (order.promoPercent) bits.push(percentLabel(order.promoPercent));
    if (order.promoCode) bits.push(order.promoCode);
    rows.push({
      label: bits.length
        ? t('promoWith', 'Kampanya ({{detail}})', { detail: bits.join(' · ') })
        : t('promo', 'Kampanya indirimi'),
      value: -promoDiscount,
      accent: true
    });
  }
  rows.push({
    label: t('shipping', 'Kargo'),
    value: shipping,
    free: shipping === 0
  });
  rows.push({ label: t('total', 'Toplam'), value: total, total: true });
  return rows;
};

export const sellerShareDisplay = (order) => {
  const percent = Number(order?.commissionPercent) || 10;
  const goods = roundMoney(Math.max(0, Number(order?.sellerTotal || 0) - Number(order?.sellerPromoDiscount || 0)));
  const shipping = roundMoney(Number(order?.shippingCost || 0));
  let gross = roundMoney(Number(order?.sellerGross || 0));
  if (shipping > 0 && !order?.mixedCart && gross <= goods + 0.05) {
    gross = roundMoney(goods + shipping);
  }
  if (gross <= 0) {
    gross = roundMoney(goods + (order?.mixedCart ? 0 : shipping));
  }
  const fee = roundMoney(gross * (percent / 100));
  return {
    percent,
    goods,
    shipping,
    gross,
    fee,
    net: roundMoney(gross - fee)
  };
};

export const platformShareOf = (order) => {
  const items = order?.orderItems || [];
  const subtotal = roundMoney(
    order?.subtotal != null && order.subtotal !== ''
      ? order.subtotal
      : items.reduce((sum, item) => sum + lineTotalOf(item), 0)
  );
  const shipping = roundMoney(Number(order?.shippingCost || 0));
  const paid = roundMoney(
    order?.totalPrice != null && order.totalPrice !== ''
      ? Number(order.totalPrice)
      : Math.max(0, subtotal - Number(order?.couponDiscount || 0) - Number(order?.promoDiscount || 0)) + (shipping > 0 ? shipping : 0)
  );
  const percent = Number(order?.platformFeePercent) || 10;
  const fee = roundMoney(paid * (percent / 100));
  return {
    percent,
    gross: paid,
    fee,
    net: roundMoney(paid - fee)
  };
};


