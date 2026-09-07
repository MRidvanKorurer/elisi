// Yayın adresini .env dosyasında VITE_SITE_URL ile tanımlayın
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.nikbag.com').replace(/\/$/, '');

export const SITE_NAME = 'Nik Bag';
export const SITE_LOCALE = 'tr_TR';
export const SITE_TAGLINE = 'El Yapımı Çanta ve Tasarım Atölyesi';

export const DEFAULT_DESCRIPTION =
  'Nik Bag; giyim, çanta, mum, takı, seramik, ahşap ve ev dekorasyonu dahil el yapımı tasarım ürünleri sunan butik atölye. ' +
  'Sınırlı sayıda üretilen özel parçaları keşfedin, güvenli ödeme ve hızlı kargo ile kapınıza gelsin.';

export const DEFAULT_KEYWORDS = [
  'el yapımı çanta',
  'el örgüsü çanta',
  'el yapımı takı',
  'el yapımı seramik',
  'ahşap ürünler',
  'ev dekorasyon',
  'el yapımı mum',
  'el emeği göz nuru ürünler'
];

export const ORGANIZATION = {
  legalName: 'Nik Bag Tasarım Atölyesi',
  email: 'info@nikbag.com',
  phone: '+90 555 000 00 00',
  city: 'İstanbul',
  country: 'TR',
  social: [
    'https://www.instagram.com/nikbag',
    'https://www.facebook.com/nikbag',
    'https://tr.pinterest.com/nikbag'
  ]
};

/** Göreli yolu mutlak URL'e çevirir (canonical ve og:image için zorunlu). */
export const absoluteUrl = (path = '/') => {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

/** Sayfa başlığını marka adıyla birleştirir, 60 karakteri aşmamaya çalışır. */
export const buildTitle = (title) =>
  !title || title === SITE_NAME ? `${SITE_NAME} | ${SITE_TAGLINE}` : `${title} | ${SITE_NAME}`;

/** Açıklamaları arama sonuçlarında kesilmeyecek uzunluğa indirir. */
export const clampDescription = (text = '', limit = 158) => {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 1).replace(/[\s,.;:!-]+\S*$/, '')}…`;
};

/** Ürün adından okunabilir bir arama açıklaması üretir. */
export const productDescription = (product) => {
  if (!product) return DEFAULT_DESCRIPTION;
  const base = product.description || product.aciklama;
  if (base) return clampDescription(base);
  const parts = [
    product.title || product.name,
    product.category ? `${product.category} kategorisinde` : null,
    'el yapımı tasarım.',
    'Nik Bag güvencesiyle hızlı kargo ve kolay iade.'
  ].filter(Boolean);
  return clampDescription(parts.join(' '));
};
