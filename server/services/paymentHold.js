const Order = require('../models/Order');
const { releaseReservedStock } = require('../utils/orderStock');
const { releaseWelcomeCoupon } = require('../utils/welcomeCoupon');
const { releasePromoUse } = require('../utils/promoCode');
const { notifyPaymentReminder, notifyPaymentExpired } = require('./emailService');

const HOUR = 60 * 60 * 1000;
const REMINDER_MS = 24 * HOUR;
const CANCEL_MS = 72 * HOUR;
const TICK_MS = 15 * 60 * 1000;

let running = false;

const buyerNameOf = (order) =>
  `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim();

const runPaymentHolds = async () => {
  if (running) return;
  running = true;
  try {
    const now = Date.now();
    const remindBefore = new Date(now - REMINDER_MS);
    const cancelBefore = new Date(now - CANCEL_MS);

    const reminders = await Order.find({
      paymentStatus: 'pending',
      orderStatus: { $ne: 'cancelled' },
      paymentReminderSentAt: null,
      createdAt: { $lte: remindBefore, $gt: cancelBefore }
    });

    for (const order of reminders) {
      order.paymentReminderSentAt = new Date();
      await order.save();
      notifyPaymentReminder({
        buyerEmail: order.customerInfo?.email,
        buyerName: buyerNameOf(order),
        paymentCode: order.paymentCode,
        total: order.totalPrice
      });
    }

    const expired = await Order.find({
      paymentStatus: 'pending',
      orderStatus: { $ne: 'cancelled' },
      createdAt: { $lte: cancelBefore }
    });

    for (const order of expired) {
      await releaseReservedStock(order);
      order.orderStatus = 'cancelled';
      order.paymentStatus = 'failed';
      (order.sellerFulfillments || []).forEach((row) => {
        row.status = 'cancelled';
        row.cancelledAt = new Date();
      });
      await order.save();
      await releaseWelcomeCoupon(order);
      await releasePromoUse(order);
      notifyPaymentExpired({
        buyerEmail: order.customerInfo?.email,
        buyerName: buyerNameOf(order),
        paymentCode: order.paymentCode
      });
      console.log('Ödenmeyen sipariş iptal edildi:', order.paymentCode || order._id);
    }
  } catch (error) {
    console.error('Ödeme süresi kontrolü:', error.message);
  } finally {
    running = false;
  }
};

const startPaymentHoldJob = () => {
  setTimeout(() => {
    runPaymentHolds().catch((error) => console.error('Ödeme süresi:', error.message));
  }, 20000);
  setInterval(() => {
    runPaymentHolds().catch((error) => console.error('Ödeme süresi:', error.message));
  }, TICK_MS);
  console.log('Ödeme bekleyen siparişler 15 dakikada bir kontrol edilir (24 saat hatırlatma, 72 saat iptal).');
};

module.exports = { startPaymentHoldJob, runPaymentHolds };
