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

const reserveStock = async (order) => {
  if (!order?.orderItems?.length || order.stockReserved) return order;
  const taken = [];
  for (const item of order.orderItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (!updated) {
      for (const row of taken) {
        await Product.findByIdAndUpdate(row.product, { $inc: { stock: row.quantity } });
      }
      const error = new Error(`${item.name || 'Ürün'} için yeterli stok kalmadı.`);
      error.status = 409;
      throw error;
    }
    taken.push(item);
  }
  order.stockReserved = true;
  order.reservedAt = new Date();
  return order;
};

const bumpSoldCount = async (order, direction) => {
  const sign = direction === 'restore' ? -1 : 1;
  for (const item of order.orderItems || []) {
    await Product.findByIdAndUpdate(item.product, { $inc: { soldCount: sign * item.quantity } });
  }
};

const applyPaidStock = async (order) => {
  if (!order || order.stockAdjusted) return order;
  if (order.stockReserved) await bumpSoldCount(order, 'add');
  else await adjustStock(order, 'deduct');
  order.stockAdjusted = true;
  return order;
};

const restorePaidStock = async (order) => {
  if (!order?.stockAdjusted) return order;
  if (order.stockReserved) await bumpSoldCount(order, 'restore');
  else await adjustStock(order, 'restore');
  order.stockAdjusted = false;
  return order;
};

const releaseReservedStock = async (order) => {
  if (!order) return order;
  if (order.stockAdjusted && order.stockReserved) await bumpSoldCount(order, 'restore');
  else if (order.stockAdjusted) await adjustStock(order, 'restore');
  if (order.stockReserved) {
    for (const item of order.orderItems || []) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }
  order.stockAdjusted = false;
  order.stockReserved = false;
  return order;
};

module.exports = { applyPaidStock, restorePaidStock, reserveStock, releaseReservedStock };
