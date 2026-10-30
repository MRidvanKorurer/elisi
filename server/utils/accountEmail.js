const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(value));

const findUserByEmail = async (raw) => {
  const email = normalizeEmail(raw);
  if (!email) return null;
  const User = require('../models/User');
  const exact = await User.findOne({ email });
  if (exact) return exact;
  return User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
};

module.exports = { normalizeEmail, isValidEmail, findUserByEmail };
