const WELCOME_PERCENT = 10;

const normalizeCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

const generateWelcomeCode = () => {
  const token = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NIK10-${token}`;
};

const money = (value) => Number(Number(value || 0).toFixed(2));

const couponDiscountOf = (subtotal) => money((Number(subtotal) || 0) * (WELCOME_PERCENT / 100));

const priorOrderFilter = (userId, { ignorePendingCard = false } = {}) => {
  const filter = {
    user: userId,
    paymentStatus: { $ne: 'failed' }
  };
  if (ignorePendingCard) {
    filter.$nor = [{ paymentMethod: 'credit_card', paymentStatus: 'pending' }];
  }
  return filter;
};

const couponAlreadyConsumed = async (user, options = {}) => {
  if (!user?._id) return false;
  const Order = require('../models/Order');
  const prior = await Order.findOne(priorOrderFilter(user._id, options)).select('_id');
  return Boolean(prior);
};

const syncWelcomeCouponFlag = async (user) => {
  if (!user?._id) return user;
  const used = await couponAlreadyConsumed(user, { ignorePendingCard: true });
  if (Boolean(user.kampanyaKullanildi) !== used) {
    const User = require('../models/User');
    user.kampanyaKullanildi = used;
    await User.findByIdAndUpdate(user._id, { $set: { kampanyaKullanildi: used } });
  }
  return user;
};

const clearAbandonedCardAttempts = async (userId) => {
  const Order = require('../models/Order');
  await Order.deleteMany({
    user: userId,
    paymentMethod: 'credit_card',
    paymentStatus: 'pending'
  });
};

module.exports = {
  WELCOME_PERCENT,
  normalizeCode,
  generateWelcomeCode,
  couponDiscountOf,
  couponAlreadyConsumed,
  syncWelcomeCouponFlag,
  clearAbandonedCardAttempts,
  money
};
