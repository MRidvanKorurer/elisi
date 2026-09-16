/**
 * assets/ürün detay görselleri klasörlerinden ürünleri Cloudinary'ye yükler,
 * mevcut tüm ürünleri siler ve Nik Bag satıcısı altında yeniden oluşturur.
 * Kullanım: node scripts/seedAssetProducts.js
 */
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const slugify = require('slugify');

const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Review = require('../models/Review');
const ProductQuestion = require('../models/ProductQuestion');
const FeaturedRequest = require('../models/FeaturedRequest');
const { putMedia } = require('../utils/mediaStore');

const SELLER_EMAIL = 'nikbag@gmail.com';
const ASSETS_ROOT = path.join(
  __dirname,
  '..',
  '..',
  'client',
  'src',
  'assets',
  'ürün detay görselleri'
);

const IMAGE_RE = /\.(png|jpe?g|webp)$/i;

const validTckn = (seed) => {
  const d = String(seed).padStart(9, '0').split('').map(Number);
  d[0] = Math.max(1, d[0]);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  d[9] = (((odd * 7) - even) % 10 + 10) % 10;
  d[10] = d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10;
  return d.join('');
};

const mimeOf = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
};

const sortNatural = (names) =>
  names.slice().sort((a, b) =>
    a.localeCompare(b, 'tr', { numeric: true, sensitivity: 'base' })
  );

const listImages = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return sortNatural(fs.readdirSync(dir).filter((name) => IMAGE_RE.test(name))).map((name) =>
    path.join(dir, name)
  );
};

const uploadImages = async (filePaths, label) => {
  const urls = [];
  for (let i = 0; i < filePaths.length; i += 1) {
    const filePath = filePaths[i];
    const buffer = fs.readFileSync(filePath);
    process.stdout.write(`  upload ${label} [${i + 1}/${filePaths.length}] ${path.basename(filePath)} ... `);
    const url = await putMedia(
      {
        buffer,
        mimetype: mimeOf(filePath),
        originalname: path.basename(filePath)
      },
      'products'
    );
    console.log('ok');
    urls.push(url);
  }
  return urls;
};

