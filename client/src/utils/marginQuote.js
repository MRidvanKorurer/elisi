export const DEFAULT_MARKUP = 0.25;
export const DEFAULT_SHIPPING_COST = 0;

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

export const nicePrice = (value) => {
  const n = Number(value) || 0;
  if (n <= 0) return 0;
  if (n < 50) return Math.ceil(n);
  if (n < 200) return Math.ceil(n / 5) * 5;
  return Math.ceil(n / 10) * 10;
};

export const quoteMargin = ({
  cost = 0,
  shipping = 0,
  extra = 0,
  price = 0,
  commissionPercent = 10,
  markup = DEFAULT_MARKUP
} = {}) => {
  const productCost = Math.max(0, Number(cost) || 0);
  const shippingCost = Math.max(0, Number(shipping) || 0);
  const extraCost = Math.max(0, Number(extra) || 0);
  const rate = Math.min(80, Math.max(0, Number(commissionPercent) || 0)) / 100;
  const keep = Math.max(0.01, 1 - rate);
  const base = roundMoney(productCost + shippingCost + extraCost);
  const breakEven = base > 0 ? roundMoney(base / keep) : 0;
  const suggestedRaw = breakEven > 0 ? breakEven * (1 + markup) : 0;
  const suggested = nicePrice(suggestedRaw);
  const sale = Math.max(0, Number(price) || 0);
  const commission = roundMoney(sale * rate);
  const net = roundMoney(sale - commission);
  const profit = roundMoney(net - base);
  const profitRate = sale > 0 ? Math.round((profit / sale) * 1000) / 10 : 0;

  return {
    productCost: roundMoney(productCost),
    shippingCost: roundMoney(shippingCost),
    extraCost: roundMoney(extraCost),
    base,
    rate,
    commissionPercent: roundMoney(rate * 100),
    breakEven,
    suggested,
    sale: roundMoney(sale),
    commission,
    net,
    profit,
    profitRate,
    belowCost: sale > 0 && sale < breakEven
  };
};
