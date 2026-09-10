const User = require('../models/User');
const Seller = require('../models/Seller');

const SUPERADMIN_EMAIL = 'admin@gmail.com';
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const emailMatch = (email) => new RegExp(`^${escapeRegex(email)}$`, 'i');

module.exports = async function ensureRoles() {
  await User.updateMany(
    { rol: 'admin' },
    { $set: { rol: 'seller' } }
  );

  const admin = await User.findOne({ email: emailMatch(SUPERADMIN_EMAIL) });
  if (admin && admin.rol !== 'superadmin') {
    admin.rol = 'superadmin';
    await admin.save();
    console.log(`Süper admin atandı: ${admin.email}`);
  }

  const extraAdmins = await User.find({
    rol: 'superadmin',
    email: { $not: emailMatch(SUPERADMIN_EMAIL) }
  });

  for (const user of extraAdmins) {
    const seller = await Seller.findOne({ user: user._id }).select('_id');
    user.rol = seller ? 'seller' : 'user';
    await user.save();
    console.log(`Süper admin yetkisi alındı: ${user.email} → ${user.rol}`);
  }
};
