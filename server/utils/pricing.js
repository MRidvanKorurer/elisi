const MIN_PRICE = 1;
const MAX_DISCOUNT = 90;

const PRICE_MESSAGE = 'Fiyat en az 1 ₺ olmalı.';
const DISCOUNT_MESSAGE = 'İndirim %0 ile %90 arasında olmalı.';
const UNSALEABLE_MESSAGE = 'Bir ürünün satış fiyatı geçersiz. Fiyat en az 1 ₺, indirim en fazla %90 olabilir.';

const money = (value) => Number(Number(value || 0).toFixed(2));

const readListPrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price < MIN_PRICE) return null;
  return money(price);
};

const readDiscount = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const discount = Number(value);
  if (!Number.isFinite(discount) || discount < 0 || discount > MAX_DISCOUNT) return null;
  return money(discount);
};

const unitPriceOf = (product) => {
  const list = Number(product?.price);
  const discount = Number(product?.discountPercentage || 0);
  if (!Number.isFinite(list) || list < MIN_PRICE) return 0;
  if (!Number.isFinite(discount) || discount < 0 || discount > MAX_DISCOUNT) return 0;
  if (discount <= 0) return money(list);
  return money(list - (list * discount / 100));
};

const isSellablePrice = (product) => unitPriceOf(product) > 0;

module.exports = {
  MIN_PRICE,
  MAX_DISCOUNT,
  PRICE_MESSAGE,
  DISCOUNT_MESSAGE,
  UNSALEABLE_MESSAGE,
  readListPrice,
  readDiscount,
  unitPriceOf,
  isSellablePrice
};
