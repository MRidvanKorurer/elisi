/**
 * Derleme sonrası sitemap.xml ve robots.txt üretir.
 * Ürünler API'den çekilir; API kapalıysa yalnızca statik sayfalar yazılır.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, '../dist');

const SITE_URL = (process.env.VITE_SITE_URL || 'https://www.nikbag.com').replace(/\/$/, '');
const API_BASE = (process.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/satici-ol', changefreq: 'monthly', priority: '0.6' },
  { path: '/gizlilik', changefreq: 'yearly', priority: '0.3' },
  { path: '/kvkk', changefreq: 'yearly', priority: '0.3' },
  { path: '/mesafeli-satis', changefreq: 'yearly', priority: '0.3' },
  { path: '/on-bilgilendirme', changefreq: 'yearly', priority: '0.3' },
  { path: '/iade', changefreq: 'yearly', priority: '0.3' },
  { path: '/kargo', changefreq: 'yearly', priority: '0.3' }
];

const escapeXml = (value = '') =>
  String(value).replace(/[<>&'"]/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  })[char]);

const localize = (pathname, locale) => {
  if (locale === 'en') return pathname === '/' ? '/en' : `/en${pathname}`;
  return pathname;
};

const abs = (pathname, locale) => `${SITE_URL}${localize(pathname, locale)}`;

const urlEntry = ({ pathname, lastmod, changefreq, priority, image, locale }) => {
  const loc = abs(pathname, locale);
  const tr = abs(pathname, 'tr');
  const en = abs(pathname, 'en');
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    `    <xhtml:link rel="alternate" hreflang="tr" href="${escapeXml(tr)}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(tr)}" />`,
    image ? `    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>` : null,
    '  </url>'
  ]
    .filter(Boolean)
    .join('\n');
};

const withLocales = (entry) => [
  urlEntry({ ...entry, locale: 'tr' }),
  urlEntry({ ...entry, locale: 'en' })
];

const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE}/products?limit=1000`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.products || data.data || [];
    return list.filter((item) => item && (item._id || item.id));
  } catch (error) {
    console.warn(`[sitemap] Ürünler alınamadı (${error.message}); yalnızca statik sayfalar yazılıyor.`);
    return [];
  }
};

const main = async () => {
  const today = new Date().toISOString().split('T')[0];
  const products = await fetchProducts();

  const entries = [
    ...STATIC_ROUTES.flatMap((route) => withLocales({
      pathname: route.path,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority
    })),
    ...products.flatMap((product) => {
      const image = product.image || product.gorsel;
      return withLocales({
        pathname: `/product/${product._id || product.id}`,
        lastmod: (product.updatedAt || product.createdAt || '').split('T')[0] || today,
        changefreq: 'weekly',
        priority: '0.8',
        image: image && image.startsWith('http') ? image : image ? `${SITE_URL}${image}` : null
      });
    })
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

  const robots = `User-agent: *
Allow: /

# Kişisel ve işlemsel sayfalar dizine eklenmez
Disallow: /admin
Disallow: /auth
Disallow: /en/auth
Disallow: /checkout
Disallow: /en/checkout
Disallow: /profile
Disallow: /en/profile
Disallow: /siparis-basarili
Disallow: /en/siparis-basarili
Disallow: /odeme-basarisiz
Disallow: /en/odeme-basarisiz
Disallow: /*?search=

Sitemap: ${SITE_URL}/sitemap.xml
`;

  await Promise.all([
    writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8'),
    writeFile(path.join(distDir, 'robots.txt'), robots, 'utf8')
  ]);

  console.log(`[sitemap] ${STATIC_ROUTES.length} statik sayfa + ${products.length} ürün, tr/en yazıldı (${SITE_URL}).`);
};

main().catch((error) => {
  console.error('[sitemap] Üretilemedi:', error);
  process.exit(1);
});