const CANTA = [
  {
    folder: '1. ürün',
    title: 'Adaçayı Yeşili Bambu Saplı Örgü Çanta',
    price: 1450,
    discountPercentage: 0,
    stock: 6,
    colors: ['Adaçayı yeşili', 'Zeytin'],
    sizes: ['Standart'],
    features: ['El örgüsü mesh gövde', 'Doğal bambu halka sap', 'Hafif ve nefes alan doku', 'Yazlık / plaj kullanımı'],
    careInstructions: 'Nemli bezle silin. Makineye atmayın; sererek kurutun.',
    description:
      'Nik Bag Atölyesi’nde el örgüsüyle hazırlanan adaçayı yeşili mesh çanta. Doğal bambu halka sapları ve yumuşak yuvarlak tabanı ile yazlık kombinlere ferah bir dokunuş katar.',
    dimensions: { widthCm: 32, heightCm: 28, depthCm: 10, strapCm: null, weightG: 420, fits: 'Telefon, cüzdan, küçük su şişesi' },
    immediateDelivery: true,
    customProductionTime: '3-5 İş Günü',
    measureNote: 'El işçiliği nedeniyle ölçüler ±2 cm değişebilir.'
  },
  {
    folder: '2. ürün',
    title: 'Kiremit Rengi Bambu Saplı Makrome Çanta',
    price: 1490,
    discountPercentage: 5,
    stock: 5,
    colors: ['Kiremit', 'Terracotta'],
    sizes: ['Standart'],
    features: ['Makrome / örgü gövde', 'Çift bambu halka sap', 'Açık file orta panel', 'Bohem yaz stili'],
    careInstructions: 'Hafif nemli bezle silin. Doğrudan güneşte uzun süre bırakmayın.',
    description:
      'Sıcak kiremit tonlarında el örgüsü makrome çanta. Çift bambu halka sap ve nefes alan file dokusuyla günlük ve tatil kombinlerine uyum sağlar.',
    dimensions: { widthCm: 33, heightCm: 28, depthCm: 10, strapCm: null, weightG: 430, fits: 'Telefon, cüzdan, güneş kremi' },
    immediateDelivery: true,
    customProductionTime: '3-5 İş Günü',
    measureNote: 'El işçiliği nedeniyle ölçüler ±2 cm değişebilir.'
  },
  {
    folder: '3. ürün',
    title: 'Pas Rengi El Örgüsü Portföy Çanta',
    price: 1180,
    discountPercentage: 0,
    stock: 8,
    colors: ['Pas', 'Kiremit'],
    sizes: ['Standart'],
    features: ['Delikli örgü desen', 'Çerçeve üst kapama', 'Sapısız clutch form', 'Akşam / özel gün kullanımı'],
    careInstructions: 'Kuru bezle silin. Ağır yük taşımaktan kaçının.',
    description:
      'Yoğun pas tonunda el örgüsü portföy çanta. Üstte çerçeveli kapama ve delikli örgü yüzeyiyle sade, iddialı bir akşam aksesuarıdır.',
    dimensions: { widthCm: 28, heightCm: 20, depthCm: 6, strapCm: null, weightG: 310, fits: 'Telefon, kartlık, ruj' },
    immediateDelivery: true,
    customProductionTime: '2-4 İş Günü',
    measureNote: ''
  },
  {
    folder: '4. ürün',
    title: 'Vizon Örgü Omuz Çantası — Deri Saplı',
    price: 1680,
    discountPercentage: 8,
    stock: 4,
    colors: ['Vizon', 'Bej'],
    sizes: ['Standart'],
    features: ['Delikli örgü gövde', 'Krem suni deri omuz sapı', 'Metal halka ve perçin detay', 'Sıkı örgü taban'],
    careInstructions: 'Gövdeyi nemli bezle silin; deri sapı kuru bezle temizleyin.',
    description:
      'Vizon tonunda el örgüsü omuz çantası. Krem deri saplar, gümüş ton halkalar ve sıkı örgü tabanla hem günlük hem şehir kullanımına uygundur.',
    dimensions: { widthCm: 34, heightCm: 30, depthCm: 12, strapCm: 55, weightG: 480, fits: 'Tablet kılıfı, cüzdan, şişe' },
    immediateDelivery: false,
    customProductionTime: '5-7 İş Günü',
    measureNote: 'Sap uzunluğu omuzdan ölçüldüğünde yaklaşık 55 cm.'
  },
  {
    folder: '5. ürün',
    title: 'Taba File Omuz Çantası',
    price: 980,
    discountPercentage: 0,
    stock: 10,
    colors: ['Taba', 'Kahve'],
    sizes: ['Standart'],
    features: ['Klasik file örgü', 'Örgü omuz sapı', 'Sağlam sıkı taban', 'Hafif ve katlanabilir'],
    careInstructions: 'Soğuk suda elde yıkayın, sererek kurutun. Sıkmayın.',
    description:
      'Taba renginde el örgüsü file omuz çantası. Geniş iç hacmi ve hafif yapısıyla pazar, plaj ve günlük geziler için pratik bir parçadır.',
    dimensions: { widthCm: 38, heightCm: 32, depthCm: 8, strapCm: 60, weightG: 350, fits: 'Havlu, kitap, alışveriş' },
    immediateDelivery: true,
    customProductionTime: '2-4 İş Günü',
    measureNote: ''
  },
  {
    folder: '6. ürün',
    title: 'Turuncu File El Çantası — Tek Bambu Sap',
    price: 1320,
    discountPercentage: 0,
    stock: 7,
    colors: ['Turuncu', 'Terracotta'],
    sizes: ['Standart'],
    features: ['Açık file örgü', 'Tek kemer bambu sap', 'Metal halka bağlantı', 'Yapılı dikdörtgen form'],
    careInstructions: 'Nemli bezle silin. Bambu sapı ıslatmayın.',
    description:
      'Canlı turuncu file örgü el çantası. Tek kemer bambu sap ve pirinç tonu metal halkalarla modern bohem bir siluet sunar.',
    dimensions: { widthCm: 36, heightCm: 26, depthCm: 10, strapCm: null, weightG: 400, fits: 'Telefon, cüzdan, anahtarlık' },
    immediateDelivery: true,
    customProductionTime: '3-5 İş Günü',
    measureNote: ''
  },
  {
    folder: '7. ürün',
    title: 'Kum Beji Hasır Görünümlü Omuz Çantası',
    price: 1120,
    discountPercentage: 10,
    stock: 9,
    colors: ['Kum beji', 'Naturel'],
    sizes: ['Standart'],
    features: ['Hasır görünümlü örgü', 'Aynı renk omuz sapları', 'Geniş iç hacim', 'Yaz / plaj stili'],
    careInstructions: 'Hafif nemli bezle silin. Ağır ıslaklıkta bırakmayın.',
    description:
      'Kum beji hasır görünümlü el örgüsü omuz çantası. Geniş dikdörtgen formu ve yumuşak saplarıyla yazlık kombinlerin temel parçasıdır.',
    dimensions: { widthCm: 40, heightCm: 34, depthCm: 10, strapCm: 58, weightG: 390, fits: 'Havlu, kitap, güneş gözlüğü' },
    immediateDelivery: true,
    customProductionTime: '3-5 İş Günü',
    measureNote: ''
  }
];

