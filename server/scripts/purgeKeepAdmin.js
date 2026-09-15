/**
 * Tüm ürünleri, satıcıları ve (admin dışı) kullanıcıları siler.
 * superadmin / admin hesapları korunur.
 *
 * Kullanım: node scripts/purgeKeepAdmin.js
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
const WeeklyAtelier = require('../models/WeeklyAtelier');
const FeaturedRequest = require('../models/FeaturedRequest');
const AdEvent = require('../models/AdEvent');
const PromoCode = require('../models/PromoCode');

const ADMIN_ROLES = ['superadmin', 'admin'];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });

    const admins = await User.find({ rol: { $in: ADMIN_ROLES } }).select('_id email adSoyad rol').lean();
    if (!admins.length) {
      console.error('Hiç admin bulunamadı. Silme iptal edildi.');
      process.exit(1);
    }

    const adminIds = admins.map((u) => u._id);

    const cleared = {
      products: (await Product.deleteMany({})).deletedCount,
      sellers: (await Seller.deleteMany({})).deletedCount,
      users: (await User.deleteMany({ _id: { $nin: adminIds } })).deletedCount,
      carts: (await Cart.deleteMany({})).deletedCount,
      orders: (await Order.deleteMany({})).deletedCount,
      reviews: (await Review.deleteMany({})).deletedCount,
      questions: (await ProductQuestion.deleteMany({})).deletedCount,
      weeklyAteliers: (await WeeklyAtelier.deleteMany({})).deletedCount,
      featuredRequests: (await FeaturedRequest.deleteMany({})).deletedCount,
      adEvents: (await AdEvent.deleteMany({})).deletedCount,
      promoCodes: (await PromoCode.deleteMany({})).deletedCount
    };

    const remaining = await User.find({}).select('email adSoyad rol').lean();

    console.log(JSON.stringify({
      keptAdmins: remaining.map((u) => ({
        email: u.email,
        adSoyad: u.adSoyad,
        rol: u.rol
      })),
      cleared
    }, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
