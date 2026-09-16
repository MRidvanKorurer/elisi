const Product = require('../models/Product');

const adjustStock = async (order, direction) => {
  if (!order?.orderItems?.length) return;
  const sign = direction === 'restore' ? 1 : -1;
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: {
        stock: sign * item.quantity,
        soldCount: direction === 'restore' ? -item.quantity : item.quantity
      }
    });
  }
};

const applyPaidStock = async (order) => {
  if (!order || order.stockAdjusted) return order;
  await adjustStock(order, 'deduct');
  order.stockAdjusted = true;
  return order;
};

const restorePaidStock = async (order) => {
  if (!order?.stockAdjusted) return order;
  await adjustStock(order, 'restore');
  order.stockAdjusted = false;
  return order;
};

module.exports = { applyPaidStock, restorePaidStock };