const LIF_COLORS = [
  ['Krem', 'Sarı', 'Turkuaz', 'Mor', 'Yeşil'],
  ['Pembe', 'Beyaz', 'Mint'],
  ['Lacivert', 'Ekru'],
  ['Turuncu', 'Sarı', 'Krem'],
  ['Mor', 'Lila', 'Beyaz'],
  ['Yeşil', 'Zeytin', 'Krem'],
  ['Kırmızı', 'Beyaz'],
  ['Mavi', 'Beyaz', 'Gri'],
  ['Sarı', 'Turuncu', 'Ekru'],
  ['Fuşya', 'Pembe', 'Krem'],
  ['Bej', 'Kahve'],
  ['Turkuaz', 'Lacivert'],
  ['Lavanta', 'Mor', 'Beyaz'],
  ['Mercan', 'Krem'],
  ['Zümrüt', 'Krem'],
  ['Somon', 'Beyaz'],
  ['Hardal', 'Kahve'],
  ['Gül kurusu', 'Ekru'],
  ['Petrol', 'Beyaz'],
  ['Limon', 'Yeşil'],
  ['Bordo', 'Krem'],
  ['Gökyüzü', 'Beyaz'],
  ['Şeftali', 'Pembe'],
  ['Antrasit', 'Gri'],
  ['Narçiçeği', 'Turuncu'],
  ['Çimen yeşili', 'Krem'],
  ['İndigo', 'Beyaz'],
  ['Vizon', 'Bej'],
  ['Açık mavi', 'Pembe', 'Krem'],
  ['Çok renkli', 'Krem']
];

