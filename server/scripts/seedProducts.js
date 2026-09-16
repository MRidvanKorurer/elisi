/**
 * Katalog için 10 örnek ürün ekler; her ürünün 4 görseli olur.
 *
 * Görseller mevcut atölye fotoğraf ve videolarından türetilir
 * (video kareleri + fotoğraf kırpmaları) ve uploads/products/seed altına yazılır.
 * Aynı slug varsa ürün tekrar eklenmez, betik birden çok kez çalıştırılabilir.
 *
 * Kullanım: npm run seed:products
 */
require('dotenv').config();

// Atlas SRV kayıtları için sunucuyla aynı DNS ayarları
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const mongoose = require('mongoose');
const slugify = require('slugify');

const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');

const run = promisify(execFile);

const CLIENT_ASSETS = path.join(__dirname, '../../client/src/assets');
const PHOTO_DIR = path.join(CLIENT_ASSETS, 'sendgb-p7W4jZ0UCo1');
const VIDEO_DIR = path.join(CLIENT_ASSETS, 'optimized');
const OUT_DIR = path.join(__dirname, '../uploads/products/seed');
const PUBLIC_PREFIX = '/uploads/products/seed';

// ffmpeg ikilisi client tarafındaki devDependency ile geliyor
const resolveFfmpeg = () => {
  try {
    return require(path.join(__dirname, '../../client/node_modules/ffmpeg-static'));
  } catch {
    throw new Error('ffmpeg-static bulunamadı. client klasöründe `npm install` çalıştırın.');
  }
};

// Fotoğraf kırpma çerçeveleri: aynı üründen farklı kadrajlar üretir
const CROPS = {
  full: "scale=1100:-2",
  wide: "crop=iw*0.86:ih*0.86:iw*0.07:ih*0.07,scale=1100:-2",
  detail: "crop=iw*0.55:ih*0.55:iw*0.24:ih*0.2,scale=1100:-2",
  top: "crop=iw*0.7:ih*0.7:iw*0.15:0,scale=1100:-2",
  q1: "crop=iw/2:ih/2:0:0,scale=1100:-2",
  q2: "crop=iw/2:ih/2:iw/2:0,scale=1100:-2",
  q3: "crop=iw/2:ih/2:0:ih/2,scale=1100:-2",
  q4: "crop=iw/2:ih/2:iw/2:ih/2,scale=1100:-2"
};

