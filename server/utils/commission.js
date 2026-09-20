const PLATFORM_COMMISSION_PERCENT = 10;
const VOLUME_WINDOW_DAYS = 90;
const VOLUME_THRESHOLD = 50000;
const VOLUME_RATE = 8;

const money = (value) => Math.round(Number(value || 0) * 100) / 100;

const sellerIdOf = (value) => {
  if (!value) return '';
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const clampCommissionPercent = (value, fallback = PLATFORM_COMMISSION_PERCENT) => {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(80, Math.max(0, Math.round(n * 10) / 10));
};

const rateOf = (rates, sellerId, fallback = PLATFORM_COMMISSION_PERCENT) => {
  if (rates == null) return fallback;
  if (typeof rates === 'number') return clampCommissionPercent(rates, fallback);
  if (rates instanceof Map) return clampCommissionPercent(rates.get(String(sellerId)), fallback);
  if (typeof rates === 'object') {
    return clampCommissionPercent(
      rates[String(sellerId)] ?? rates.get?.(String(sellerId)),
      fallback
    );
  }
  return fallback;
};

const feeOf = (gross, percent = PLATFORM_COMMISSION_PERCENT) =>
  money((Number(gross) || 0) * clampCommissionPercent(percent) / 100);

const lineGrossOf = (item) =>
  money((Number(item?.price) || 0) * (Number(item?.quantity) || 1));

const volumeMeta = (gmv = 0) => {
  const amount = money(gmv);
  return {
    gmv: amount,
    threshold: VOLUME_THRESHOLD,
    windowDays: VOLUME_WINDOW_DAYS,
    volumeRate: VOLUME_RATE,
    defaultRate: PLATFORM_COMMISSION_PERCENT,
    qualifies: amount >= VOLUME_THRESHOLD,
    remaining: money(Math.max(0, VOLUME_THRESHOLD - amount))
  };
};

const effectiveCommissionPercent = (seller, trailingGmv = 0) => {
  if (seller?.komisyonManuel) {
    return clampCommissionPercent(seller.komisyonOrani);
  }
  return trailingGmv >= VOLUME_THRESHOLD ? VOLUME_RATE : PLATFORM_COMMISSION_PERCENT;
};

const sellerLineGross = (items = [], sellerId) =>
  money(
    (items || [])
      .filter((item) => sellerIdOf(item.seller) === String(sellerId))
      .reduce((sum, item) => sum + lineGrossOf(item), 0)
  );

const sellerDiscountOf = (order, sellerId) => {
  const allocated = allocateOrderDiscounts(order?.orderItems, {
    couponDiscount: order?.couponDiscount,
    promoDiscount: order?.promoDiscount,
    promoSellerId: order?.promoSeller
  });
  return money(allocated[String(sellerId)] || 0);
};

const allocateOrderDiscounts = (items = [], {
  couponDiscount = 0,
  promoDiscount = 0,
  promoSellerId = ''
} = {}) => {
  const discounts = {};
  const promoSid = sellerIdOf(promoSellerId);
  if (promoSid && Number(promoDiscount) > 0) {
    discounts[promoSid] = money(promoDiscount);
  }

  const coupon = money(couponDiscount);
  if (coupon <= 0) return discounts;

  const bySeller = new Map();
  let total = 0;
  (items || []).forEach((item) => {
    const sid = sellerIdOf(item.seller);
    if (!sid) return;
    const gross = lineGrossOf(item);
    bySeller.set(sid, money((bySeller.get(sid) || 0) + gross));
    total = money(total + gross);
  });
  if (total <= 0) return discounts;

  const sellers = [...bySeller.keys()];
  let allocated = 0;
  sellers.forEach((sid, index) => {
    const share = index === sellers.length - 1
      ? money(Math.max(0, coupon - allocated))
      : money((bySeller.get(sid) / total) * coupon);
    allocated = money(allocated + share);
    discounts[sid] = money((discounts[sid] || 0) + share);
  });
  return discounts;
};

const settlementsFromItems = (items = [], rates, discounts = {}, shippingCost = 0) => {
  const map = new Map();
  (items || []).forEach((item) => {
    const sid = sellerIdOf(item.seller);
    if (!sid) return;
    const current = map.get(sid) || { seller: sid, goods: 0 };
    current.goods = money(current.goods + lineGrossOf(item));
    map.set(sid, current);
  });
  const rows = [...map.values()].map((row) => {
    const discount = money(discounts[row.seller] || discounts.get?.(row.seller) || 0);
    return {
      seller: row.seller,
      goods: money(Math.max(0, row.goods - discount))
    };
  });
  const goodsTotal = money(rows.reduce((sum, row) => sum + row.goods, 0));
  const shipping = money(shippingCost) > 0 ? money(shippingCost) : 0;
  let shipped = 0;
  return rows.map((row, index) => {
    let shippingShare = 0;
    if (shipping > 0) {
      if (goodsTotal > 0) {
        shippingShare = index === rows.length - 1
          ? money(shipping - shipped)
          : money((row.goods / goodsTotal) * shipping);
      } else {
        shippingShare = index === rows.length - 1
          ? money(shipping - shipped)
          : money(shipping / rows.length);
      }
      shipped = money(shipped + shippingShare);
    }
    const percent = rateOf(rates, row.seller);
    const gross = money(row.goods + shippingShare);
    const fee = feeOf(gross, percent);
    return {
      seller: row.seller,
      percent,
      goods: row.goods,
      shipping: shippingShare,
      gross,
      fee,
      net: money(gross - fee)
    };
  });
};

const resolveCommission = (order) => {
  const fallbackPercent = order?.platformFeePercent != null && order.platformFeePercent !== ''
    ? clampCommissionPercent(order.platformFeePercent)
    : PLATFORM_COMMISSION_PERCENT;
  const discounts = allocateOrderDiscounts(order?.orderItems, {
    couponDiscount: order?.couponDiscount,
    promoDiscount: order?.promoDiscount,
    promoSellerId: order?.promoSeller
  });
  const storedRows = Array.isArray(order?.sellerSettlements) ? order.sellerSettlements : [];
  const rateMap = {};
  const storedStatus = new Map();
  storedRows.forEach((row) => {
    const sid = sellerIdOf(row.seller);
    if (!sid) return;
    if (row.percent != null && row.percent !== '') rateMap[sid] = row.percent;
    storedStatus.set(sid, row.payoutStatus === 'paid' ? 'paid' : 'pending');
  });
  const settlements = settlementsFromItems(
    order?.orderItems,
    Object.keys(rateMap).length ? rateMap : fallbackPercent,
    discounts,
    order?.shippingCost
  ).map((row) => ({
    ...row,
    payoutStatus: storedStatus.get(row.seller) || 'pending'
  }));
  const fee = money(settlements.reduce((sum, row) => sum + row.fee, 0));
  const gross = money(settlements.reduce((sum, row) => sum + row.gross, 0));
  return {
    percent: fallbackPercent,
    fee,
    gross,
    net: money(settlements.reduce((sum, row) => sum + row.net, 0)),
    settlements
  };
};

const sellerSettlementOf = (order, sellerId) => {
  const { settlements, percent } = resolveCommission(order);
  const match = settlements.find((row) => row.seller === String(sellerId));
  if (match) return { ...match, percent: match.percent ?? percent };
  const discounts = allocateOrderDiscounts(order?.orderItems, {
    couponDiscount: order?.couponDiscount,
    promoDiscount: order?.promoDiscount,
    promoSellerId: order?.promoSeller
  });
  const row = settlementsFromItems(order?.orderItems, percent, discounts, order?.shippingCost)
    .find((item) => item.seller === String(sellerId));
  return row
    ? { ...row, percent: row.percent ?? percent }
    : { seller: String(sellerId || ''), percent, gross: 0, fee: 0, net: 0 };
};

const volumeWindowStart = (before = new Date()) => {
  const from = new Date(before);
  from.setDate(from.getDate() - VOLUME_WINDOW_DAYS);
  return from;
};

const trailingGmvBySellers = async (sellerIds = [], before = new Date()) => {
  const ids = [...new Set((sellerIds || []).map(String).filter(Boolean))];
  const map = new Map(ids.map((id) => [id, 0]));
  if (!ids.length) return map;

  const mongoose = require('mongoose');
  const Order = require('../models/Order');
  const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
  const rows = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'completed',
        orderStatus: { $ne: 'cancelled' },
        createdAt: { $gte: volumeWindowStart(before), $lt: before }
      }
    },
    {
      $addFields: {
        rows: {
          $cond: [
            { $gt: [{ $size: { $ifNull: ['$sellerSettlements', []] } }, 0] },
            {
              $map: {
                input: '$sellerSettlements',
                as: 'row',
                in: { seller: '$$row.seller', gross: { $ifNull: ['$$row.gross', 0] } }
              }
            },
            {
              $map: {
                input: { $ifNull: ['$orderItems', []] },
                as: 'item',
                in: {
                  seller: '$$item.seller',
                  gross: { $multiply: [{ $ifNull: ['$$item.price', 0] }, { $ifNull: ['$$item.quantity', 0] }] }
                }
              }
            }
          ]
        }
      }
    },
    { $unwind: '$rows' },
    { $match: { 'rows.seller': { $in: objectIds } } },
    { $group: { _id: '$rows.seller', gmv: { $sum: '$rows.gross' } } }
  ]);

  rows.forEach((row) => {
    map.set(String(row._id), money(row.gmv));
  });
  return map;
};