const LIF_TITLES = [
  'Kabarcık Desenli Renkli Yuvarlak Lif',
  'Pembe Çiçek Motifli El Örgüsü Lif',
  'Lacivert Geometrik Desenli Lif',
  'Turuncu Güneş Motifli Yuvarlak Lif',
  'Mor Yıldız Desenli Banyo Lifi',
  'Yeşil Yaprak Motifli El Örgüsü Lif',
  'Kırmızı Kalp Detaylı Yuvarlak Lif',
  'Mavi Dalga Desenli Banyo Lifi',
  'Sarı Papatya Motifli El Örgüsü Lif',
  'Fuşya Kabuk Desenli Yuvarlak Lif',
  'Bej Klasik Örgü Lif',
  'Turkuaz Nokta Desenli Lif',
  'Lavanta Çiçekli Yuvarlak Lif',
  'Mercan Renkli Kabarcık Lif',
  'Zümrüt Geçişli El Örgüsü Lif',
  'Somon Rengi Yumuşak Banyo Lifi',
  'Hardal Tonlu Klasik Lif',
  'Gül Kurusu Çiçekli Yuvarlak Lif',
  'Petrol Mavisi Geometrik Lif',
  'Limon Sarısı Noktalı Lif',
  'Bordo Kenarlı El Örgüsü Lif',
  'Gökyüzü Mavisi Kabarcık Lif',
  'Şeftali Rengi Yumuşak Lif',
  'Antrasit Modern Desenli Lif',
  'Narçiçeği Motifli Yuvarlak Lif',
  'Çimen Yeşili Yapraklı Lif',
  'İndigo Çizgili Banyo Lifi',
  'Vizon Tonlu Minimal Lif',
  'Pastel Üç Renkli Yuvarlak Lif',
  'Gökkuşağı Kabarcık Desenli Lif'
];

const BATANIYE = [
  {
    folder: 'b1',
    title: 'Hanım Dilendi Granny Square Bebek Battaniyesi — Şeftali Kenar',
    price: 1890,
    discountPercentage: 0,
    stock: 3,
    colors: ['Mercan', 'Krem', 'Mavi', 'Pembe', 'Sarı', 'Şeftali'],
    sizes: ['80x100 cm'],
    features: ['12 granny square birleşim', 'Şeftali kabuk kenar', 'Yumuşak bebek ipliği', 'Hediye edilebilir'],
    careInstructions: '30°C hassas program veya elde yıkayın. Sererek kurutun; sıkmayın.',
    description:
      'Renkli granny square’lerden oluşan el örgüsü bebek battaniyesi. Şeftali tonlu kabuk kenarı ve yumuşak dokusuyla beşik ve bebek arabası kullanımına uygundur.',
    dimensions: { widthCm: 80, heightCm: 100, depthCm: null, strapCm: null, weightG: 520, fits: '' },
    immediateDelivery: false,
    customProductionTime: '7-10 İş Günü',
    measureNote: 'Sipariş üzerine ölçü ayarı yapılabilir.'
  },
  {
    folder: 'b2',
    title: 'Renkli Granny Square Bebek Battaniyesi — Kahve Kenar',
    price: 1890,
    discountPercentage: 5,
    stock: 3,
    colors: ['Turkuaz', 'Pembe', 'Mor', 'Yeşil', 'Sarı', 'Turuncu', 'Kahve'],
    sizes: ['80x100 cm'],
    features: ['12 granny square', 'Kahve tonu birleşim ve kenar', 'Canlı renk paleti', 'El örgüsü'],
    careInstructions: '30°C hassas yıkama. Sererek kurutun.',
    description:
      'Canlı renkli granny square bebek battaniyesi. Kahve tonlu birleşim ipliği ve kabuk kenarıyla modern nursery dekoruna uyum sağlar.',
    dimensions: { widthCm: 80, heightCm: 100, depthCm: null, strapCm: null, weightG: 530, fits: '' },
    immediateDelivery: false,
    customProductionTime: '7-10 İş Günü',
    measureNote: ''
  },
  {
    folder: 'b3',
    title: 'Geometrik Blok Desenli Bebek Battaniyesi',
    price: 1750,
    discountPercentage: 0,
    stock: 4,
    colors: ['Krem', 'Turuncu', 'Hardal', 'Yeşil', 'Mavi'],
    sizes: ['75x95 cm'],
    features: ['Asimetrik renk blokları', 'Benekli krem panel', 'Kabuk kenar', 'Modern nursery stili'],
    careInstructions: 'Elde veya hassas programda yıkayın. Sererek kurutun.',
    description:
      'Krem zemin üzerinde turuncu, hardal, yeşil ve mavi bloklardan oluşan modern el örgüsü bebek battaniyesi. Kabuk kenarıyla tamamlanır.',
    dimensions: { widthCm: 75, heightCm: 95, depthCm: null, strapCm: null, weightG: 480, fits: '' },
    immediateDelivery: true,
    customProductionTime: '5-7 İş Günü',
    measureNote: ''
  }
];

