const { magazaTuruEtiket } = require('./sellerCategories');

const HOUSE_ATELIER = {
  id: 'nikbag',
  magazaAdi: 'Nik Bag Atölyesi',
  slug: null,
  magazaTuru: [],
  magazaTuruEtiket: 'El yapımı',
  aciklama: 'Geleneksel el işçiliğiyle modern çizgilerin buluştuğu ev atölyesi. Her parça sınırlı üretimle hazırlanır.',
  sehir: 'Türkiye',
  ilce: '',
  instagram: 'nikbag',
  website: '',
  avatarUrl: '',
  makerName: 'Nik Bag',
  productCount: 0,
  soldCount: 0,
  reviewCount: 0,
  rating: 0,
  categories: [],
  coverImages: [],
  sinceYear: 2024,
  isHouse: true
};

const publicInstagram = (value = '') => {
  const handle = String(value)
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/.*$/, '')
    .replace(/\?.*$/, '');
  if (!/^[A-Za-z0-9._]{2,30}$/.test(handle)) return '';
  return handle;
};

const publicWebsite = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    const host = url.hostname.replace(/^www\./, '');
    if (!host.includes('.') || host.length < 4) return '';
    return url.toString();
  } catch {
    return '';
  }
};

const serializePublicAtelier = (seller, user, extras = {}) => ({
  id: String(seller._id),
  magazaAdi: seller.magazaAdi,
  slug: seller.slug,
  magazaTuru: seller.magazaTuru || [],
  magazaTuruEtiket: magazaTuruEtiket(seller.magazaTuru) || 'Atölye',
  aciklama: seller.aciklama || '',
  sehir: seller.sehir || '',
  ilce: seller.ilce || '',
  instagram: publicInstagram(seller.instagram),
  website: publicWebsite(seller.website),
  avatarUrl: user?.avatarUrl || '',
  makerName: user?.adSoyad || seller.magazaAdi,
  hesapTipi: seller.hesapTipi === 'kurumsal' ? 'Kurumsal atölye' : 'Bağımsız üretici',
  productCount: extras.productCount || 0,
  soldCount: extras.soldCount || 0,
  reviewCount: extras.reviewCount || 0,
  rating: extras.rating || 0,
  categories: extras.categories || [],
  coverImages: extras.coverImages || [],
  sinceYear: seller.createdAt ? new Date(seller.createdAt).getFullYear() : null,
  isHouse: false
});

module.exports = { HOUSE_ATELIER, serializePublicAtelier, publicInstagram, publicWebsite };
