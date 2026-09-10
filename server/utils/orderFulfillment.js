const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];
const Product = require('../models/Product');

const deriveOrderStatus = (fulfillments = []) => {
  const statuses = fulfillments.map((row) => row.status).filter(Boolean);
  if (!statuses.length) return 'processing';

  const active = statuses.filter((status) => status !== 'cancelled');
  if (!active.length) return 'cancelled';
  if (active.every((status) => status === 'delivered')) return 'delivered';
  if (active.some((status) => status === 'processing')) return 'processing';
  if (active.some((status) => status === 'shipped')) return 'shipped';
  return 'processing';
};

const uniqueSellerIds = async (order) => {
  const fromItems = [...new Set(
    (order.orderItems || [])
      .map((item) => item.seller)
      .filter(Boolean)
      .map(String)
  )];
  if (fromItems.length) return fromItems;

  const productIds = (order.orderItems || []).map((item) => item.product).filter(Boolean);
  if (!productIds.length) return [];
  const products = await Product.find({ _id: { $in: productIds } }).select('seller').lean();
  return [...new Set(products.map((product) => product.seller).filter(Boolean).map(String))];
};

const ensureSellerFulfillments = async (order) => {
  const sellerIds = await uniqueSellerIds(order);
  const existing = new Map(
    (order.sellerFulfillments || []).map((row) => [String(row.seller), row.status])
  );
  const fallback = ORDER_STATUSES.includes(order.orderStatus) ? order.orderStatus : 'processing';
  order.sellerFulfillments = sellerIds.map((id) => ({
    seller: id,
    status: existing.get(id) || fallback
  }));
  order.orderStatus = deriveOrderStatus(order.sellerFulfillments);
  return order;
};

const sellerStatusOf = (order, sellerId) => {
  const row = (order.sellerFulfillments || []).find((item) => String(item.seller) === String(sellerId));
  return row?.status || order.orderStatus || 'processing';
};

module.exports = {
  ORDER_STATUSES,
  deriveOrderStatus,
  uniqueSellerIds,
  ensureSellerFulfillments,
  sellerStatusOf
};