const BEBEK = {
  title: 'Çizgili Bebek Yelek ve Patik Seti — Pembe / Zeytin',
  price: 980,
  discountPercentage: 0,
  stock: 5,
  colors: ['Pembe', 'Krem', 'Zeytin yeşili'],
  sizes: ['0-3 ay', '3-6 ay'],
  features: ['Yelek + patik 2’li set', '%100 el örgüsü', 'Yumuşak bebek ipliği', 'Çiçek detaylı patik'],
  careInstructions: '30°C hassas yıkama veya elde yıkayın. Sererek kurutun.',
  description:
    'Pembe, krem ve zeytin yeşili çizgili el örgüsü bebek seti. Kısa kollu açık yelek ve yanları çiçek detaylı patiklerden oluşur; yumuşak dokusuyla bebek cildine uygundur.',
  dimensions: { widthCm: null, heightCm: null, depthCm: null, strapCm: null, weightG: 180, fits: '' },
  immediateDelivery: true,
  customProductionTime: '5-7 İş Günü',
  measureNote: 'Beden seçimine göre ölçü ayarı yapılır.'
};

const YELEK = {
  title: 'Pembe Bebek Yeleği — Kabuk Kenar ve Ponpon Bağcık',
  price: 720,
  discountPercentage: 0,
  stock: 6,
  colors: ['Pastel pembe'],
  sizes: ['0-3 ay', '3-6 ay', '6-12 ay'],
  features: ['Kabuk / kabarcık örgü', 'Ön bağcıklı açık yelek', 'Ponpon uçlu bağlar', 'Kabuk kenar bitiş'],
  careInstructions: 'Elde yıkayın veya hassas program kullanın. Sererek kurutun.',
  description:
    'Pastel pembe el örgüsü bebek yeleği. Kabuk kenarlı yaka ve kol kesimleri, önünde ponponlu bağcığıyla hem şık hem pratik bir katman parçasıdır.',
  dimensions: { widthCm: null, heightCm: null, depthCm: null, strapCm: null, weightG: 120, fits: '' },
  immediateDelivery: true,
  customProductionTime: '4-6 İş Günü',
  measureNote: 'Beden seçimine göre ölçü ayarı yapılır.'
};

async function ensureNikBagSeller() {
  let user = await User.findOne({ email: new RegExp(`^${SELLER_EMAIL}$`, 'i') });
  if (!user) {
    user = await User.create({
      adSoyad: 'Nik Bag',
      email: SELLER_EMAIL,
      sifre: '1234',
      telefon: '05550001122',
      rol: 'seller'
    });
    console.log('Nik Bag kullanıcısı oluşturuldu.');
  } else if (user.rol !== 'seller' && user.rol !== 'superadmin') {
    user.rol = 'seller';
    await user.save();
  }

  let seller = await Seller.findOne({ user: user._id });
  if (!seller) {
    seller = await Seller.create({
      user: user._id,
      magazaAdi: 'Nik Bag Atölyesi',
      hesapTipi: 'bireysel',
      magazaTuru: ['canta', 'banyo-tekstili', 'bebek-cocuk', 'giyim'],
      aciklama:
        'Geleneksel el işçiliğiyle modern çizgilerin buluştuğu ev atölyesi. Çanta, lif, bebek örgüsü ve battaniye parçaları sınırlı üretimle hazırlanır.',
      telefon: user.telefon || '05550001122',
      sehir: 'İstanbul',
      ilce: 'Kadıköy',
      adres: 'Moda Cad. Atölye No:1',
      iban: 'TR330006100519786457841326',
      tcKimlik: validTckn('100000010'),
      instagram: 'nikbag',
      sozlesmeOnay: true,
      durum: 'approved'
    });
    console.log('Nik Bag satıcı kaydı oluşturuldu.');
  } else if (seller.durum !== 'approved') {
    seller.durum = 'approved';
    seller.reddetmeNedeni = '';
    await seller.save();
  }

  return user;
}

