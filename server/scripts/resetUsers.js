/**
 * Tüm kullanıcıları siler, dört hesabı sıfırdan kurar.
 * Kullanım: node scripts/resetUsers.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Product = require('../models/Product');
const ProductQuestion = require('../models/ProductQuestion');

const PASSWORD = '1234';

const validTckn = (seed) => {
  const d = String(seed).padStart(9, '0').split('').map(Number);
  d[0] = Math.max(1, d[0]);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  d[9] = (((odd * 7) - even) % 10 + 10) % 10;
  d[10] = d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10;
  return d.join('');
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });

  const cleared = {
    users: (await User.deleteMany({})).deletedCount,
    sellers: (await Seller.deleteMany({})).deletedCount,
    carts: (await Cart.deleteMany({})).deletedCount,
    orders: (await Order.deleteMany({})).deletedCount,
    reviews: (await Review.deleteMany({})).deletedCount,
    questions: (await ProductQuestion.deleteMany({})).deletedCount
  };

  const admin = await User.create({
    adSoyad: 'Nik Bag Admin',
    email: 'admin@gmail.com',
    sifre: PASSWORD,
    telefon: '05551112200',
    rol: 'superadmin'
  });

  const ipek = await User.create({
    adSoyad: 'İpek Üye',
    email: 'ipek@gmail.com',
    sifre: PASSWORD,
    telefon: '05551112201',
    rol: 'user'
  });

  const ridvan = await User.create({
    adSoyad: 'Rıdvan Korurer',
    email: 'ridvan@gmail.com',
    sifre: PASSWORD,
    telefon: '05551112202',
    rol: 'seller'
  });

  const efsun = await User.create({
    adSoyad: 'Efsun Satıcı',
    email: 'efsun@gmail.com',
    sifre: PASSWORD,
    telefon: '05551112203',
    rol: 'seller'
  });

  await Seller.create({
    user: ridvan._id,
    magazaAdi: 'Rıdvan Atölye',
    hesapTipi: 'bireysel',
    magazaTuru: ['canta'],
    aciklama: 'El örgüsü çanta ve ahşap saplı tasarımlar.',
    telefon: '05551112202',
    sehir: 'İstanbul',
    ilce: 'Kadıköy',
    adres: 'Moda Cad. No:12',
    iban: 'TR330006100519786457841326',
    tcKimlik: validTckn('100000001'),
    sozlesmeOnay: true,
    durum: 'approved'
  });

  await Seller.create({
    user: efsun._id,
    magazaAdi: 'Efsun Atölye',
    hesapTipi: 'bireysel',
    magazaTuru: ['taki'],
    aciklama: 'Takı ve küçük el işi tasarımlar.',
    telefon: '05551112203',
    sehir: 'İzmir',
    ilce: 'Alsancak',
    adres: 'Kıbrıs Şehitleri Cad. No:8',
    iban: 'TR320010009999901234567890',
    tcKimlik: validTckn('100000002'),
    sozlesmeOnay: true,
    durum: 'approved'
  });

  const productUpdate = await Product.updateMany({}, { $set: { seller: ridvan._id } });

  console.log(JSON.stringify({
    cleared,
    password: PASSWORD,
    users: [
      { email: admin.email, rol: admin.rol, id: String(admin._id) },
      { email: ridvan.email, rol: ridvan.rol, id: String(ridvan._id) },
      { email: efsun.email, rol: efsun.rol, id: String(efsun._id) },
      { email: ipek.email, rol: ipek.rol, id: String(ipek._id) }
    ],
    productsAssignedToRidvan: productUpdate.modifiedCount
  }, null, 2));

  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