const PRODUCTS = [
  {
    title: 'Rafya Örgü Plaj Çantası — Deniz Serisi',
    category: 'canta',
    price: 1890,
    discountPercentage: 15,
    stock: 12,
    colors: ['Kum Beji', 'Ekru'],
    sizes: ['Standart'],
    rating: 4.9,
    numReviews: 34,
    soldCount: 58,
    immediateDelivery: true,
    features: ['Doğal rafya ip', 'Astarlı iç bölme', 'Omuz askısı', 'El örgüsü'],
    careInstructions: 'Nemli bezle silin, makinede yıkamayın. Doğrudan güneşte kurutmayın.',
    description:
      'Uzun sahil günleri için tasarlanan geniş hacimli rafya örgü plaj çantası. Her parça atölyemizde tek tek örülür; ' +
      'astarlı iç bölmesi ve rahat omuz askısı sayesinde havlunuzdan kitabınıza kadar her şeyi taşır. Doğal ipin ' +
      'zamanla yumuşayan dokusu çantayı size özel kılar.',
    media: [
      { type: 'video', file: '1.mp4', ss: 1.6 },
      { type: 'video', file: '5.mp4', ss: 2.2 },
      { type: 'video', file: '6.mp4', ss: 3.4 },
      { type: 'photo', file: 'banner4.jpeg', crop: 'wide', dir: CLIENT_ASSETS }
    ]
  },
  {
    title: 'Bambu Halka Saplı Örgü Çanta — Zeytin Yeşili',
    category: 'canta',
    price: 1650,
    discountPercentage: 0,
    stock: 8,
    colors: ['Zeytin Yeşili'],
    sizes: ['Standart'],
    rating: 5,
    numReviews: 21,
    soldCount: 37,
    immediateDelivery: true,
    features: ['Gerçek bambu halka sap', 'Sık örgü doku', 'Mıknatıslı kapama', 'El örgüsü'],
    careInstructions: 'Bambu sapları suyla temas ettirmeyin. Kuru ortamda saklayın.',
    description:
      'Zeytin yeşili ipin sıcak bambu halkalarla buluştuğu zamansız bir tasarım. Sık örgü dokusu çantaya dik bir ' +
      'duruş kazandırır; günlük kullanımda da özel davetlerde de rahatlıkla taşıyabilirsiniz. Sınırlı sayıda üretilir.',
    media: [
      { type: 'video', file: '2.mp4', ss: 1.2 },
      { type: 'photo', file: 'koyu1.jpg', crop: 'full' },
      { type: 'photo', file: 'kolaj.jpg', crop: 'q2' },
      { type: 'photo', file: 'koyu1.jpg', crop: 'detail' }
    ]
  },
  {
    title: 'Örgü Baget Clutch — Bordo Gece',
    category: 'aksesuar',
    price: 1180,
    discountPercentage: 10,
    stock: 6,
    colors: ['Bordo'],
    sizes: ['Standart'],
    rating: 4.8,
    numReviews: 17,
    soldCount: 24,
    immediateDelivery: false,
    customProductionTime: '3-5 İş Günü',
    features: ['Çerçeveli kapama', 'Saten astar', 'Zincir askı hediyeli', 'El örgüsü'],
    careInstructions: 'Toz torbasında saklayın, ağır cisim altında bırakmayın.',
    description:
      'Gece davetleri için tasarlanan bordo baget clutch. Çerçeveli kapaması ve saten astarıyla zarif bir bitiş sunar; ' +
      'kutusundan çıkan ince zincir askı sayesinde omuzda da taşınabilir. Elde örülen her parça kendine özgüdür.',
    media: [
      { type: 'video', file: '3.mp4', ss: 1.0 },
      { type: 'video', file: '3.mp4', ss: 4.2 },
      { type: 'photo', file: 'banner1.jpeg', crop: 'wide', dir: CLIENT_ASSETS },
      { type: 'video', file: '3.mp4', ss: 7.0 }
    ]
  },
  {
    title: 'Hasır Dokuma Sahil Sepeti — Karamel',
    category: 'canta',
    price: 2150,
    discountPercentage: 20,
    stock: 5,
    colors: ['Karamel', 'Taba'],
    sizes: ['Büyük'],
    rating: 4.9,
    numReviews: 28,
    soldCount: 41,
    immediateDelivery: true,
    features: ['Geniş hacim', 'Takviyeli taban', 'Deri detaylı saplar', 'El örgüsü'],
    careInstructions: 'Deri detayları nemden koruyun. Şeklini koruması için içi dolu saklayın.',
    description:
      'Pazar alışverişinden hafta sonu kaçamaklarına kadar her yere eşlik eden karamel tonlu sahil sepeti. ' +
      'Takviyeli tabanı sayesinde dolduğunda bile formunu korur, deri detaylı sapları omzunuzu yormaz.',
    media: [
      { type: 'video', file: '4.mp4', ss: 1.4 },
      { type: 'video', file: '4.mp4', ss: 4.0 },
      { type: 'video', file: '4.mp4', ss: 6.8 },
      { type: 'photo', file: 'banner4.jpeg', crop: 'detail', dir: CLIENT_ASSETS }
    ]
  },
  {
    title: 'El Örgüsü Clutch — Kiremit Kırmızısı',
    category: 'aksesuar',
    price: 940,
    discountPercentage: 0,
    stock: 9,
    colors: ['Kiremit'],
    sizes: ['Standart'],
    rating: 4.7,
    numReviews: 12,
    soldCount: 19,
    immediateDelivery: true,
    features: ['Yumuşak form', 'Fermuarlı iç cep', 'Hafif gövde', 'El örgüsü'],
    careInstructions: 'Nemli bezle silin. Ütü yapmayın.',
    description:
      'Kiremit kırmızısının sıcaklığını yumuşak bir formla buluşturan el örgüsü clutch. Hafif gövdesi ve fermuarlı ' +
      'iç cebiyle günlük kullanımda pratik, akşam kombinlerinde iddialı bir tamamlayıcı.',
    media: [
      { type: 'photo', file: '2.jpg', crop: 'full' },
      { type: 'photo', file: 'kolaj.jpg', crop: 'q4' },
      { type: 'photo', file: 'banner3.jpeg', crop: 'wide', dir: CLIENT_ASSETS },
      { type: 'photo', file: '2.jpg', crop: 'detail' }
    ]
  },
  {
    title: 'Bambu Saplı Mini Çanta — Amber',
    category: 'canta',
    price: 1290,
    discountPercentage: 0,
    stock: 7,
    colors: ['Amber', 'Hardal'],
    sizes: ['Mini'],
    rating: 4.8,
    numReviews: 15,
    soldCount: 22,
    immediateDelivery: true,
    features: ['Bambu halka sap', 'Kompakt boyut', 'Astarlı iç', 'El örgüsü'],
    careInstructions: 'Kuru ortamda, toz torbasında saklayın.',
    description:
      'Amber tonundaki mini çanta, akşam ışığında kendini gösteren sıcak bir renge sahip. Kompakt boyutuna rağmen ' +
      'telefon, cüzdan ve anahtarlığınızı rahatlıkla alır; bambu halka sapları tasarıma zarif bir imza katar.',
    media: [
      { type: 'photo', file: 'koyu2.jpg', crop: 'full' },
      { type: 'photo', file: 'koyu2.jpg', crop: 'detail' },
      { type: 'photo', file: 'koyu2.jpg', crop: 'wide' },
      { type: 'photo', file: 'banner3.jpeg', crop: 'detail', dir: CLIENT_ASSETS }
    ]
  },
  {
    title: 'El Örgüsü Kol Çantası — Nar Kırmızısı',
    category: 'canta',
    price: 1420,
    discountPercentage: 12,
    stock: 4,
    colors: ['Nar Kırmızısı'],
    sizes: ['Standart'],
    rating: 5,
    numReviews: 9,
    soldCount: 14,
    immediateDelivery: false,
    customProductionTime: '3-5 İş Günü',
    features: ['Canlı renk', 'Bambu halka sap', 'Astarlı iç bölme', 'El örgüsü'],
    careInstructions: 'Renk canlılığı için doğrudan güneş ışığında bırakmayın.',
    description:
      'Nar kırmızısının canlılığını el örgüsü dokuyla buluşturan iddialı bir kol çantası. Sade kombinleri tek başına ' +
      'taşıyacak güçte bir renk; bambu halka sapları ise tasarımı yumuşatır.',
    media: [
      { type: 'photo', file: 'koyu3.jpg', crop: 'full' },
      { type: 'photo', file: 'koyu3.jpg', crop: 'detail' },
      { type: 'photo', file: 'koyu3.jpg', crop: 'top' },
      { type: 'photo', file: 'banner3.jpeg', crop: 'wide', dir: CLIENT_ASSETS }
    ]
  },
  {
    title: 'Ahşap Saplı Örgü Çanta — Tarçın',
    category: 'ahsap',
    price: 1560,
    discountPercentage: 0,
    stock: 10,
    colors: ['Tarçın', 'Taba'],
    sizes: ['Standart'],
    rating: 4.9,
    numReviews: 19,
    soldCount: 31,
    immediateDelivery: true,
    features: ['Doğal ahşap sap', 'Sık örgü', 'Astarlı iç', 'El örgüsü'],
    careInstructions: 'Ahşap sapları ayda bir doğal yağla besleyin.',
    description:
      'Tarçın tonundaki ipin doğal ahşap saplarla dengelendiği sıcak bir tasarım. Sık örgüsü çantaya sağlam bir ' +
      'gövde kazandırır; sonbahar kombinlerinin vazgeçilmezi olmaya aday.',
    media: [
      { type: 'photo', file: 'koyu4.jpg', crop: 'full' },
      { type: 'photo', file: 'koyu4.jpg', crop: 'wide' },
      { type: 'photo', file: 'koyu4.jpg', crop: 'detail' },
      { type: 'photo', file: 'kolaj.jpg', crop: 'q1' }
    ]
  },
  {
    title: 'Örgü Omuz Çantası — Ekru Vitrin Serisi',
    category: 'makrome',
    price: 1350,
    discountPercentage: 8,
    stock: 11,
    colors: ['Ekru', 'Kum Beji'],
    sizes: ['Standart'],
    rating: 4.8,
    numReviews: 23,
    soldCount: 46,
    immediateDelivery: true,
    features: ['Uzun omuz askısı', 'Makrome doku', 'Hafif gövde', 'El örgüsü'],
    careInstructions: 'Elde, ılık suda nazikçe yıkayın; düz zeminde kurutun.',
    description:
      'Ekru ipin makrome tekniğiyle örüldüğü hafif omuz çantası. Uzun askısı sayesinde çapraz da taşınabilir; ' +
      'nötr tonu her kombinle uyumludur. Vitrin serimizin en çok tercih edilen parçalarından biri.',
    media: [
      { type: 'photo', file: 'banner2.jpeg', crop: 'wide', dir: CLIENT_ASSETS },
      { type: 'photo', file: 'kolaj.jpg', crop: 'q1' },
      { type: 'photo', file: 'banner2.jpeg', crop: 'detail', dir: CLIENT_ASSETS },
      { type: 'photo', file: 'banner4.jpeg', crop: 'full', dir: CLIENT_ASSETS }
    ]
  },
  {
    title: 'Zeytin Yeşili Örgü Clutch — Atölye Serisi',
    category: 'makrome',
    price: 1020,
    discountPercentage: 0,
    stock: 6,
    colors: ['Zeytin Yeşili', 'Adaçayı'],
    sizes: ['Standart'],
    rating: 4.9,
    numReviews: 11,
    soldCount: 18,
    immediateDelivery: true,
    features: ['Yumuşak form', 'Astarlı iç', 'Günlük kullanım', 'El örgüsü'],
    careInstructions: 'Nemli bezle silin, kuru ortamda saklayın.',
    description:
      'Adaçayı ile zeytin yeşili arasında gezinen sakin bir ton. Atölye serisinin bu clutch modeli yumuşak formu ve ' +
      'astarlı içiyle gündelik kullanıma uygun; sade tasarımı sayesinde her mevsim taşınabilir.',
    media: [
      { type: 'photo', file: '3.jpg', crop: 'full' },
      { type: 'photo', file: '3.jpg', crop: 'detail' },
      { type: 'photo', file: 'kolaj.jpg', crop: 'q3' },
      { type: 'photo', file: '3.jpg', crop: 'wide' }
    ]
  }
];

