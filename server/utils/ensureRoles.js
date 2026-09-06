const User = require('../models/User');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = async function ensureRoles() {
  await User.updateMany(
    { rol: 'admin' },
    { $set: { rol: 'seller' } }
  );

  const email = process.env.SUPERADMIN_EMAIL;
  if (!email) return;

  const user = await User.findOne({ email: new RegExp(`^${escapeRegex(email.trim())}$`, 'i') });
  if (user && user.rol !== 'superadmin') {
    user.rol = 'superadmin';
    await user.save();
    console.log(`Süper admin atandı: ${user.email}`);
  }
};
