/**
 * efsun@gmail.com satıcısına 5 takı ürünü ekler.
 * Kullanım: node scripts/seedEfsunProducts.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');
const slugify = require('slugify');

const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');

const run = promisify(execFile);
const OUT_DIR = path.join(__dirname, '../uploads/products/seed');
const PUBLIC_PREFIX = '/uploads/products/seed';

const CROPS = {
  full: 'scale=1100:-2',
  wide: 'crop=iw*0.86:ih*0.86:iw*0.07:ih*0.07,scale=1100:-2',
  detail: 'crop=iw*0.55:ih*0.55:iw*0.24:ih*0.2,scale=1100:-2',
  top: 'crop=iw*0.7:ih*0.7:iw*0.15:0,scale=1100:-2'
};

const resolveFfmpeg = () => {
  try {
    return require(path.join(__dirname, '../../client/node_modules/ffmpeg-static'));
  } catch {
    throw new Error('ffmpeg-static bulunamadı. client klasöründe npm install çalıştırın.');
  }
};

const validTckn = (seed) => {
  const d = String(seed).padStart(9, '0').split('').map(Number);
  d[0] = Math.max(1, d[0]);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  d[9] = (((odd * 7) - even) % 10 + 10) % 10;
  d[10] = d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10;
  return d.join('');
};

const PRODUCTS = [
  {
    title: 'İnci Damla Küpe — Atölye Serisi',
    source: 'efsun-inci-kupe.png',
    category: 'taki',
    price: 890,
    discountPercentage: 0,
    stock: 10,
    colors: ['Ekru', 'İnci'],
    sizes: ['Tek beden'],
    rating: 4.9,
    numReviews: 8,
    soldCount: 11,
    immediateDelivery: true,
    features: ['İnci damla', 'Hafif kanca', 'El işçiliği', 'Hediye kutulu'],
    careInstructions: 'Parfüm ve su ile temas ettirmeyin. Yumuşak bezle silin.',
    description:
      'Krem zeminli atölye ışığında duran inci damla küpe. Hafif kancası gün boyu rahat; sade kombinleri tek başına tamamlar.'
  },
  {
    title: 'Gümüş Zincir Kolye — Minimal',
    source: 'efsun-gumus-kolye.png',
    category: 'taki',
    price: 1240,
    discountPercentage: 10,
    stock: 7,
    colors: ['Gümüş'],
    sizes: ['45 cm'],
    rating: 4.8,
    numReviews: 6,
    soldCount: 9,
    immediateDelivery: true,
    features: ['Minimal zincir', 'Ayarlanabilir uç', 'Günlük kullanım', 'El işçiliği'],
    careInstructions: 'Nemden uzak tutun. Kullanılmadığı zaman kapalı kutuda saklayın.',
    description:
      'İnce gümüş zincirin sade duruşu. Katmanlı takı kombinlerinin temel parçası; tek başına da iddiasız bir imza bırakır.'
  },
  {
    title: 'Makrome Bileklik — Gül Kurusu',
    source: 'efsun-makrome-bileklik.png',
    category: 'taki',
    price: 640,
    discountPercentage: 0,
    stock: 14,
    colors: ['Gül kurusu', 'Pudra'],
    sizes: ['Ayarlanabilir'],
    rating: 4.7,
    numReviews: 12,
    soldCount: 18,
    immediateDelivery: true,
    features: ['Makrome düğüm', 'Pirinç boncuk', 'Ayarlanabilir bağ', 'El örgüsü'],
    careInstructions: 'Islak bırakmayın. Düğümlerin gevşememesi için çekmeyin.',
    description:
      'Gül kurusu ipin pirinç boncukla bağlandığı el örgüsü bileklik. Ayarlanabilir bağı sayesinde her bileğe oturur.'
  },
  {
    title: 'Pirinç Yüzük Seti — Üçlü',
    source: 'efsun-yuzuk-seti.png',
    category: 'taki',
    price: 980,
    discountPercentage: 0,
    stock: 8,
    colors: ['Pirinç', 'Altın ton'],
    sizes: ['Set'],
    rating: 5,
    numReviews: 5,
    soldCount: 7,
    immediateDelivery: false,
    customProductionTime: '3-5 İş Günü',
    features: ['Üç ince yüzük', 'Pirinç döküm', 'Katmanlı kullanım', 'El işçiliği'],
    careInstructions: 'Kimyasallardan uzak tutun. Kararmayı yumuşak bezle silin.',
    description:
      'Üç ince pirinç yüzük birlikte veya ayrı takılır. Sipariş üzerine ölçüye göre hazırlanır; her set atölyede elde şekillenir.'
  },
  {
    title: 'Ametist Doğal Taş Kolye',
    source: 'efsun-ametist-kolye.png',
    category: 'taki',
    price: 1560,
    discountPercentage: 8,
    stock: 5,
    colors: ['Ametist', 'Gümüş'],
    sizes: ['50 cm'],
    rating: 4.9,
    numReviews: 4,
    soldCount: 6,
    immediateDelivery: true,
    features: ['Doğal ametist', 'El ile yontulmuş', 'Gümüş zincir', 'Hediye kutulu'],
    careInstructions: 'Taşı darbelerden koruyun. Nemli bezle nazikçe silin.',
    description:
      'Doğal ametist taşının gümüş zincirle buluştuğu kolye. Her taşın damarı farklıdır; bu yüzden her parça tektir.'
  }
];

const renderCrops = async (ffmpeg, sourceFile, slug) => {
  const images = [];
  const crops = ['full', 'wide', 'detail', 'top'];
  for (let index = 0; index < crops.length; index += 1) {
    const fileName = `${slug}-${index + 1}.jpg`;
    const outFile = path.join(OUT_DIR, fileName);
    if (!fs.existsSync(outFile)) {
      await run(ffmpeg, [
        '-y',
        '-i', sourceFile,
        '-vf', CROPS[crops[index]],
        '-q:v', '3',
        outFile
      ]);
    }
    images.push(`${PUBLIC_PREFIX}/${fileName}`);
  }
  return images;
};

const ensureEfsun = async () => {
  let user = await User.findOne({ email: /^efsun@gmail\.com$/i });
  if (!user) {
    user = await User.create({
      adSoyad: 'Efsun Satıcı',
      email: 'efsun@gmail.com',
      sifre: '1234',
      telefon: '05551112203',
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
      magazaAdi: 'Efsun Atölye',
      hesapTipi: 'bireysel',
      magazaTuru: 'taki',
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
  } else if (seller.durum !== 'approved') {
    seller.durum = 'approved';
    seller.reddetmeNedeni = '';
    await seller.save();
  }

  return user;
};

(async () => {
  const ffmpeg = resolveFfmpeg();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
  const owner = await ensureEfsun();

  const created = [];
  const skipped = [];

  for (const definition of PRODUCTS) {
    const slug = slugify(definition.title, { lower: true, strict: true, locale: 'tr' });
    if (await Product.findOne({ slug })) {
      skipped.push(definition.title);
      continue;
    }

    const sourceFile = path.join(OUT_DIR, definition.source);
    if (!fs.existsSync(sourceFile)) {
      throw new Error(`Görsel bulunamadı: ${definition.source}`);
    }

    const images = await renderCrops(ffmpeg, sourceFile, slug);
    const { source, ...fields } = definition;

    await new Product({
      ...fields,
      seller: owner._id,
      image: images[0],
      additionalImages: images.slice(1),
      isActive: true,
      isNewProduct: true,
      approvalStatus: 'approved',
      approvedAt: new Date()
    }).save();

    created.push(definition.title);
  }

  console.log(JSON.stringify({
    createdCount: created.length,
    skippedCount: skipped.length,
    created,
    skipped
  }, null, 2));

  await mongoose.disconnect();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