const buildSlug = (title) => slugify(title, { lower: true, strict: true, locale: 'tr' });

const renderMedia = async (ffmpeg, item, outFile) => {
  if (fs.existsSync(outFile)) return;

  if (item.type === 'video') {
    await run(ffmpeg, [
      '-y',
      '-ss', String(item.ss),
      '-i', path.join(VIDEO_DIR, item.file),
      '-frames:v', '1',
      '-vf', 'scale=1100:-2',
      '-q:v', '3',
      outFile
    ]);
    return;
  }

  await run(ffmpeg, [
    '-y',
    '-i', path.join(item.dir || PHOTO_DIR, item.file),
    '-vf', CROPS[item.crop] || CROPS.full,
    '-q:v', '3',
    outFile
  ]);
};

const main = async () => {
  const ffmpeg = resolveFfmpeg();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await connectDB();

  const owner = await User.findOne({ rol: 'superadmin' }).select('_id');
  let created = 0;
  let skipped = 0;

  for (const definition of PRODUCTS) {
    const slug = buildSlug(definition.title);

    if (await Product.findOne({ slug })) {
      console.log(`- atlandı (zaten var): ${definition.title}`);
      skipped += 1;
      continue;
    }

    const images = [];
    for (let index = 0; index < definition.media.length; index += 1) {
      const fileName = `${slug}-${index + 1}.jpg`;
      await renderMedia(ffmpeg, definition.media[index], path.join(OUT_DIR, fileName));
      images.push(`${PUBLIC_PREFIX}/${fileName}`);
    }

    const { media, ...fields } = definition;

    await new Product({
      ...fields,
      seller: owner?._id,
      image: images[0],
      additionalImages: images.slice(1),
      isActive: true,
      isNewProduct: true,
      approvalStatus: 'approved',
      approvedAt: new Date()
    }).save();

    created += 1;
    console.log(`+ eklendi: ${definition.title} (${images.length} görsel)`);
  }

  console.log(`\nToplam: ${created} ürün eklendi, ${skipped} ürün atlandı.`);
  await mongoose.connection.close();
};

main().catch(async (error) => {
  console.error('Tohumlama başarısız:', error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
