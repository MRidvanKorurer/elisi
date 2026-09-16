const User = require('../models/User');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = async function ensureRoles() {
  const email = String(process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
  if (!email) return;

  const admin = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
  if (!admin || admin.rol === 'superadmin') return;

  admin.rol = 'superadmin';
  await admin.save();
  console.log(`Süper admin atandı: ${admin.email}`);
};
