/**
 * Mevcut siparişlerde satıcı kargo zaman damgalarını doldurur.
 * Kullanım: node scripts/backfillFulfillmentTimes.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const Order = require('../models/Order');

const gapFromId = (id, min, span) => min + (parseInt(String(id).slice(-2), 16) % span);

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
  const orders = await Order.find();
  let updated = 0;

  for (const order of orders) {
    const created = new Date(order.createdAt);
    const fallback = new Date(order.updatedAt || order.createdAt);
    const farEnough = Math.abs(fallback - created) >= 3600000;
    let dirty = false;

    (order.sellerFulfillments || []).forEach((row, index) => {
      const status = row.status || order.orderStatus || 'processing';
      if (!row.processingAt) {
        row.processingAt = created;
        dirty = true;
      }
      if (['shipped', 'delivered'].includes(status) && !row.shippedAt) {
        row.shippedAt = farEnough
          ? fallback
          : new Date(created.getTime() + gapFromId(`${order._id}${index}`, 1, 5) * 86400000);
        dirty = true;
      }
      if (status === 'delivered' && !row.deliveredAt) {
        const ship = row.shippedAt ? new Date(row.shippedAt) : created;
        row.deliveredAt = farEnough && fallback > ship
          ? fallback
          : new Date(ship.getTime() + gapFromId(`${order._id}d${index}`, 1, 3) * 86400000);
        dirty = true;
      }
      if (status === 'cancelled' && !row.cancelledAt) {
        row.cancelledAt = fallback;
        dirty = true;
      }
    });

    if (!order.sellerFulfillments?.length && ['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      order.sellerFulfillments = [];
    }

    if (dirty) {
      await order.save();
      updated += 1;
    }
  }

  console.log(`Kargo zamanı güncellenen sipariş: ${updated}/${orders.length}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