async function clearAllProducts() {
  const ids = (await Product.find({}).select('_id').lean()).map((p) => p._id);
  if (!ids.length) {
    console.log('Silinecek ürün yok.');
    return;
  }
  await Review.deleteMany({ product: { $in: ids } });
  await ProductQuestion.deleteMany({ product: { $in: ids } });
  await FeaturedRequest.deleteMany({ product: { $in: ids } });
  const result = await Product.deleteMany({});
  console.log(`Silinen ürün: ${result.deletedCount}`);
}

async function createProduct(sellerUser, meta, imageUrls, codePrefix, index) {
  const [image, ...additionalImages] = imageUrls;
  const code = `${codePrefix}-${String(index).padStart(2, '0')}`;
  const baseSlug = slugify(meta.title, { lower: true, strict: true, locale: 'tr' });
  return Product.create({
    seller: sellerUser._id,
    title: meta.title,
    slug: `${baseSlug}-${code.toLowerCase()}`,
    description: meta.description,
    category: meta.category,
    productCode: code,
    price: meta.price,
    costPrice: Math.round(meta.price * 0.45),
    shippingCostCover: 0,
    extraCost: 0,
    discountPercentage: meta.discountPercentage || 0,
    stock: meta.stock,
    colors: meta.colors,
    sizes: meta.sizes,
    features: meta.features,
    careInstructions: meta.careInstructions,
    immediateDelivery: meta.immediateDelivery,
    customProductionTime: meta.customProductionTime,
    measureNote: meta.measureNote || '',
    dimensions: meta.dimensions || {},
    image,
    additionalImages,
    video: '',
    rating: 5,
    numReviews: 0,
    soldCount: 0,
    isNewProduct: true,
    isActive: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
    rejectionReason: ''
  });
}