const trailingSellerGmv = async (sellerId, before = new Date()) => {
  const map = await trailingGmvBySellers([sellerId], before);
  return map.get(String(sellerId)) || 0;
};

const sellerUserId = (seller) => {
  const user = seller?.user;
  if (user && typeof user === 'object' && user._id) return String(user._id);
  if (user) return String(user);
  return String(seller?._id || '');
};

const ratesForSellers = async (sellers = [], before = new Date()) => {
  const list = (sellers || []).filter(Boolean);
  const volumes = await trailingGmvBySellers(list.map(sellerUserId), before);
  const rates = {};
  list.forEach((seller) => {
    const sid = sellerUserId(seller);
    if (!sid) return;
    rates[sid] = effectiveCommissionPercent(seller, volumes.get(sid) || 0);
  });
  return { rates, volumes };
};

module.exports = {
  PLATFORM_COMMISSION_PERCENT,
  VOLUME_WINDOW_DAYS,
  VOLUME_THRESHOLD,
  VOLUME_RATE,
  money,
  feeOf,
  clampCommissionPercent,
  rateOf,
  settlementsFromItems,
  allocateOrderDiscounts,
  resolveCommission,
  sellerSettlementOf,
  sellerLineGross,
  sellerDiscountOf,
  volumeMeta,
  effectiveCommissionPercent,
  trailingGmvBySellers,
  trailingSellerGmv,
  ratesForSellers
};
