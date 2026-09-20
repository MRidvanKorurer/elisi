import { FREE_SHIPPING_LIMIT, SHIPPING_FEE } from './shipping';

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

export const buyerShippingOf = (sale = 0) =>
  roundMoney(sale) >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_FEE;

export const quoteMargin = ({
  cost = 0,
  shipping = 0,
  extra = 0,
  price = 0,
  discountPercentage = 0,
  commissionPercent = 10,
  markup = DEFAULT_MARKUP
} = {}) => {
  const productCost = Math.max(0, Number(cost) || 0);
  const sellerShipCost = Math.max(0, Number(shipping) || 0);
  const extraCost = Math.max(0, Number(extra) || 0);
  const rate = Math.min(80, Math.max(0, Number(commissionPercent) || 0)) / 100;
  const keep = Math.max(0.01, 1 - rate);
  const costBase = roundMoney(productCost + sellerShipCost + extraCost);
  const breakEven = costBase > 0 ? roundMoney(costBase / keep) : 0;
  const suggestedRaw = breakEven > 0 ? breakEven * (1 + markup) : 0;
  const suggested = nicePrice(suggestedRaw);
  const list = Math.max(0, Number(price) || 0);
  const discount = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const sale = discount > 0 ? roundMoney(list - (list * discount) / 100) : roundMoney(list);
  const buyerShipping = buyerShippingOf(sale);
  const charged = roundMoney(sale + buyerShipping);
  const commission = roundMoney(charged * rate);
  const net = roundMoney(charged - commission);
  const profit = roundMoney(net - costBase);
  const profitRate = charged > 0 ? Math.round((profit / charged) * 1000) / 10 : 0;

  return {
    productCost: roundMoney(productCost),
    shippingCost: roundMoney(sellerShipCost),
    extraCost: roundMoney(extraCost),
    buyerShipping,
    freeShippingLimit: FREE_SHIPPING_LIMIT,
    base: costBase,
    rate,
    commissionPercent: roundMoney(rate * 100),
    breakEven,
    suggested,
    sale,
    charged,
    list: roundMoney(list),
    discount,
    commission,
    net,
    profit,
    profitRate,
    belowCost: charged > 0 && net < costBase
  };
};
