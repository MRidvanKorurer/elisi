/**
 * Test atölyeleri + ürünler ekler (dizini, vitrin, sipariş üzerine için).
 * Mevcut seed görsellerini kullanır; ffmpeg gerekmez.
 *
 * Kullanım: node scripts/seedTestAteliers.js
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
const WeeklyAtelier = require('../models/WeeklyAtelier');
const FeaturedRequest = require('../models/FeaturedRequest');

const PREFIX = 'TEST-';
const PASSWORD = 'Test1234.';

const validTckn = (seed) => {
  const d = String(seed).padStart(9, '0').split('').map(Number);
  d[0] = Math.max(1, d[0]);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  d[9] = (((odd * 7) - even) % 10 + 10) % 10;
  d[10] = d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10;
  return d.join('');
};

const IMAGES = {
  canta: [
    '/uploads/products/seed/orgu-omuz-cantasi-ekru-vitrin-serisi-1.jpg',
    '/uploads/products/seed/orgu-omuz-cantasi-ekru-vitrin-serisi-2.jpg',
    '/uploads/products/seed/ahsap-sapli-orgu-canta-tarcin-1.jpg',
    '/uploads/products/seed/ahsap-sapli-orgu-canta-tarcin-2.jpg',
    '/uploads/products/seed/rafya-orgu-plaj-cantasi-deniz-serisi-1.jpg',
    '/uploads/products/seed/rafya-orgu-plaj-cantasi-deniz-serisi-2.jpg',
    '/uploads/products/seed/bambu-halka-sapli-orgu-canta-zeytin-yesili-1.jpg',
    '/uploads/products/seed/bambu-sapli-mini-canta-amber-1.jpg',
    '/uploads/products/seed/hasir-dokuma-sahil-sepeti-karamel-1.jpg',
    '/uploads/products/seed/el-orgusu-clutch-kiremit-kirmizisi-1.jpg',
    '/uploads/products/seed/orgu-baget-clutch-bordo-gece-1.jpg',
    '/uploads/products/seed/zeytin-yesili-orgu-clutch-atolye-serisi-1.jpg'
  ],
  taki: [
    '/uploads/products/seed/inci-damla-kupe-atolye-serisi-1.jpg',
    '/uploads/products/seed/gumus-zincir-kolye-minimal-1.jpg',
    '/uploads/products/seed/makrome-bileklik-gul-kurusu-1.jpg',
    '/uploads/products/seed/pirinc-yuzuk-seti-uclu-1.jpg',
    '/uploads/products/seed/ametist-dogal-tas-kolye-1.jpg',
    '/uploads/products/seed/efsun-inci-kupe.png',
    '/uploads/products/seed/efsun-gumus-kolye.png',
    '/uploads/products/seed/efsun-makrome-bileklik.png'
  ],
  other: [
    '/uploads/products/seed/el-orgusu-kol-cantasi-nar-kirmizisi-1.jpg',
    '/uploads/products/seed/bambu-halka-sapli-orgu-canta-zeytin-yesili-2.jpg',
    '/uploads/products/seed/hasir-dokuma-sahil-sepeti-karamel-2.jpg',
    '/uploads/products/seed/rafya-orgu-plaj-cantasi-deniz-serisi-3.jpg'
  ]
};

const ATELIERS = [
  {
    email: 'deniz.orgu@test.local',
    name: 'Deniz Örgü',
    magazaAdi: 'Deniz Örgü Atölyesi',
    magazaTuru: ['canta', 'makrome'],
    sehir: 'İzmir',
    ilce: 'Karşıyaka',
    adres: 'Yalı Cad. No:12',
    telefon: '05551110001',
    aciklama: 'Rafya ve pamuk iplikle örülen plaj ve günlük çantalar. Her parça sipariş ritmine göre hazırlanır.',
    instagram: 'denizorgu',
    weekly: true,
    products: [
      { title: 'Rafya Plaj Çantası — Deniz', category: 'canta', price: 1280, stock: 6, colors: ['Kum', 'Ekru'], sizes: ['Standart'], soldCount: 14, immediateDelivery: true },
      { title: 'Bambu Saplı Mini Çanta', category: 'canta', price: 980, stock: 4, colors: ['Amber'], sizes: ['Mini'], soldCount: 9, immediateDelivery: false, customProductionTime: '3-5 İş Günü', measureNote: '28×18 cm; telefon ve cüzdan sığar' },
      { title: 'Hasır Sahil Sepeti', category: 'canta', price: 1120, stock: 5, colors: ['Karamel'], sizes: ['Standart'], soldCount: 11, immediateDelivery: true },
      { title: 'Zeytin Yeşili Clutch', category: 'canta', price: 740, stock: 8, colors: ['Zeytin yeşili'], sizes: ['Tek beden'], soldCount: 7, immediateDelivery: true, isSponsored: true }
    ]
  },
  {
    email: 'lal.taki@test.local',
    name: 'Lal Takı',
    magazaAdi: 'Lal Takı Atölyesi',
    magazaTuru: ['taki'],
    sehir: 'İstanbul',
    ilce: 'Kadıköy',
    adres: 'Moda Cad. No:45',
    telefon: '05551110002',
    aciklama: 'Minimal gümüş ve doğal taş takılar. Hediye kutusuyla gönderilir.',
    instagram: 'laltaki',
    weekly: true,
    products: [
      { title: 'İnci Damla Küpe', category: 'taki', price: 890, stock: 10, colors: ['İnci'], sizes: ['Tek beden'], soldCount: 18, immediateDelivery: true, isSponsored: true },
      { title: 'Gümüş Zincir Kolye', category: 'taki', price: 1240, stock: 7, colors: ['Gümüş'], sizes: ['45 cm'], soldCount: 12, immediateDelivery: true },
      { title: 'Pirinç Yüzük Seti', category: 'taki', price: 980, stock: 6, colors: ['Pirinç'], sizes: ['14', '16'], soldCount: 8, immediateDelivery: false, customProductionTime: '5-7 İş Günü', measureNote: 'Yüzük ölçüsü checkout notunda yazılmalı' },
      { title: 'Ametist Taş Kolye', category: 'taki', price: 1560, stock: 4, colors: ['Ametist'], sizes: ['50 cm'], soldCount: 5, immediateDelivery: true }
    ]
  },
  {
    email: 'ada.seramik@test.local',
    name: 'Ada Seramik',
    magazaAdi: 'Ada Seramik Atölyesi',
    magazaTuru: ['seramik', 'ev-dekorasyon'],
    sehir: 'Eskişehir',
    ilce: 'Odunpazarı',
    adres: 'Atatürk Bulvarı No:3',
    telefon: '05551110003',
    aciklama: 'El tornasında şekillenen seramik kaseler ve vitrin objeleri.',
    instagram: 'adaseramik',
    weekly: false,
    products: [
      { title: 'Terra Seramik Kase', category: 'seramik', price: 780, stock: 9, colors: ['Terra', 'Krem'], sizes: ['Tek boy'], soldCount: 10, immediateDelivery: true },
      { title: 'Sırlı Kahve Fincanı', category: 'seramik', price: 420, stock: 14, colors: ['Krem'], sizes: ['200 ml'], soldCount: 22, immediateDelivery: true, isSponsored: true },
      { title: 'El Yapımı Vazo — Küçük', category: 'ev-dekorasyon', price: 960, stock: 3, colors: ['Kum'], sizes: ['18 cm'], soldCount: 4, immediateDelivery: false, customProductionTime: '7-10 İş Günü' }
    ]
  },
  {
    email: 'yaman.ahsap@test.local',
    name: 'Yaman Ahşap',
    magazaAdi: 'Yaman Ahşap Atölyesi',
    magazaTuru: ['ahsap', 'mutfak-esyalari'],
    sehir: 'Bursa',
    ilce: 'Nilüfer',
    adres: 'Organize Sanayi 2. Cad. No:18',
    telefon: '05551110004',
    aciklama: 'Ceviz ve meşe sunum tahtaları, mutfak aksesuarları.',
    instagram: 'yamanahsap',
    weekly: true,
    products: [
      { title: 'Ceviz Sunum Tepsisi', category: 'ahsap', price: 1280, stock: 5, colors: ['Ceviz'], sizes: ['40 cm'], soldCount: 9, immediateDelivery: true },
      { title: 'Meşe Kesme Tahtası', category: 'mutfak-esyalari', price: 640, stock: 11, colors: ['Açık meşe'], sizes: ['30 cm'], soldCount: 15, immediateDelivery: true },
      { title: 'Ahşap Saplı Örgü Çanta', category: 'canta', price: 1450, stock: 4, colors: ['Tarçın', 'Ekru'], sizes: ['Standart'], soldCount: 6, immediateDelivery: false, customProductionTime: '3-5 İş Günü', isSponsored: true }
    ]
  },
  {
    email: 'nil.hediye@test.local',
    name: 'Nil Hediye',
    magazaAdi: 'Nil Hediye Kutusu',
    magazaTuru: ['hediye-kutulari', 'mum'],
    sehir: 'Ankara',
    ilce: 'Çankaya',
    adres: 'Tunalı Hilmi Cad. No:88',
    telefon: '05551110005',
    aciklama: 'Özel günler için el yapımı hediye kutuları ve soya mumlar.',
    instagram: 'nilhediye',
    weekly: false,
    products: [
      { title: 'Doğum Günü Hediye Kutusu', category: 'hediye-kutulari', price: 890, stock: 8, colors: ['Pudra', 'Ekru'], sizes: ['Standart'], soldCount: 16, immediateDelivery: true, isSponsored: true },
      { title: 'Portakal Kabuğu Soya Mum', category: 'mum', price: 340, stock: 20, colors: ['Amber'], sizes: ['180 ml'], soldCount: 28, immediateDelivery: true },
      { title: 'Ölçüye Özel Hediye Seti', category: 'kisisellestirilebilir', price: 1180, stock: 5, colors: ['Karma'], sizes: ['Özel'], soldCount: 3, immediateDelivery: false, customProductionTime: '5-7 İş Günü', measureNote: 'Checkout’ta kime ve hangi gün için not bırakın' }
    ]
  }
];

const pickImages = (category, index) => {
  const pool = category === 'taki' || category === 'hediye-kutulari' || category === 'mum'
    ? [...IMAGES.taki, ...IMAGES.other]
    : category === 'canta' || category === 'makrome'
      ? IMAGES.canta
      : [...IMAGES.other, ...IMAGES.canta];
  const main = pool[index % pool.length];
  const extra = [
    pool[(index + 1) % pool.length],
    pool[(index + 2) % pool.length]
  ].filter((src) => src && src !== main);
  return { image: main, additionalImages: extra };
};

const ensureSeller = async (atelier, index) => {
  let user = await User.findOne({ email: atelier.email });
  if (!user) {
    user = await User.create({
      adSoyad: atelier.name,
      email: atelier.email,
      sifre: PASSWORD,
      telefon: atelier.telefon,
      rol: 'seller'
    });
  } else if (user.rol !== 'seller') {
    user.rol = 'seller';
    await user.save();
  }

  let seller = await Seller.findOne({ user: user._id });
  if (!seller) {
    seller = await Seller.create({
      user: user._id,
      magazaAdi: atelier.magazaAdi,
      hesapTipi: 'bireysel',
      magazaTuru: atelier.magazaTuru,
      aciklama: atelier.aciklama,
      telefon: atelier.telefon,
      sehir: atelier.sehir,
      ilce: atelier.ilce,
      adres: atelier.adres,
      iban: `TR33000610051978645784${String(1000 + index).slice(-4)}`,
      tcKimlik: validTckn(String(200000000 + index)),
      instagram: atelier.instagram,
      sozlesmeOnay: true,
      durum: 'approved'
    });
  } else {
    seller.magazaAdi = atelier.magazaAdi;
    seller.magazaTuru = atelier.magazaTuru;
    seller.aciklama = atelier.aciklama;
    seller.sehir = atelier.sehir;
    seller.ilce = atelier.ilce;
    seller.adres = atelier.adres;
    seller.instagram = atelier.instagram;
    seller.durum = 'approved';
    seller.reddetmeNedeni = '';
    await seller.save();
  }

  return { user, seller };
};

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI eksik (.env)');

  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });

  const summary = [];

  for (let i = 0; i < ATELIERS.length; i += 1) {
    const atelier = ATELIERS[i];
    const { user, seller } = await ensureSeller(atelier, i);

    const old = await Product.find({ seller: user._id, productCode: new RegExp(`^${PREFIX}`) }).select('_id').lean();
    const oldIds = old.map((item) => item._id);
    if (oldIds.length) {
      await FeaturedRequest.deleteMany({ product: { $in: oldIds } });
      await Product.deleteMany({ _id: { $in: oldIds } });
    }

    const createdProducts = [];
    for (let p = 0; p < atelier.products.length; p += 1) {
      const item = atelier.products[p];
      const media = pickImages(item.category, i * 10 + p);
      const code = `${PREFIX}${String(i + 1).padStart(2, '0')}${String(p + 1).padStart(2, '0')}`;
      const baseSlug = slugify(item.title, { lower: true, strict: true, locale: 'tr' });
      const slug = `${baseSlug}-test-${i + 1}-${p + 1}`;

      const sponsoredUntil = item.isSponsored
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : null;

      const product = await Product.create({
        seller: user._id,
        title: item.title,
        slug,
        description: `${item.title} — ${atelier.magazaAdi} test vitrini. El işçiliği, sınırlı adet.`,
        category: item.category,
        productCode: code,
        price: item.price,
        discountPercentage: p === 0 ? 8 : 0,
        stock: item.stock,
        colors: item.colors,
        sizes: item.sizes,
        image: media.image,
        additionalImages: media.additionalImages,
        features: ['El işçiliği', 'Atölye üretimi', 'Test vitrini'],
        careInstructions: 'Nemli bezle silin; doğrudan güneşte bırakmayın.',
        measureNote: item.measureNote || '',
        immediateDelivery: item.immediateDelivery !== false,
        customProductionTime: item.customProductionTime || '1-3 İş Günü',
        isActive: true,
        isNewProduct: true,
        approvalStatus: 'approved',
        approvedAt: new Date(),
        rating: 4.6 + (p % 4) * 0.1,
        numReviews: 3 + p,
        soldCount: item.soldCount || 0,
        isSponsored: Boolean(item.isSponsored),
        sponsoredUntil
      });

      if (item.isSponsored) {
        await FeaturedRequest.create({
          seller: user._id,
          product: product._id,
          days: 7,
          price: 0,
          status: 'live',
          startsAt: new Date(),
          endsAt: sponsoredUntil,
          note: 'Test vitrini',
          receiptUrl: ''
        });
      }

      createdProducts.push(product.title);
    }

    await WeeklyAtelier.deleteMany({ seller: user._id, note: 'Test vitrini' });
    if (atelier.weekly) {
      const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await WeeklyAtelier.create({
        seller: user._id,
        days: 7,
        price: 0,
        status: 'live',
        startsAt: new Date(),
        endsAt: until,
        note: 'Test vitrini',
        receiptUrl: ''
      });
      seller.isWeeklyAtelier = true;
      seller.weeklyUntil = until;
      await seller.save();
    } else {
      seller.isWeeklyAtelier = false;
      seller.weeklyUntil = null;
      await seller.save();
    }

    summary.push({
      magaza: seller.magazaAdi,
      slug: seller.slug,
      sehir: seller.sehir,
      email: atelier.email,
      password: PASSWORD,
      products: createdProducts.length,
      weekly: Boolean(atelier.weekly),
      path: `/atolye/${seller.slug}`
    });
  }

  console.log(JSON.stringify({
    ok: true,
    ateliers: summary.length,
    items: summary
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message || error);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
