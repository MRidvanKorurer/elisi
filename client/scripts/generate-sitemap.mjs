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

// Arama motorlarına açık statik sayfalar
const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/satici-ol', changefreq: 'monthly', priority: '0.6' }
];

const escapeXml = (value = '') =>
  String(value).replace(/[<>&'"]/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  })[char]);

const urlEntry = ({ loc, lastmod, changefreq, priority, image }) =>
  [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    image ? `    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>` : null,
    '  </url>'
  ]
    .filter(Boolean)
    .join('\n');

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
    ...STATIC_ROUTES.map((route) => urlEntry({ loc: `${SITE_URL}${route.path}`, lastmod: today, ...route })),
    ...products.map((product) => {
      const image = product.image || product.gorsel;
      return urlEntry({
        loc: `${SITE_URL}/product/${product._id || product.id}`,
        lastmod: (product.updatedAt || product.createdAt || '').split('T')[0] || today,
        changefreq: 'weekly',
        priority: '0.8',
        image: image && image.startsWith('http') ? image : image ? `${SITE_URL}${image}` : null
      });
    })
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;

  const robots = `User-agent: *
Allow: /

# Kişisel ve işlemsel sayfalar dizine eklenmez
Disallow: /admin
Disallow: /auth
Disallow: /checkout
Disallow: /profile
Disallow: /siparis-basarili
Disallow: /odeme-basarisiz
Disallow: /*?search=

Sitemap: ${SITE_URL}/sitemap.xml
`;

  await Promise.all([
    writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8'),
    writeFile(path.join(distDir, 'robots.txt'), robots, 'utf8')
  ]);

  console.log(`[sitemap] ${STATIC_ROUTES.length} statik sayfa + ${products.length} ürün yazıldı (${SITE_URL}).`);
};

main().catch((error) => {
  console.error('[sitemap] Üretilemedi:', error);
  process.exit(0); // Derlemeyi bozma
});
