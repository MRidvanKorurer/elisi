/**
 * nikbag@gmail.com satıcısına rapor demosu: 10 ürün + 5 sipariş.
 * Kampanya, yorum ve soru da ekler (rapor 8-10).
 * Kullanım: node scripts/seedNikbagReportDemo.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const slugify = require('slugify');

const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');
const Review = require('../models/Review');
const ProductQuestion = require('../models/ProductQuestion');
const FeaturedRequest = require('../models/FeaturedRequest');

const DEMO_PREFIX = 'RPR-';
const DEMO_COUPON = 'RAPORDEMO';
const PROMO_CODE = 'RAPOR10';
const SELLER_EMAIL = 'nikbag@gmail.com';

const daysAgo = (days, hours = 12) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hours, 20, 0, 0);
  return date;
};

const money = (value) => Math.round(Number(value || 0) * 100) / 100;

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });

  const sellerUser = await User.findOne({ email: SELLER_EMAIL });
  if (!sellerUser) throw new Error(`${SELLER_EMAIL} bulunamadı.`);
  const seller = await Seller.findOne({ user: sellerUser._id, durum: 'approved' });
  if (!seller) throw new Error('Onaylı Nik Bag satıcısı bulunamadı.');

  const existing = await Product.find({ seller: sellerUser._id }).select('image additionalImages title').lean();
  const fallbackImages = [
    '/uploads/products/seed/inci-damla-kupe-atolye-serisi-1.jpg',
    '/uploads/products/seed/gumus-zincir-kolye-minimal-1.jpg',
    '/uploads/products/seed/makrome-bileklik-gul-kurusu-1.jpg',
    '/uploads/products/seed/pirinc-yuzuk-seti-uclu-1.jpg',
    '/uploads/products/seed/ametist-dogal-tas-kolye-1.jpg',
    '/uploads/products/seed/efsun-inci-kupe.png',
    '/uploads/products/seed/efsun-gumus-kolye.png',
    '/uploads/products/seed/efsun-makrome-bileklik.png',
    '/uploads/products/seed/efsun-yuzuk-seti.png',
    '/uploads/products/seed/efsun-ametist-kolye.png'
  ];
  const imageAt = (index) => existing[index % Math.max(existing.length, 1)]?.image || fallbackImages[index % fallbackImages.length];

  const oldDemo = await Product.find({ seller: sellerUser._id, productCode: new RegExp(`^${DEMO_PREFIX}`) }).select('_id').lean();
  const oldIds = oldDemo.map((item) => item._id);
  if (oldIds.length) {
    await Review.deleteMany({ product: { $in: oldIds } });
    await ProductQuestion.deleteMany({ product: { $in: oldIds } });
    await Product.deleteMany({ _id: { $in: oldIds } });
  }
  await Order.deleteMany({ couponCode: DEMO_COUPON });

  const catalog = [
    { code: 'RPR-01', title: 'Keten Atölye Gömleği', category: 'giyim', price: 890, stock: 3, colors: ['Bej', 'Beyaz'], sizes: ['S', 'M', 'L'] },
    { code: 'RPR-02', title: 'El Örgüsü Hırka', category: 'giyim', price: 1450, stock: 8, colors: ['Gül kurusu', 'Ekru'], sizes: ['M', 'L'] },
    { code: 'RPR-03', title: 'El Dikişi Deri Cüzdan', category: 'canta', price: 640, stock: 12, colors: ['Kahve', 'Siyah'], sizes: ['Standart'] },
    { code: 'RPR-04', title: 'Hasır Market Çantası', category: 'canta', price: 1120, stock: 2, colors: ['Ekru', 'Kum'], sizes: ['Standart'] },
    { code: 'RPR-05', title: 'Pirinç Yüzük Seti', category: 'taki', price: 520, stock: 15, colors: ['Altın', 'Gümüş'], sizes: ['14', '16'] },
    { code: 'RPR-06', title: 'Terra Seramik Kase', category: 'seramik', price: 780, stock: 6, colors: ['Krem', 'Terra'], sizes: ['Tek boy'] },
    { code: 'RPR-07', title: 'Portakal Kabuğu Soya Mum', category: 'mum', price: 340, stock: 20, colors: ['Amber'], sizes: ['180 ml'] },
    { code: 'RPR-08', title: 'Bebek Örgü Battaniye', category: 'bebek-cocuk', price: 960, stock: 4, colors: ['Ekru', 'Pudra'], sizes: ['80x100'] },
    { code: 'RPR-09', title: 'Ceviz Sunum Tepsisi', category: 'ahsap', price: 1280, stock: 7, colors: ['Ceviz'], sizes: ['40 cm'] },
    { code: 'RPR-10', title: 'Pamukkale Peştamal', category: 'banyo-tekstili', price: 450, stock: 9, colors: ['Beyaz', 'Lacivert'], sizes: ['100x180'] }
  ];

  const products = [];
  for (let i = 0; i < catalog.length; i += 1) {
    const item = catalog[i];
    const created = await Product.create({
      seller: sellerUser._id,
      title: item.title,
      slug: `${slugify(item.title, { lower: true, strict: true, locale: 'tr' })}-rapor`,
      description: `${item.title}, Nik Bag Atölyesi rapor demosu için eklenen el emeği parçadır. Doğal malzeme, atölye üretimi.`,
      category: item.category,
      productCode: item.code,
      price: item.price,
      stock: item.stock,
      colors: item.colors,
      sizes: item.sizes,
      image: imageAt(i),
      additionalImages: [imageAt(i + 1), imageAt(i + 2)].filter(Boolean),
      features: ['El işçiliği', 'Atölye üretimi', 'Sınırlı adet'],
      careInstructions: 'Nemli bezle silin, doğrudan güneşte bırakmayın.',
      immediateDelivery: i % 2 === 0,
      customProductionTime: '3-5 İş Günü',
      isActive: true,
      approvalStatus: 'approved',
      approvedAt: new Date(),
      rating: 5,
      numReviews: 0,
      soldCount: 0
    });
    products.push(created);
  }

  const byCode = Object.fromEntries(products.map((item) => [item.productCode, item]));

  let promo = await PromoCode.findOne({ code: PROMO_CODE });
  if (!promo) {
    promo = await PromoCode.create({
      code: PROMO_CODE,
      percent: 10,
      minSubtotal: 0,
      note: 'Rapor demosu',
      isActive: true,
      usedCount: 0,
      seller: sellerUser._id
    });
  } else {
    promo.seller = sellerUser._id;
    promo.isActive = true;
    promo.percent = 10;
    await promo.save();
  }

  const ensureUser = async (email, name) => {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        adSoyad: name,
        email,
        sifre: 'Rapor1234.',
        rol: 'user',
        telefon: '05551112233'
      });
    }
    return user;
  };
  const ayse = await ensureUser('ayse.rapor@test.local', 'Ayşe Demir');
  const mehmet = await ensureUser('mehmet.rapor@test.local', 'Mehmet Kaya');
  const can = await ensureUser('can.rapor@test.local', 'Can Yılmaz');

  const line = (product, quantity, color, size) => ({
    product: product._id,
    seller: sellerUser._id,
    name: product.title,
    quantity,
    price: product.price,
    image: product.image,
    color: color || '',
    size: size || ''
  });

  const buildOrder = ({ when, user, customer, city, district, items, paymentMethod, paymentStatus, orderStatus, promo, shipDays = 0, deliverDays = 0 }) => {
    const subtotal = money(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const discount = promo ? money(subtotal * (promo.percent / 100)) : 0;
    const shippingCost = 0;
    const totalPrice = money(subtotal - discount + shippingCost);
    const shippedAt = ['shipped', 'delivered'].includes(orderStatus)
      ? new Date(when.getTime() + shipDays * 86400000)
      : undefined;
    const deliveredAt = orderStatus === 'delivered'
      ? new Date(when.getTime() + (deliverDays || shipDays + 1) * 86400000)
      : undefined;
    const cancelledAt = orderStatus === 'cancelled' ? when : undefined;
    return {
      user: user?._id || null,
      customerInfo: customer,
      shippingAddress: { address: `${district} Mah. Atölye Sk. No:7`, city, district },
      orderItems: items,
      subtotal,
      couponCode: DEMO_COUPON,
      couponPercent: 0,
      couponDiscount: 0,
      promoCode: promo ? promo.code : '',
      promoPercent: promo ? promo.percent : 0,
      promoDiscount: discount,
      shippingCost,
      totalPrice,
      paymentMethod,
      paymentStatus,
      orderStatus,
      sellerFulfillments: [{
        seller: sellerUser._id,
        status: orderStatus,
        processingAt: when,
        shippedAt,
        deliveredAt,
        cancelledAt
      }],
      createdAt: when,
      updatedAt: deliveredAt || shippedAt || when
    };
  };

  const featured = await FeaturedRequest.findOne({
    seller: sellerUser._id,
    status: { $in: ['approved', 'removed'] }
  }).sort({ createdAt: -1 }).lean();
  const featuredProduct = featured
    ? await Product.findOne({ _id: featured.product, seller: sellerUser._id })
    : null;
  const featuredStart = featured?.startsAt ? new Date(featured.startsAt) : (featured ? new Date(featured.createdAt) : daysAgo(3));
  const featuredEnd = featured?.endsAt
    ? new Date(featured.endsAt)
    : new Date(featuredStart.getTime() + (Number(featured?.days) || 3) * 86400000);
  const featuredWhen = new Date(featuredStart.getTime() + Math.max(60 * 60 * 1000, (featuredEnd - featuredStart) / 2));

  const orders = [
    buildOrder({
      when: daysAgo(22),
      customer: { firstName: 'ipek', lastName: 'korurer', email: 'ipek@gmail.com', phone: '05550001111' },
      city: 'İstanbul',
      district: 'Kadıköy',
      items: [line(byCode['RPR-01'], 1, 'Bej', 'M'), line(byCode['RPR-03'], 1, 'Kahve', 'Standart')],
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      orderStatus: 'delivered',
      promo,
      shipDays: 2,
      deliverDays: 4
    }),
    buildOrder({
      when: daysAgo(14),
      user: ayse,
      customer: { firstName: 'Ayşe', lastName: 'Demir', email: ayse.email, phone: '05552223344' },
      city: 'İzmir',
      district: 'Alsancak',
      items: [line(byCode['RPR-02'], 1, 'Gül kurusu', 'L'), line(byCode['RPR-04'], 1, 'Ekru', 'Standart')],
      paymentMethod: 'transfer',
      paymentStatus: 'completed',
      orderStatus: 'shipped',
      shipDays: 5
    }),
    buildOrder({
      when: daysAgo(8),
      user: mehmet,
      customer: { firstName: 'Mehmet', lastName: 'Kaya', email: mehmet.email, phone: '05553334455' },
      city: 'Ankara',
      district: 'Çankaya',
      items: [line(byCode['RPR-06'], 2, 'Terra', 'Tek boy'), line(byCode['RPR-05'], 1, 'Altın', '16')],
      paymentMethod: 'whatsapp',
      paymentStatus: 'pending',
      orderStatus: 'processing'
    }),
    buildOrder({
      when: featuredProduct ? featuredWhen : daysAgo(3),
      user: can,
      customer: { firstName: 'Can', lastName: 'Yılmaz', email: can.email, phone: '05554445566' },
      city: 'Antalya',
      district: 'Kaleiçi',
      items: [
        line(byCode['RPR-09'], 1, 'Ceviz', '40 cm'),
        ...(featuredProduct ? [line(featuredProduct, 1, '', '')] : [])
      ],
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      orderStatus: 'delivered',
      shipDays: 1,
      deliverDays: 3
    }),
    buildOrder({
      when: daysAgo(0, 10),
      user: ayse,
      customer: { firstName: 'Ayşe', lastName: 'Demir', email: ayse.email, phone: '05552223344' },
      city: 'İzmir',
      district: 'Alsancak',
      items: [line(byCode['RPR-08'], 1, 'Pudra', '80x100'), line(byCode['RPR-10'], 1, 'Lacivert', '100x180')],
      paymentMethod: 'credit_card',
      paymentStatus: 'failed',
      orderStatus: 'cancelled'
    })
  ];

  await Order.insertMany(orders);
  promo.usedCount = orders.filter((order) => order.promoCode === PROMO_CODE).length;
  await promo.save();

  const soldQty = {
    'RPR-01': 1,
    'RPR-02': 1,
    'RPR-03': 1,
    'RPR-04': 1,
    'RPR-05': 1,
    'RPR-06': 2,
    'RPR-09': 1
  };
  await Promise.all(Object.entries(soldQty).map(([code, qty]) =>
    Product.findByIdAndUpdate(byCode[code]._id, { $inc: { soldCount: qty }, $set: { isNewProduct: false } })
  ));
  if (featuredProduct) {
    await Product.findByIdAndUpdate(featuredProduct._id, { $inc: { soldCount: 1 } });
  }

  await Review.deleteMany({ user: { $in: [ayse._id, mehmet._id, can._id] } });
  await Review.create([
    { product: byCode['RPR-01']._id, user: ayse._id, rating: 5, comment: 'Keteni çok güzel, kalıp tam oturdu.' },
    { product: byCode['RPR-02']._id, user: mehmet._id, rating: 4, comment: 'Hırka sıcak, renk fotoğraftaki gibi.' },
    { product: byCode['RPR-04']._id, user: can._id, rating: 5, comment: 'Hasır çanta günlük kullanıma uygun.' }
  ]);
  await Product.updateMany(
    { _id: { $in: [byCode['RPR-01']._id, byCode['RPR-04']._id] } },
    { $set: { rating: 5, numReviews: 1 } }
  );
  await Product.findByIdAndUpdate(byCode['RPR-02']._id, { $set: { rating: 4, numReviews: 1 } });

  await ProductQuestion.deleteMany({ user: { $in: [ayse._id, mehmet._id] } });
  const askedAt = daysAgo(4, 9);
  await ProductQuestion.create([
    {
      product: byCode['RPR-05']._id,
      user: ayse._id,
      question: 'Yüzük seti 16 numara için ölçü tablosu var mı?',
      answer: 'Evet, 16 numara orta parmak ölçüsüne denk gelir; kutu içinde halka ölçü kartı da gönderiyoruz.',
      answeredBy: sellerUser._id,
      answeredAt: new Date(askedAt.getTime() + 5 * 3600000),
      isPublic: true,
      createdAt: askedAt,
      updatedAt: new Date(askedAt.getTime() + 5 * 3600000)
    },
    {
      product: byCode['RPR-09']._id,
      user: mehmet._id,
      question: 'Ceviz tepsiyi yağmurlu havada dışarıda kullanabilir miyim?',
      answer: '',
      isPublic: true,
      createdAt: daysAgo(1, 15)
    }
  ]);

  console.log(JSON.stringify({
    seller: seller.magazaAdi,
    products: products.map((item) => item.title),
    orders: orders.length,
    promo: PROMO_CODE,
    featured: featuredProduct ? featuredProduct.title : null
  }, null, 2));

  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
