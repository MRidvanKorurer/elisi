/**
 * ridvan@gmail.com hesabını onaylı satıcı yapar.
 * Yalnızca admin@gmail.com süper admin kalır.
 * Kullanım: node scripts/setRidvanSeller.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const User = require('../models/User');
const Seller = require('../models/Seller');
const ensureRoles = require('../utils/ensureRoles');

const SUPERADMIN_EMAIL = 'admin@gmail.com';
const SELLER_EMAIL = 'ridvan@gmail.com';

const validTckn = (seed) => {
  const d = String(seed).padStart(9, '0').split('').map(Number);
  d[0] = Math.max(1, d[0]);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  d[9] = (((odd * 7) - even) % 10 + 10) % 10;
  d[10] = d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10;
  return d.join('');
};

const emailMatch = (email) => new RegExp(`^${String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });

  const admin = await User.findOne({ email: emailMatch(SUPERADMIN_EMAIL) });
  if (!admin) {
    throw new Error(`${SUPERADMIN_EMAIL} bulunamadı.`);
  }

  const ridvan = await User.findOne({ email: emailMatch(SELLER_EMAIL) });
  if (!ridvan) {
    throw new Error(`${SELLER_EMAIL} bulunamadı.`);
  }

  ridvan.rol = 'seller';
  if (!ridvan.telefon) ridvan.telefon = '05551112202';
  await ridvan.save();

  let seller = await Seller.findOne({ user: ridvan._id });
  if (!seller) {
    seller = await Seller.create({
      user: ridvan._id,
      magazaAdi: 'Rıdvan Atölye',
      hesapTipi: 'bireysel',
      magazaTuru: ['canta'],
      aciklama: 'El örgüsü çanta ve ahşap saplı tasarımlar.',
      telefon: ridvan.telefon || '05551112202',
      sehir: 'İstanbul',
      ilce: 'Kadıköy',
      adres: 'Moda Cad. No:12',
      iban: 'TR330006100519786457841326',
      tcKimlik: validTckn('100000001'),
      sozlesmeOnay: true,
      durum: 'approved'
    });
  } else {
    seller.durum = 'approved';
    seller.reddetmeNedeni = '';
    await seller.save();
  }

  await ensureRoles();

  const after = await User.find({
    $or: [
      { email: emailMatch(SUPERADMIN_EMAIL) },
      { email: emailMatch(SELLER_EMAIL) },
      { rol: 'superadmin' }
    ]
  }).select('email rol');

  const superadmins = after.filter((u) => u.rol === 'superadmin').map((u) => u.email);
  const ridvanAfter = after.find((u) => String(u.email).toLowerCase() === SELLER_EMAIL);
  const adminAfter = after.find((u) => String(u.email).toLowerCase() === SUPERADMIN_EMAIL);

  console.log(JSON.stringify({
    admin: { email: adminAfter?.email, rol: adminAfter?.rol },
    ridvan: { email: ridvanAfter?.email, rol: ridvanAfter?.rol, magazaDurum: seller.durum },
    superadminCount: superadmins.length
  }, null, 2));

  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
