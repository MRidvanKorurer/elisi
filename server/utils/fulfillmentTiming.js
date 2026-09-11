const LATE_SHIP_DAYS = 3;

const round1 = (value) => Math.round(Number(value || 0) * 10) / 10;

const daysBetween = (from, to) => {
  if (!from || !to) return null;
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const days = (end - start) / 86400000;
  if (days < 0 || days > 400) return null;
  return round1(days);
};

const shipBucket = (days) => {
  if (days == null) return null;
  if (days <= 1) return '0-1';
  if (days <= 3) return '2-3';
  if (days <= 7) return '4-7';
  return '8+';
};

const emptyOps = () => ({
  shipDaysSum: 0,
  shipDaysN: 0,
  deliverDaysSum: 0,
  deliverDaysN: 0,
  afterShipSum: 0,
  afterShipN: 0,
  waitSum: 0,
  waitN: 0,
  late: 0,
  lateBase: 0,
  cancelled: 0,
  total: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  buckets: { '0-1': 0, '2-3': 0, '4-7': 0, '8+': 0 },
  waitBuckets: { '0-1': 0, '2-3': 0, '4-7': 0, '8+': 0 }
});

const stampFulfillment = (row, status, at = new Date()) => {
  if (!row) return row;
  row.status = status;
  if (status === 'processing' && !row.processingAt) row.processingAt = at;
  if (status === 'shipped') {
    if (!row.processingAt) row.processingAt = row.processingAt || at;
    if (!row.shippedAt) row.shippedAt = at;
  }
  if (status === 'delivered') {
    if (!row.shippedAt) row.shippedAt = at;
    if (!row.deliveredAt) row.deliveredAt = at;
  }
  if (status === 'cancelled' && !row.cancelledAt) row.cancelledAt = at;
  return row;
};

const fulfillmentRowOf = (order, sellerId) => {
  if (!order) return null;
  return (order.sellerFulfillments || []).find((item) => String(item.seller) === String(sellerId)) || null;
};

const timingOf = (order, sellerId) => {
  const row = fulfillmentRowOf(order, sellerId);
  const status = row?.status || order?.orderStatus || 'processing';
  const created = order?.createdAt;
  const fallback = order?.updatedAt || created;
  const shippedAt = row?.shippedAt
    || (['shipped', 'delivered'].includes(status) ? fallback : null);
  const deliveredAt = row?.deliveredAt
    || (status === 'delivered' ? fallback : null);
  const cancelledAt = row?.cancelledAt
    || (status === 'cancelled' ? fallback : null);
  const daysToShip = daysBetween(created, shippedAt);
  const daysToDeliver = daysBetween(created, deliveredAt);
  const daysAfterShip = daysBetween(shippedAt, deliveredAt);
  const daysWaiting = status === 'processing' ? daysBetween(created, new Date()) : null;
  const daysToCancel = status === 'cancelled' ? daysBetween(created, cancelledAt) : null;
  const late = daysToShip != null
    ? daysToShip > LATE_SHIP_DAYS
    : (status === 'processing' && daysWaiting != null && daysWaiting > LATE_SHIP_DAYS);
  return {
    status,
    shippedAt: shippedAt || null,
    deliveredAt: deliveredAt || null,
    cancelledAt: cancelledAt || null,
    daysToShip,
    daysToDeliver,
    daysAfterShip,
    daysWaiting,
    daysToCancel,
    late,
    bucket: shipBucket(daysToShip),
    waitBucket: shipBucket(daysWaiting)
  };
};

const addTimingToOps = (ops, timing) => {
  const current = ops || emptyOps();
  current.total += 1;
  if (current[timing.status] != null) current[timing.status] += 1;
  if (timing.status === 'cancelled') current.cancelled += 1;
  if (timing.daysToShip != null) {
    current.shipDaysSum += timing.daysToShip;
    current.shipDaysN += 1;
    if (timing.bucket) current.buckets[timing.bucket] += 1;
    current.lateBase += 1;
    if (timing.late) current.late += 1;
  } else if (timing.status === 'processing' && timing.daysWaiting != null) {
    current.waitSum += timing.daysWaiting;
    current.waitN += 1;
    if (timing.waitBucket) current.waitBuckets[timing.waitBucket] += 1;
    current.lateBase += 1;
    if (timing.late) current.late += 1;
  }
  if (timing.daysToDeliver != null) {
    current.deliverDaysSum += timing.daysToDeliver;
    current.deliverDaysN += 1;
  }
  if (timing.daysAfterShip != null) {
    current.afterShipSum += timing.daysAfterShip;
    current.afterShipN += 1;
  }
  return current;
};

const bucketRows = (map) => ([
  { key: '0-1', bucket: '0–1 gün', count: map['0-1'] || 0 },
  { key: '2-3', bucket: '2–3 gün', count: map['2-3'] || 0 },
  { key: '4-7', bucket: '4–7 gün', count: map['4-7'] || 0 },
  { key: '8+', bucket: '8+ gün', count: map['8+'] || 0 }
]);

const summarizeOps = (ops) => {
  const current = ops || emptyOps();
  return {
    avgDaysToShip: current.shipDaysN ? round1(current.shipDaysSum / current.shipDaysN) : 0,
    avgDaysToDeliver: current.deliverDaysN ? round1(current.deliverDaysSum / current.deliverDaysN) : 0,
    avgDaysAfterShip: current.afterShipN ? round1(current.afterShipSum / current.afterShipN) : 0,
    avgWaiting: current.waitN ? round1(current.waitSum / current.waitN) : 0,
    lateRate: current.lateBase ? Math.round((current.late / current.lateBase) * 1000) / 10 : 0,
    cancelRate: current.total ? Math.round((current.cancelled / current.total) * 1000) / 10 : 0,
    late: current.late,
    lateBase: current.lateBase,
    shipBuckets: bucketRows(current.buckets),
    waitBuckets: bucketRows(current.waitBuckets),
    byStatus: ['processing', 'shipped', 'delivered', 'cancelled'].map((status) => ({
      status,
      count: current[status] || 0
    })),
    open: (current.processing || 0) + (current.shipped || 0),
    delivered: current.delivered || 0,
    cancelled: current.cancelled || 0,
    total: current.total
  };
};

module.exports = {
  LATE_SHIP_DAYS,
  round1,
  daysBetween,
  shipBucket,
  emptyOps,
  stampFulfillment,
  fulfillmentRowOf,
  timingOf,
  addTimingToOps,
  summarizeOps
};
