const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const ProductQuestion = require('../models/ProductQuestion');
const PromoCode = require('../models/PromoCode');
const FeaturedRequest = require('../models/FeaturedRequest');
const AdEvent = require('../models/AdEvent');
const { CATEGORY_LABELS } = require('../constants/categories');
const { sellerStatusOf } = require('../utils/orderFulfillment');
const {
  emptyOps,
  timingOf,
  addTimingToOps,
  summarizeOps,
  LATE_SHIP_DAYS
} = require('../utils/fulfillmentTiming');

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const isoDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};
const isoMonth = (value) => isoDay(value).slice(0, 7);
const bump = (map, key, seed, patch) => {
  const current = map.get(key) || seed(key);
  patch(current);
  map.set(key, current);
  return current;
};
const fillDaily = (from, to, map, extra = {}) => {
  const rows = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const last = new Date(to);
  last.setUTCHours(0, 0, 0, 0);
  while (cursor <= last) {
    const date = cursor.toISOString().slice(0, 10);
    const row = map.get(date) || { date, orders: 0, revenue: 0, qty: 0, cancelled: 0, ...extra };
    rows.push({ ...row, revenue: roundMoney(row.revenue || 0) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return rows;
};
const fillMonthly = (count, map) => {
  const rows = [];
  const cursor = new Date();
  cursor.setUTCDate(1);
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCMonth(cursor.getUTCMonth() - (count - 1));
  for (let i = 0; i < count; i += 1) {
    const month = cursor.toISOString().slice(0, 7);
    const row = map.get(month) || { month, orders: 0, revenue: 0, qty: 0, cancelled: 0, users: 0 };
    rows.push({ ...row, revenue: roundMoney(row.revenue || 0) });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return rows;
};
const sellerIdOf = (item) => {
  if (!item) return '';
  if (item.seller && typeof item.seller === 'object' && item.seller._id) return String(item.seller._id);
  return String(item.seller || '');
};

const getAdminReports = async (req, res) => {
  try {
    const now = new Date();
    const from30 = new Date(now);
    from30.setUTCDate(from30.getUTCDate() - 29);
    from30.setUTCHours(0, 0, 0, 0);

    const [users, sellers, products, orders, reviews, questions, promos, featured, adEvents] = await Promise.all([
      User.find({ rol: { $ne: 'superadmin' } }).select('adSoyad email rol createdAt').lean(),
      Seller.find().select('user magazaAdi durum sehir createdAt').lean(),
      Product.find().select('_id title category image stock price seller approvalStatus isActive rating numReviews soldCount isSponsored').lean(),
      Order.find().sort({ createdAt: 1 }).lean(),
      Review.find().lean(),
      ProductQuestion.find({ isPublic: true }).lean(),
      PromoCode.find().lean(),
      FeaturedRequest.find().sort({ createdAt: -1 }).lean(),
      AdEvent.find({ createdAt: { $gte: from30 } }).lean()
    ]);

    const shopByUser = new Map(sellers.map((item) => [String(item.user), item]));
    const productById = new Map(products.map((item) => [String(item._id), item]));
    const buyerOnly = users.filter((item) => item.rol === 'user');

    const dailyMap = new Map();
    const monthlyMap = new Map();
    const byStatus = { processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    const payStatus = {
      pending: { count: 0, revenue: 0 },
      completed: { count: 0, revenue: 0 },
      failed: { count: 0, revenue: 0 }
    };
    const payMethod = new Map();
    const customerMap = new Map();
    const cityMap = new Map();
    const sellerMap = new Map();
    const sellerOps = new Map();
    const platformOps = emptyOps();
    sellers.forEach((item) => {
      const sid = String(item.user);
      sellerMap.set(sid, {
        sellerId: sid,
        shop: item.magazaAdi || 'Mağaza',
        city: item.sehir || '',
        status: item.durum || 'unknown',
        orders: 0,
        revenue: 0,
        qty: 0
      });
      sellerOps.set(sid, emptyOps());
    });
    const categoryMap = new Map();
    const productSales = new Map();
    const promoSet = new Set(promos.map((item) => String(item.code || '').toUpperCase()).filter(Boolean));
    const promoStats = new Map(promos.map((item) => [String(item.code || '').toUpperCase(), {
      id: item._id,
      code: item.code,
      percent: item.percent,
      usedCount: item.usedCount || 0,
      isActive: item.isActive !== false,
      seller: item.seller ? (shopByUser.get(String(item.seller))?.magazaAdi || 'Platform') : 'Platform',
      orders: 0,
      revenue: 0,
      discount: 0
    }]));
    let promoOrders = 0;
    let promoRevenue = 0;
    let plainOrders = 0;
    let plainRevenue = 0;
    let gmv = 0;
    let collected = 0;
    let qtySold = 0;

    orders.forEach((order) => {
      const cancelled = order.orderStatus === 'cancelled';
      const items = order.orderItems || [];
      const qty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const revenue = Number(order.totalPrice || 0);
      const created = new Date(order.createdAt);
      const day = isoDay(created);
      const month = isoMonth(created);
      const status = byStatus[order.orderStatus] != null ? order.orderStatus : 'processing';
      byStatus[status] += 1;

      bump(dailyMap, day, (key) => ({ date: key, orders: 0, revenue: 0, qty: 0, cancelled: 0, users: 0 }), (row) => {
        if (cancelled) row.cancelled += 1;
        else {
          row.orders += 1;
          row.qty += qty;
          row.revenue += revenue;
        }
      });
      bump(monthlyMap, month, (key) => ({ month: key, orders: 0, revenue: 0, qty: 0, cancelled: 0, users: 0 }), (row) => {
        if (cancelled) row.cancelled += 1;
        else {
          row.orders += 1;
          row.qty += qty;
          row.revenue += revenue;
        }
      });

      const payKey = payStatus[order.paymentStatus] ? order.paymentStatus : 'pending';
      payStatus[payKey].count += 1;
      payStatus[payKey].revenue += cancelled ? 0 : revenue;
      bump(payMethod, order.paymentMethod || 'unknown', (key) => ({ method: key, count: 0, revenue: 0 }), (row) => {
        row.count += 1;
        if (!cancelled) row.revenue += revenue;
      });

      if (!cancelled) {
        gmv += revenue;
        qtySold += qty;
        if (order.paymentStatus === 'completed') collected += revenue;
      }

      const email = String(order.customerInfo?.email || '').trim().toLowerCase();
      const customerKey = email || String(order.customerInfo?.phone || order._id);
      const city = String(order.shippingAddress?.city || '').trim() || 'Belirtilmedi';
      bump(customerMap, customerKey, () => ({
        key: customerKey,
        email,
        name: `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Misafir',
        city,
        orders: 0,
        revenue: 0
      }), (row) => {
        row.orders += 1;
        if (!cancelled) row.revenue += revenue;
      });
      if (!cancelled) {
        bump(cityMap, city, (key) => ({ city: key, orders: 0, revenue: 0 }), (row) => {
          row.orders += 1;
          row.revenue += revenue;
        });
      }

      const code = String(order.promoCode || '').toUpperCase();
      if (!cancelled && promoSet.has(code) && promoStats.has(code)) {
        promoOrders += 1;
        promoRevenue += revenue;
        const row = promoStats.get(code);
        row.orders += 1;
        row.revenue += revenue;
        row.discount += Number(order.promoDiscount || 0);
      } else if (!cancelled) {
        plainOrders += 1;
        plainRevenue += revenue;
      }

      const countedSellers = new Set();
      const orderSellers = new Set();
      items.forEach((item) => {
        const sid = sellerIdOf(item) || sellerIdOf(productById.get(String(item.product)));
        const lineQty = Number(item.quantity) || 0;
        const lineRev = lineQty * Number(item.price || 0);
        if (sid) {
          orderSellers.add(sid);
          bump(sellerMap, sid, () => ({
            sellerId: sid,
            shop: shopByUser.get(sid)?.magazaAdi || 'Mağaza',
            city: shopByUser.get(sid)?.sehir || '',
            status: shopByUser.get(sid)?.durum || 'unknown',
            orders: 0,
            revenue: 0,
            qty: 0
          }), (row) => {
            if (!cancelled) {
              row.qty += lineQty;
              row.revenue += lineRev;
              if (!countedSellers.has(sid)) {
                row.orders += 1;
                countedSellers.add(sid);
              }
            }
          });
        }
        const product = productById.get(String(item.product));
        const cat = product?.category || 'diger';
        if (!cancelled) {
          bump(categoryMap, cat, () => ({
            category: cat,
            label: CATEGORY_LABELS[cat] || cat,
            qty: 0,
            revenue: 0,
            products: 0
          }), (row) => {
            row.qty += lineQty;
            row.revenue += lineRev;
          });
          bump(productSales, String(item.product || item.name), () => ({
            id: item.product,
            title: product?.title || item.name,
            image: product?.image || item.image || '',
            category: CATEGORY_LABELS[cat] || cat,
            shop: shopByUser.get(sid)?.magazaAdi || '',
            qty: 0,
            revenue: 0
          }), (row) => {
            row.qty += lineQty;
            row.revenue += lineRev;
          });
        }
      });
      orderSellers.forEach((sid) => {
        const timing = timingOf(order, sid);
        sellerOps.set(sid, addTimingToOps(sellerOps.get(sid), timing));
        addTimingToOps(platformOps, timing);
      });
    });

    products.forEach((product) => {
      const key = product.category || 'diger';
      bump(categoryMap, key, () => ({
        category: key,
        label: CATEGORY_LABELS[key] || key,
        qty: 0,
        revenue: 0,
        products: 0
      }), (row) => {
        row.products += 1;
      });
    });

    const signupDaily = new Map();
    buyerOnly.forEach((user) => {
      const day = isoDay(user.createdAt);
      const month = isoMonth(user.createdAt);
      bump(signupDaily, day, (key) => ({ date: key, users: 0 }), (row) => { row.users += 1; });
      bump(monthlyMap, month, (key) => ({ month: key, orders: 0, revenue: 0, qty: 0, cancelled: 0, users: 0 }), (row) => {
        row.users += 1;
      });
    });
    const daily = fillDaily(from30, now, dailyMap, { users: 0 }).map((row) => ({
      ...row,
      users: signupDaily.get(row.date)?.users || 0
    }));

    const customers = [...customerMap.values()].map((row) => ({ ...row, revenue: roundMoney(row.revenue), repeat: row.orders > 1 }));
    const repeatCustomers = customers.filter((row) => row.repeat);
    const firstCustomers = customers.filter((row) => !row.repeat);

    const sellerRows = [...sellerMap.values()]
      .map((row) => {
        const ops = summarizeOps(sellerOps.get(row.sellerId) || emptyOps());
        return {
          ...row,
          revenue: roundMoney(row.revenue),
          products: products.filter((item) => String(item.seller) === row.sellerId).length,
          avgDaysToShip: ops.avgDaysToShip,
          avgDaysToDeliver: ops.avgDaysToDeliver,
          avgWaiting: ops.avgWaiting,
          lateRate: ops.lateRate,
          cancelRate: ops.cancelRate,
          open: ops.open
        };
      })
      .sort((a, b) => b.revenue - a.revenue || a.avgDaysToShip - b.avgDaysToShip);
    const platformFulfillment = summarizeOps(platformOps);

    const sellerStatus = { pending: 0, approved: 0, rejected: 0, suspended: 0 };
    sellers.forEach((item) => {
      sellerStatus[item.durum] = (sellerStatus[item.durum] || 0) + 1;
    });

    const adDaily = new Map();
    const adByProduct = new Map();
    const adBySurface = new Map();
    adEvents.forEach((event) => {
      const day = isoDay(event.createdAt);
      bump(adDaily, day, (key) => ({ date: key, impressions: 0, clicks: 0 }), (row) => {
        if (event.type === 'impression') row.impressions += 1;
        else row.clicks += 1;
      });
      bump(adBySurface, event.surface || 'product', (key) => ({ surface: key, impressions: 0, clicks: 0 }), (row) => {
        if (event.type === 'impression') row.impressions += 1;
        else row.clicks += 1;
      });
      const pid = String(event.product || '');
      if (pid) {
        const product = productById.get(pid);
        bump(adByProduct, pid, () => ({
          id: pid,
          title: product?.title || 'Ürün',
          image: product?.image || '',
          shop: shopByUser.get(String(product?.seller))?.magazaAdi || '',
          impressions: 0,
          clicks: 0
        }), (row) => {
          if (event.type === 'impression') row.impressions += 1;
          else row.clicks += 1;
        });
      }
    });

    const adProductRows = [...adByProduct.values()]
      .map((row) => ({
        ...row,
        ctr: row.impressions > 0 ? Math.round((row.clicks / row.impressions) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);

    const featuredRows = featured.map((item) => {
      const product = productById.get(String(item.product));
      const start = item.startsAt ? new Date(item.startsAt) : new Date(item.createdAt);
      const end = item.endsAt ? new Date(item.endsAt) : new Date(start.getTime() + (Number(item.days) || 0) * 86400000);
      let revenue = 0;
      let qty = 0;
      orders.forEach((order) => {
        if (order.orderStatus === 'cancelled') return;
        const created = new Date(order.createdAt);
        if (created < start || created > end) return;
        (order.orderItems || []).forEach((line) => {
          if (String(line.product) !== String(item.product)) return;
          qty += Number(line.quantity) || 0;
          revenue += (Number(line.quantity) || 0) * Number(line.price || 0);
        });
      });
      const ads = adByProduct.get(String(item.product)) || { impressions: 0, clicks: 0, ctr: 0 };
      const spent = ['approved', 'removed'].includes(item.status) ? Number(item.price || 0) : 0;
      return {
        id: item._id,
        title: product?.title || 'Ürün',
        image: product?.image || '',
        shop: shopByUser.get(String(item.seller))?.magazaAdi || '',
        days: item.days,
        status: item.status,
        spent,
        revenue: roundMoney(revenue),
        qty,
        impressions: ads.impressions,
        clicks: ads.clicks,
        ctr: ads.impressions > 0 ? Math.round((ads.clicks / ads.impressions) * 1000) / 10 : 0,
        roi: spent > 0 ? Math.round(((revenue - spent) / spent) * 100) : null
      };
    });

    const impressions = adEvents.filter((item) => item.type === 'impression').length;
    const clicks = adEvents.filter((item) => item.type === 'click').length;
    const answered = questions.filter((item) => String(item.answer || '').trim());
    const ratingBuckets = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: reviews.filter((item) => Number(item.rating) === star).length
    }));

    const topProducts = [...productSales.values()]
      .map((row) => ({ ...row, revenue: roundMoney(row.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12);

    return res.json({
      success: true,
      report: {
        overview: {
          gmv: roundMoney(gmv),
          collected: roundMoney(collected),
          orders: orders.length,
          qty: qtySold,
          buyers: buyerOnly.length,
          sellers: sellers.length,
          products: products.length,
          pendingSellers: sellerStatus.pending || 0,
          pendingProducts: products.filter((item) => item.approvalStatus === 'pending').length
        },
        timeseries: {
          daily,
          monthly: fillMonthly(12, monthlyMap)
        },
        sellers: {
          byStatus: Object.entries(sellerStatus).map(([status, count]) => ({ status, count })),
          top: sellerRows.slice(0, 12),
          list: sellerRows,
          totals: {
            all: sellers.length,
            approved: sellerStatus.approved || 0,
            pending: sellerStatus.pending || 0,
            withSales: sellerRows.filter((row) => row.revenue > 0).length
          }
        },
        buyers: {
          totals: {
            registered: buyerOnly.length,
            checkout: customers.length,
            first: firstCustomers.length,
            repeat: repeatCustomers.length,
            firstRevenue: roundMoney(firstCustomers.reduce((sum, row) => sum + row.revenue, 0)),
            repeatRevenue: roundMoney(repeatCustomers.reduce((sum, row) => sum + row.revenue, 0))
          },
          cities: [...cityMap.values()].map((row) => ({ ...row, revenue: roundMoney(row.revenue) })).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
          list: customers.sort((a, b) => b.revenue - a.revenue).slice(0, 20),
          signups: daily.map((row) => ({ date: row.date, users: row.users || 0 }))
        },
        fulfillment: {
          byStatus: ['processing', 'shipped', 'delivered', 'cancelled'].map((status) => ({ status, count: byStatus[status] || 0 })),
          open: (byStatus.processing || 0) + (byStatus.shipped || 0),
          delivered: byStatus.delivered || 0,
          cancelled: byStatus.cancelled || 0,
          total: orders.length,
          avgDaysToShip: platformFulfillment.avgDaysToShip,
          avgDaysToDeliver: platformFulfillment.avgDaysToDeliver,
          avgWaiting: platformFulfillment.avgWaiting,
          lateRate: platformFulfillment.lateRate,
          shipBuckets: platformFulfillment.shipBuckets,
          waitBuckets: platformFulfillment.waitBuckets,
          slaDays: LATE_SHIP_DAYS
        },
        payments: {
          byStatus: Object.entries(payStatus).map(([status, row]) => ({ status, count: row.count, revenue: roundMoney(row.revenue) })),
          byMethod: [...payMethod.values()].map((row) => ({ ...row, revenue: roundMoney(row.revenue) })).sort((a, b) => b.revenue - a.revenue),
          totals: {
            pending: payStatus.pending.count,
            completed: payStatus.completed.count,
            failed: payStatus.failed.count,
            collected: roundMoney(payStatus.completed.revenue),
            outstanding: roundMoney(payStatus.pending.revenue)
          }
        },
        catalog: {
          categories: [...categoryMap.values()].map((row) => ({ ...row, revenue: roundMoney(row.revenue) })).sort((a, b) => b.revenue - a.revenue),
          products: topProducts,
          totals: {
            live: products.filter((item) => item.isActive && item.approvalStatus !== 'pending').length,
            pending: products.filter((item) => item.approvalStatus === 'pending').length,
            lowStock: products.filter((item) => item.stock <= 5).length,
            unsold: products.filter((item) => !(productSales.get(String(item._id))?.qty)).length
          }
        },
        ads: {
          totals: {
            impressions,
            clicks,
            ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0,
            spend: roundMoney(featuredRows.reduce((sum, row) => sum + row.spent, 0)),
            attributed: roundMoney(featuredRows.reduce((sum, row) => sum + row.revenue, 0)),
            live: products.filter((item) => item.isSponsored).length
          },
          daily: fillDaily(from30, now, adDaily, { impressions: 0, clicks: 0 }),
          surfaces: [...adBySurface.values()],
          products: adProductRows.slice(0, 12),
          featured: featuredRows
        },
        promos: {
          codes: [...promoStats.values()].map((row) => ({ ...row, revenue: roundMoney(row.revenue), discount: roundMoney(row.discount) })).sort((a, b) => b.revenue - a.revenue),
          withPromo: { orders: promoOrders, revenue: roundMoney(promoRevenue) },
          withoutPromo: { orders: plainOrders, revenue: roundMoney(plainRevenue) }
        },
        quality: {
          ratings: ratingBuckets,
          avgRating: reviews.length
            ? Math.round((reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length) * 10) / 10
            : 0,
          reviewCount: reviews.length,
          questions: {
            total: questions.length,
            unanswered: questions.length - answered.length
          }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Rapor alınamadı.', hata: error.message });
  }
};

const getAdminSellerReport = async (req, res) => {
  try {
    const rawId = String(req.params.sellerId || '').trim();
    if (!rawId) return res.status(400).json({ mesaj: 'Satıcı belirtilmedi.' });

    let shop = await Seller.findOne({ user: rawId }).lean();
    if (!shop) shop = await Seller.findById(rawId).lean();
    if (!shop) return res.status(404).json({ mesaj: 'Satıcı bulunamadı.' });

    const sellerId = String(shop.user);
    const now = new Date();
    const from30 = new Date(now);
    from30.setUTCDate(from30.getUTCDate() - 29);
    from30.setUTCHours(0, 0, 0, 0);
    const from30Ms = from30.getTime();

    const products = await Product.find({ seller: sellerId })
      .select('_id title category image stock price rating numReviews approvalStatus isActive soldCount')
      .lean();
    const productIds = products.map((item) => item._id);
    const owned = new Set(productIds.map(String));

    const [orders, productReviews, productQuestions, promos, featured, adEvents] = await Promise.all([
      productIds.length || sellerId
        ? Order.find({
          $or: [
            { 'orderItems.seller': sellerId },
            { 'sellerFulfillments.seller': sellerId },
            ...(productIds.length ? [{ 'orderItems.product': { $in: productIds } }] : [])
          ]
        }).sort({ createdAt: -1 }).lean()
        : Promise.resolve([]),
      productIds.length ? Review.find({ product: { $in: productIds } }).lean() : Promise.resolve([]),
      productIds.length
        ? ProductQuestion.find({ product: { $in: productIds }, isPublic: true }).lean()
        : Promise.resolve([]),
      PromoCode.find({ seller: sellerId }).lean(),
      FeaturedRequest.find({ seller: sellerId }).sort({ createdAt: -1 }).lean(),
      AdEvent.find({
        $or: [{ seller: sellerId }, { product: { $in: productIds } }],
        createdAt: { $gte: from30 }
      }).lean()
    ]);

    const productById = new Map(products.map((item) => [String(item._id), item]));
    const sellerItemsOf = (order) => (order.orderItems || []).filter((item) => {
      if (owned.has(String(item.product))) return true;
      return sellerIdOf(item) === sellerId;
    });
    const allOrders = orders;

    const byProduct = new Map(products.map((product) => [String(product._id), {
      id: product._id,
      title: product.title,
      category: product.category || 'diger',
      label: CATEGORY_LABELS[product.category] || product.category,
      image: product.image || '',
      stock: product.stock || 0,
      rating: product.rating || 0,
      numReviews: product.numReviews || 0,
      qty: 0,
      revenue: 0,
      orders: 0,
      shipDaysSum: 0,
      shipDaysN: 0
    }]));
    const dailyMap = new Map();
    const colorMap = new Map();
    const sizeMap = new Map();
    const cityMap = new Map();
    const customerMap = new Map();
    const payStatus = {
      pending: { count: 0, revenue: 0 },
      completed: { count: 0, revenue: 0 },
      failed: { count: 0, revenue: 0 }
    };
    const payMethod = new Map();
    const ops = emptyOps();
    const orderRows = [];
    let revenue = 0;
    let qtySold = 0;

    allOrders.forEach((order) => {
      const items = sellerItemsOf(order);
      if (!items.length) return;
      const timing = timingOf(order, sellerId);
      const status = timing.status || sellerStatusOf(order, sellerId);
      const cancelled = status === 'cancelled';
      const lineQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const lineRev = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * Number(item.price || 0), 0);
      const created = new Date(order.createdAt);

      addTimingToOps(ops, timing);
      if (!cancelled) {
        revenue += lineRev;
        qtySold += lineQty;
      }

      const payKey = payStatus[order.paymentStatus] ? order.paymentStatus : 'pending';
      payStatus[payKey].count += 1;
      payStatus[payKey].revenue += cancelled ? 0 : lineRev;
      bump(payMethod, order.paymentMethod || 'unknown', (key) => ({ method: key, count: 0, revenue: 0 }), (row) => {
        row.count += 1;
        if (!cancelled) row.revenue += lineRev;
      });

      bump(dailyMap, isoDay(created), (key) => ({ date: key, orders: 0, revenue: 0, qty: 0, cancelled: 0 }), (row) => {
        if (cancelled) row.cancelled += 1;
        else {
          row.orders += 1;
          row.qty += lineQty;
          row.revenue += lineRev;
        }
      });

      const email = String(order.customerInfo?.email || '').trim().toLowerCase();
      const customerKey = email || String(order.customerInfo?.phone || order._id);
      const city = String(order.shippingAddress?.city || '').trim() || 'Belirtilmedi';
      bump(customerMap, customerKey, () => ({
        key: customerKey,
        email,
        name: `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Misafir',
        city,
        orders: 0,
        revenue: 0
      }), (row) => {
        row.orders += 1;
        if (!cancelled) row.revenue += lineRev;
      });
      if (!cancelled) {
        bump(cityMap, city, (key) => ({ city: key, orders: 0, revenue: 0 }), (row) => {
          row.orders += 1;
          row.revenue += lineRev;
        });
      }

      const counted = new Set();
      items.forEach((item) => {
        const pid = String(item.product);
        const row = byProduct.get(pid);
        const qtyValue = Number(item.quantity) || 0;
        const revValue = qtyValue * Number(item.price || 0);
        if (row && !cancelled) {
          row.qty += qtyValue;
          row.revenue += revValue;
          if (created.getTime() >= from30Ms) row.qty30 = (row.qty30 || 0) + qtyValue;
          if (!counted.has(pid)) {
            row.orders += 1;
            counted.add(pid);
          }
          if (timing.daysToShip != null) {
            row.shipDaysSum += timing.daysToShip;
            row.shipDaysN += 1;
          }
        }
        if (!cancelled) {
          const color = String(item.color || '').trim();
          const size = String(item.size || '').trim();
          if (color) {
            bump(colorMap, color.toLowerCase(), () => ({ name: color, qty: 0, revenue: 0 }), (entry) => {
              entry.qty += qtyValue;
              entry.revenue += revValue;
            });
          }
          if (size) {
            bump(sizeMap, size.toLowerCase(), () => ({ name: size, qty: 0, revenue: 0 }), (entry) => {
              entry.qty += qtyValue;
              entry.revenue += revValue;
            });
          }
        }
      });

      orderRows.push({
        id: order._id,
        createdAt: order.createdAt,
        customer: `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Misafir',
        city,
        status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        qty: lineQty,
        revenue: roundMoney(cancelled ? 0 : lineRev),
        products: items.map((item) => productById.get(String(item.product))?.title || item.name).filter(Boolean),
        daysToShip: timing.daysToShip,
        daysToDeliver: timing.daysToDeliver,
        daysAfterShip: timing.daysAfterShip,
        daysWaiting: timing.daysWaiting,
        late: timing.late,
        shippedAt: timing.shippedAt,
        deliveredAt: timing.deliveredAt
      });
    });

    const fulfillment = summarizeOps(ops);
    const productRows = [...byProduct.values()]
      .map((row) => ({
        ...row,
        revenue: roundMoney(row.revenue),
        avgDaysToShip: row.shipDaysN ? Math.round((row.shipDaysSum / row.shipDaysN) * 10) / 10 : null
      }))
      .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);

    const categoryMap = new Map();
    productRows.forEach((row) => {
      bump(categoryMap, row.category || 'diger', () => ({
        category: row.category,
        label: row.label,
        qty: 0,
        revenue: 0,
        products: 0
      }), (current) => {
        current.products += 1;
        current.qty += row.qty;
        current.revenue += row.revenue;
      });
    });

    const answered = productQuestions.filter((item) => String(item.answer || '').trim());
    const answerHours = answered
      .map((item) => {
        if (!item.answeredAt || !item.createdAt) return null;
        return (new Date(item.answeredAt) - new Date(item.createdAt)) / 3600000;
      })
      .filter((value) => value != null && value >= 0 && value < 24 * 60);

    const impressions = adEvents.filter((item) => item.type === 'impression').length;
    const clicks = adEvents.filter((item) => item.type === 'click').length;
    const featuredRows = featured.map((item) => {
      const product = productById.get(String(item.product));
      const start = item.startsAt ? new Date(item.startsAt) : new Date(item.createdAt);
      const end = item.endsAt ? new Date(item.endsAt) : new Date(start.getTime() + (Number(item.days) || 0) * 86400000);
      let featRev = 0;
      let featQty = 0;
      allOrders.forEach((order) => {
        if (sellerStatusOf(order, sellerId) === 'cancelled') return;
        const created = new Date(order.createdAt);
        if (created < start || created > end) return;
        sellerItemsOf(order).forEach((line) => {
          if (String(line.product) !== String(item.product)) return;
          featQty += Number(line.quantity) || 0;
          featRev += (Number(line.quantity) || 0) * Number(line.price || 0);
        });
      });
      const spent = ['approved', 'removed'].includes(item.status) ? Number(item.price || 0) : 0;
      return {
        id: item._id,
        title: product?.title || 'Ürün',
        days: item.days,
        status: item.status,
        spent,
        revenue: roundMoney(featRev),
        qty: featQty,
        roi: spent > 0 ? Math.round(((featRev - spent) / spent) * 100) : null
      };
    });

    const customers = [...customerMap.values()].map((row) => ({ ...row, revenue: roundMoney(row.revenue), repeat: row.orders > 1 }));
    const sortNamed = (rows) => rows
      .map((row) => ({ ...row, revenue: roundMoney(row.revenue) }))
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);

    return res.json({
      success: true,
      report: {
        shop: {
          sellerId,
          shop: shop.magazaAdi || 'Mağaza',
          city: shop.sehir || '',
          status: shop.durum || 'unknown',
          createdAt: shop.createdAt
        },
        kpis: {
          orders: fulfillment.total,
          revenue: roundMoney(revenue),
          qty: qtySold,
          products: products.length,
          ...fulfillment,
          slaDays: LATE_SHIP_DAYS
        },
        timeseries: {
          daily: fillDaily(from30, now, dailyMap)
        },
        orders: orderRows.slice(0, 40),
        products: productRows,
        categories: [...categoryMap.values()]
          .map((row) => ({ ...row, revenue: roundMoney(row.revenue) }))
          .sort((a, b) => b.revenue - a.revenue),
        variants: {
          colors: sortNamed([...colorMap.values()]),
          sizes: sortNamed([...sizeMap.values()])
        },
        customers: {
          totals: {
            all: customers.length,
            repeat: customers.filter((row) => row.repeat).length
          },
          cities: [...cityMap.values()].map((row) => ({ ...row, revenue: roundMoney(row.revenue) })).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
          list: customers.sort((a, b) => b.revenue - a.revenue).slice(0, 20)
        },
        payments: {
          byStatus: Object.entries(payStatus).map(([status, row]) => ({ status, count: row.count, revenue: roundMoney(row.revenue) })),
          byMethod: [...payMethod.values()].map((row) => ({ ...row, revenue: roundMoney(row.revenue) })).sort((a, b) => b.revenue - a.revenue)
        },
        quality: {
          avgRating: productReviews.length
            ? Math.round((productReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / productReviews.length) * 10) / 10
            : 0,
          reviewCount: productReviews.length,
          questions: {
            total: productQuestions.length,
            unanswered: productQuestions.length - answered.length,
            avgHours: answerHours.length
              ? Math.round((answerHours.reduce((sum, value) => sum + value, 0) / answerHours.length) * 10) / 10
              : 0
          }
        },
        ads: {
          impressions,
          clicks,
          ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0,
          featured: featuredRows
        },
        promos: promos.map((item) => ({
          code: item.code,
          percent: item.percent,
          usedCount: item.usedCount || 0,
          isActive: item.isActive !== false
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Satıcı raporu alınamadı.', hata: error.message });
  }
};

module.exports = { getAdminReports, getAdminSellerReport };
