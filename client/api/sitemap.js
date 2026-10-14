/**
 * sitemap.xml: ürün, atölye ve kategori adresleri API'den canlı alınır.
 * Her adres Türkçe ve /en sürümüyle, hreflang eşleriyle birlikte listelenir.
 */
const SITE_URL = (process.env.VITE_SITE_URL && !process.env.VITE_SITE_URL.includes('localhost')
  ? process.env.VITE_SITE_URL
  : 'https://nikbagstore.com').replace(/\/$/, '');
const API_BASE = (process.env.VITE_API_BASE_URL || 'https://elisi-fxey.onrender.com/api').replace(/\/$/, '');

const BILINGUAL_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/urunler', changefreq: 'daily', priority: '0.9' },
  { path: '/atolyeler', changefreq: 'daily', priority: '0.8' },
  { path: '/satici-ol', changefreq: 'monthly', priority: '0.6' }
];

const LEGAL_PAGES = [
  { path: '/gizlilik', changefreq: 'yearly', priority: '0.3' },
  { path: '/kvkk', changefreq: 'yearly', priority: '0.3' },
  { path: '/mesafeli-satis', changefreq: 'yearly', priority: '0.3' },
  { path: '/on-bilgilendirme', changefreq: 'yearly', priority: '0.3' },
  { path: '/iade', changefreq: 'yearly', priority: '0.3' },
  { path: '/kargo', changefreq: 'yearly', priority: '0.3' },
  { path: '/satici-sozlesmesi', changefreq: 'yearly', priority: '0.3' }
];

const escapeXml = (value = '') => String(value).replace(/[<>&'"]/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
})[char]);

const day = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const absoluteImage = (value) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

const entry = ({ loc, lastmod, changefreq, priority, alternates, image, imageTitle }) => [
  '  <url>',
  `    <loc>${escapeXml(loc)}</loc>`,
  lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
  changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
  priority ? `    <priority>${priority}</priority>` : null,
  ...(alternates || []).map(([lang, href]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}" />`),
  image ? `    <image:image><image:loc>${escapeXml(image)}</image:loc>${imageTitle ? `<image:title>${escapeXml(imageTitle)}</image:title>` : ''}</image:image>` : null,
  '  </url>'
].filter(Boolean).join('\n');

const bilingual = (page, lastmod) => {
  const tr = `${SITE_URL}${page.path}`;
  const en = `${SITE_URL}${page.path === '/' ? '/en' : `/en${page.path}`}`;
  const alternates = [['tr', tr], ['en', en], ['x-default', tr]];
  return [
    entry({ ...page, loc: tr, lastmod, alternates }),
    entry({ ...page, loc: en, lastmod, alternates })
  ];
};

const fetchEntries = async () => {
  const response = await fetch(`${API_BASE}/products/sitemap-entries`, {
    signal: AbortSignal.timeout(8000),
    headers: { accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

export default async function handler(req, res) {
  const today = day();
  let data = null;
  try {
    data = await fetchEntries();
  } catch (error) {
    console.warn(`[sitemap] API alınamadı: ${error.message}`);
  }

  const products = Array.isArray(data?.products) ? data.products : [];
  const ateliers = Array.isArray(data?.ateliers) ? data.ateliers : [];
  const categories = Array.isArray(data?.categories) ? data.categories : [];
  const latest = products[0]?.updatedAt ? day(products[0].updatedAt) : today;

  const urls = [
    ...BILINGUAL_PAGES.flatMap((page) => bilingual(page, page.path === '/' || page.path === '/urunler' ? latest : undefined)),
    ...LEGAL_PAGES.flatMap((page) => bilingual(page)),
    ...categories.flatMap((item) => bilingual({
      path: `/kategori/${encodeURIComponent(item.id)}`,
      changefreq: 'daily',
      priority: '0.8'
    }, day(item.updatedAt))),
    ...ateliers.flatMap((item) => bilingual({
      path: `/atolye/${encodeURIComponent(item.slug)}`,
      changefreq: 'weekly',
      priority: '0.6'
    }, day(item.updatedAt))),
    ...products.flatMap((item) => bilingual({
      path: `/urun/${encodeURIComponent(item.slug || item.id)}`,
      changefreq: 'weekly',
      priority: '0.8',
      image: absoluteImage(item.image),
      imageTitle: item.title
    }, day(item.updatedAt)))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', data
    ? 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
    : 'public, max-age=0, s-maxage=60');
  res.end(xml);
}
