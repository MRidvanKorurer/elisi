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
    $or: [
      { paymentStatus: 'completed' },
      { paymentStatus: 'pending', orderStatus: { $ne: 'cancelled' } }
    ]
  };
  if (ignorePendingCard) {
    filter.$nor = [{ paymentMethod: 'credit_card', paymentStatus: 'pending' }];
  }
  return filter;
};

const couponAlreadyConsumed = async (user, options = {}) => {
  if (!user?._id) return false;
  const Order = require('../models/Order');
  const filter = priorOrderFilter(user._id, options);
  if (options.exceptOrderId) filter._id = { $ne: options.exceptOrderId };
  const prior = await Order.findOne(filter).select('_id');
  return Boolean(prior);
};

const CLAIM_TTL_MS = 2 * 60 * 1000;

const takeWelcomeFlag = (userId) => {
  const User = require('../models/User');
  return User.findOneAndUpdate(
    { _id: userId, kampanyaKullanildi: { $ne: true } },
    { $set: { kampanyaKullanildi: true, kampanyaClaimAt: new Date() } },
    { new: true }
  );
};

const claimWelcomeCoupon = async (userId) => {
  if (!userId) return false;
  if (await takeWelcomeFlag(userId)) return true;
  if (await couponAlreadyConsumed({ _id: userId })) return false;

  const User = require('../models/User');
  const staleBefore = new Date(Date.now() - CLAIM_TTL_MS);
  const released = await User.findOneAndUpdate(
    {
      _id: userId,
      kampanyaKullanildi: true,
      $or: [
        { kampanyaClaimAt: null },
        { kampanyaClaimAt: { $exists: false } },
        { kampanyaClaimAt: { $lte: staleBefore } }
      ]
    },
    { $set: { kampanyaKullanildi: false, kampanyaClaimAt: null } }
  );
  if (!released) return false;
  if (await couponAlreadyConsumed({ _id: userId })) {
    await User.updateOne({ _id: userId }, { $set: { kampanyaKullanildi: true } });
    return false;
  }
  return Boolean(await takeWelcomeFlag(userId));
};

const syncWelcomeCouponFlag = async (user) => {
  if (!user?._id) return user;
  const used = await couponAlreadyConsumed(user, { ignorePendingCard: true });
  if (!used && user.kampanyaKullanildi && user.kampanyaClaimAt) {
    const age = Date.now() - new Date(user.kampanyaClaimAt).getTime();
    if (age >= 0 && age < CLAIM_TTL_MS) return user;
  }
  if (Boolean(user.kampanyaKullanildi) !== used) {
    const User = require('../models/User');
    user.kampanyaKullanildi = used;
    user.kampanyaClaimAt = used ? user.kampanyaClaimAt : null;
    await User.findByIdAndUpdate(user._id, {
      $set: { kampanyaKullanildi: used, kampanyaClaimAt: used ? user.kampanyaClaimAt : null }
    });
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

const releaseWelcomeCoupon = async (order) => {
  if (!order?.user || !order.couponCode) return;
  const stillUsed = await couponAlreadyConsumed(
    { _id: order.user },
    { exceptOrderId: order._id }
  );
  if (stillUsed) return;
  const User = require('../models/User');
  await User.findByIdAndUpdate(order.user, { $set: { kampanyaKullanildi: false, kampanyaClaimAt: null } });
};

module.exports = {
  WELCOME_PERCENT,
  normalizeCode,
  generateWelcomeCode,
  couponDiscountOf,
  couponAlreadyConsumed,
  claimWelcomeCoupon,
  syncWelcomeCouponFlag,
  clearAbandonedCardAttempts,
  releaseWelcomeCoupon,
  money
};