async function main() {
  if (!fs.existsSync(ASSETS_ROOT)) {
    throw new Error(`Assets klasörü bulunamadı: ${ASSETS_ROOT}`);
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('CLOUDINARY_* ortam değişkenleri eksik.');
  }

  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
  console.log('MongoDB bağlı.');

  const sellerUser = await ensureNikBagSeller();
  await clearAllProducts();

  const created = [];

  // 1) Çantalar
  const cantaRoot = path.join(ASSETS_ROOT, 'çanta');
  for (let i = 0; i < CANTA.length; i += 1) {
    const item = CANTA[i];
    const dir = path.join(cantaRoot, item.folder);
    const files = listImages(dir);
    if (!files.length) throw new Error(`Çanta görseli yok: ${dir}`);
    console.log(`\n[çanta ${i + 1}/${CANTA.length}] ${item.title}`);
    const urls = await uploadImages(files, `canta-${i + 1}`);
    const product = await createProduct(
      sellerUser,
      { ...item, category: 'canta' },
      urls,
      'NB-CANT',
      i + 1
    );
    created.push(product.productCode);
  }

  // 2) Lifler
  const lifRoot = path.join(ASSETS_ROOT, 'lif');
  for (let n = 1; n <= 30; n += 1) {
    const folder = `${n}. ürün`;
    const dir = path.join(lifRoot, folder);
    const files = listImages(dir);
    // Ana görsel önce (N.png), detay (N d.png) sonra
    const main = files.find((f) => path.basename(f).toLowerCase() === `${n}.png`);
    const detail = files.find((f) => path.basename(f).toLowerCase() === `${n} d.png`);
    const ordered = [main, detail, ...files.filter((f) => f !== main && f !== detail)].filter(Boolean);
    if (!ordered.length) throw new Error(`Lif görseli yok: ${dir}`);

    const colors = LIF_COLORS[n - 1] || ['Krem'];
    const title = LIF_TITLES[n - 1] || `El Örgüsü Banyo Lifi ${n}`;
    const meta = {
      title,
      category: 'banyo-tekstili',
      price: 180 + (n % 7) * 15,
      discountPercentage: n % 5 === 0 ? 10 : 0,
      stock: 12 + (n % 8),
      colors,
      sizes: ['Standart (~18-22 cm)'],
      features: [
        'El örgüsü Türk lifi',
        'Banyo / duş kullanımı',
        'Yumuşak ovma dokusu',
        'Nik Bag Atölyesi üretimi'
      ],
      careInstructions: 'Kullandıktan sonra iyice durulayın, asarak kurutun. Haftada bir ılık suda yıkayın.',
      description: `${title}. Nik Bag Atölyesi’nde el örgüsüyle hazırlanan yuvarlak banyo lifi; ${colors.join(', ')} tonlarıyla banyonuza renk katar. Nazik peeling ve zengin köpük için idealdir.`,
      dimensions: { widthCm: 20, heightCm: 20, depthCm: 1, strapCm: null, weightG: 45, fits: '' },
      immediateDelivery: true,
      customProductionTime: '1-3 İş Günü',
      measureNote: 'El örgüsü nedeniyle çap ±1-2 cm değişebilir.'
    };

    console.log(`\n[lif ${n}/30] ${title}`);
    const urls = await uploadImages(ordered, `lif-${n}`);
    const product = await createProduct(sellerUser, meta, urls, 'NB-LIF', n);
    created.push(product.productCode);
  }

  // 3) Battaniyeler
  const batRoot = path.join(ASSETS_ROOT, 'battaniye');
  for (let i = 0; i < BATANIYE.length; i += 1) {
    const item = BATANIYE[i];
    const dir = path.join(batRoot, item.folder);
    const files = listImages(dir);
    if (!files.length) throw new Error(`Battaniye görseli yok: ${dir}`);
    console.log(`\n[battaniye ${i + 1}/${BATANIYE.length}] ${item.title}`);
    const urls = await uploadImages(files, `bat-${i + 1}`);
    const product = await createProduct(
      sellerUser,
      { ...item, category: 'bebek-cocuk' },
      urls,
      'NB-BAT',
      i + 1
    );
    created.push(product.productCode);
  }

  // 4) Bebek seti (tek ürün, 3 görsel)
  {
    const files = listImages(path.join(ASSETS_ROOT, 'bebek'));
    if (!files.length) throw new Error('Bebek görselleri yok.');
    console.log(`\n[bebek] ${BEBEK.title}`);
    const urls = await uploadImages(files, 'bebek');
    const product = await createProduct(
      sellerUser,
      { ...BEBEK, category: 'bebek-cocuk' },
      urls,
      'NB-BEB',
      1
    );
    created.push(product.productCode);
  }

  // 5) Yelek
  {
    const yelekDir = path.join(ASSETS_ROOT, 'yelek');
    const files = listImages(yelekDir);
    // yelek.png önce, detay sonra
    const main = files.find((f) => path.basename(f).toLowerCase() === 'yelek.png');
    const ordered = [main, ...files.filter((f) => f !== main)].filter(Boolean);
    if (!ordered.length) throw new Error('Yelek görselleri yok.');
    console.log(`\n[yelek] ${YELEK.title}`);
    const urls = await uploadImages(ordered, 'yelek');
    const product = await createProduct(
      sellerUser,
      { ...YELEK, category: 'bebek-cocuk' },
      urls,
      'NB-YEL',
      1
    );
    created.push(product.productCode);
  }

  const total = await Product.countDocuments({ seller: sellerUser._id });
  console.log('\nTamamlandı.');
  console.log(JSON.stringify({ seller: SELLER_EMAIL, created: created.length, total, codes: created }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
