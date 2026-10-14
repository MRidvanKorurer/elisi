/**
 * Ürün, atölye ve kategori sayfalarının ilk HTML'ine sayfaya özel meta etiketleri ekler.
 * Paylaşım botları (WhatsApp, Instagram, Facebook, X) JavaScript çalıştırmadığı için
 * başlık, açıklama, görsel ve JSON-LD sunucuda yazılır. React yüklenince Seo bileşeni
 * data-default-seo etiketlerini kaldırıp kendi etiketlerini koyar.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SITE_URL = (process.env.VITE_SITE_URL && !process.env.VITE_SITE_URL.includes('localhost')
  ? process.env.VITE_SITE_URL
  : 'https://nikbagstore.com').replace(/\/$/, '');
const API_BASE = (process.env.VITE_API_BASE_URL || 'https://elisi-fxey.onrender.com/api').replace(/\/$/, '');
const SITE_NAME = 'Nik Bag';
const API_TIMEOUT_MS = 4500;

const TEXT = {
  tr: {
    handmade: (name) => `El Yapımı ${name}`,
    categoryTitle: (name) => `${name} modelleri`,
    categoryDescription: (name) => `El yapımı ${name} koleksiyonu: güncel modeller, fiyatlar ve stok durumu. Nik Bag atölyesinden sınırlı sayıda üretilen tasarımlar, güvenli ödeme ve hızlı kargo ile.`,
    atelierTitle: (name) => `${name} | Atölye`,
    atelierDescription: (name) => `${name} el yapımı vitrini.`,
    home: 'Ana Sayfa',
    products: 'Ürünler',
    ateliers: 'Atölyeler',
    price: 'Fiyat',
    inStock: 'Stokta',
    outOfStock: 'Tükendi',
    ogLocale: 'tr_TR'
  },
  en: {
    handmade: (name) => `Handmade ${name}`,
    categoryTitle: (name) => `${name} pieces`,
    categoryDescription: (name) => `Handmade ${name} from Nik Bag: current pieces, prices, and stock. Limited runs, secure checkout, considered shipping.`,
    atelierTitle: (name) => `${name} | Atelier`,
    atelierDescription: (name) => `${name} handmade showcase.`,
    home: 'Home',
    products: 'Products',
    ateliers: 'Ateliers',
    price: 'Price',
    inStock: 'In stock',
    outOfStock: 'Sold out',
    ogLocale: 'en_US'
  }
};

// JavaScript çalıştırmayan botlar /en sayfalarında index.html'deki Türkçe varsayılanları görmesin
const STATIC_PAGES = {
  home: {
    pathname: '/',
    title: `${SITE_NAME} | Handmade bags and a design atelier`,
    description: 'Limited handmade work across 19 categories — apparel, bags, candles, jewelry, ceramics, wood, and home. From the Nik Bag atelier: secure checkout, considered shipping, 14-day returns.'
  },
  products: {
    pathname: '/urunler',
    title: `Handmade design collection | ${SITE_NAME}`,
    description: 'Browse Nik Bag apparel, bags, candles, jewelry, ceramics, woodwork, and other handmade pieces. Filter by price, color, and category.'
  },
  ateliers: {
    pathname: '/atolyeler',
    title: `Ateliers | ${SITE_NAME}`,
    description: 'Browse independent handmade ateliers across Turkey by city, craft, and rating. Open any shop’s full vitrine.'
  },
  seller: {
    pathname: '/satici-ol',
    title: `Sell on Nik Bag — list your handmade work | ${SITE_NAME}`,
    description: 'Bring handmade pieces to the Nik Bag vitrine. The platform share is clear: 10% of product sales, 8% after 50,000 ₺ in 90 days. Shipping is separate. Applying is free.'
  }
};

let templateCache = null;
const categoriesCache = { tr: { at: 0, list: [] }, en: { at: 0, list: [] } };

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

const clamp = (text = '', limit = 158) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 1).replace(/[\s,.;:!-]+\S*$/, '')}…`;
};

const localePath = (pathname, locale) => (locale === 'en' ? (pathname === '/' ? '/en' : `/en${pathname}`) : pathname);
const absolute = (value) => {
  if (!value) return `${SITE_URL}/og-cover.jpg`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

const salePrice = (product) => {
  const price = Number(product?.price || 0);
  const discount = Number(product?.discountPercentage || 0);
  return discount > 0 ? Math.round(price * (100 - discount)) / 100 : price;
};

const formatTRY = (value, locale = 'tr') => Number(value || 0).toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const withLang = (url, locale) => (locale === 'en' ? `${url}${url.includes('?') ? '&' : '?'}lang=en` : url);

const getJson = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS), headers: { accept: 'application/json' } });
  if (response.status === 404) return { notFound: true };
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

const loadTemplate = async (req) => {
  if (templateCache) return templateCache;
  const candidates = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html')
  ];
  for (const file of candidates) {
    try {
      const html = await readFile(file, 'utf8');
      if (html.includes('/assets/')) {
        templateCache = html;
        return html;
      }
    } catch { /* sıradaki aday */ }
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const response = await fetch(`https://${host}/index.html`, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error(`index.html ${response.status}`);
  templateCache = await response.text();
  return templateCache;
};

const loadCategories = async (locale) => {
  const cache = categoriesCache[locale];
  if (Date.now() - cache.at < 10 * 60_000 && cache.list.length) return cache.list;
  try {
    const data = await getJson(withLang(`${API_BASE}/categories`, locale));
    const list = Array.isArray(data?.categories) ? data.categories : [];
    categoriesCache[locale] = { at: Date.now(), list };
    return list;
  } catch {
    return cache.list;
  }
};

const categoryName = (categories, id) => {
  const match = categories.find((item) => item.categoryId === id || item.id === id);
  return match?.name || (id ? String(id).replace(/-/g, ' ').replace(/^\p{L}/u, (c) => c.toLocaleUpperCase('tr-TR')) : '');
};

const breadcrumb = (items, locale) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${localePath(item.path, locale)}`
  }))
});

const buildProduct = async (id, locale) => {
  const [data, categories] = await Promise.all([
    getJson(withLang(`${API_BASE}/products/${encodeURIComponent(id)}`, locale)),
    loadCategories(locale)
  ]);
  if (data?.notFound || !data?.product) return { notFound: true };

  const t = TEXT[locale];
  const product = data.product;
  const name = product.title || product.name || SITE_NAME;
  const catName = categoryName(categories, product.category);
  const pathname = `/urun/${encodeURIComponent(product.slug || product._id || product.id)}`;
  if (product.slug && id !== product.slug) return { redirect: localePath(pathname, locale) };
  const url = `${SITE_URL}${localePath(pathname, locale)}`;
  const images = [product.image, ...(Array.isArray(product.additionalImages) ? product.additionalImages : [])]
    .filter(Boolean)
    .map(absolute);
  const price = salePrice(product);
  const stock = Number(product.stock ?? 0);
  const description = clamp(product.description || `${name}. ${t.handmade(catName || SITE_NAME)}.`);
  const rating = Number(product.rating || 0);
  const reviews = Number(product.numReviews || 0);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name,
    description: clamp(product.description || name, 400),
    image: images,
    sku: product.productCode || product._id,
    category: catName || product.category,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'TRY',
      price: price.toFixed(2),
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` }
    }
  };
  if (rating > 0 && reviews > 0) {
    schema.aggregateRating = { '@type': 'AggregateRating', ratingValue: rating.toFixed(1), reviewCount: reviews, bestRating: 5, worstRating: 1 };
  }

  const crumbs = [
    { name: t.home, path: '/' },
    { name: t.products, path: '/urunler' },
    ...(product.category ? [{ name: catName, path: `/kategori/${encodeURIComponent(product.category)}` }] : []),
    { name, path: pathname }
  ];

  return {
    title: `${name}${catName ? ` - ${t.handmade(catName)}` : ''} | ${SITE_NAME}`,
    description,
    pathname,
    image: images[0],
    type: 'product',
    extraMeta: [
      ['property', 'product:price:amount', price.toFixed(2)],
      ['property', 'product:price:currency', 'TRY'],
      ['property', 'product:availability', stock > 0 ? 'in stock' : 'out of stock']
    ],
    jsonLd: [schema, breadcrumb(crumbs, locale)],
    body: `<h1>${escapeHtml(name)}</h1>
        ${images[0] ? `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(name)}" width="600" height="600" />` : ''}
        <p>${escapeHtml(t.price)}: ${escapeHtml(formatTRY(price, locale))} ₺ · ${escapeHtml(stock > 0 ? t.inStock : t.outOfStock)}</p>
        <p>${escapeHtml(product.description || '')}</p>`
  };
};

const buildAtelier = async (slug, locale) => {
  const data = await getJson(withLang(`${API_BASE}/sellers/public/${encodeURIComponent(slug)}?limit=12`, locale));
  if (data?.notFound || !data?.atelier) return { notFound: true };

  const t = TEXT[locale];
  const atelier = data.atelier;
  const name = atelier.magazaAdi || SITE_NAME;
  const pathname = `/atolye/${encodeURIComponent(atelier.slug || slug)}`;
  if (atelier.slug && slug !== atelier.slug) return { redirect: localePath(pathname, locale) };
  const url = `${SITE_URL}${localePath(pathname, locale)}`;
  const products = Array.isArray(data.products) ? data.products : [];
  const image = (atelier.coverImages || [])[0] || atelier.avatarUrl || products[0]?.image;
  const place = [atelier.ilce, atelier.sehir].filter(Boolean).join(', ');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${url}#store`,
    name,
    url,
    description: clamp(atelier.aciklama || t.atelierDescription(name), 400),
    image: absolute(image),
    ...(atelier.sehir ? { address: { '@type': 'PostalAddress', addressLocality: atelier.sehir, addressCountry: 'TR' } } : {}),
    parentOrganization: { '@id': `${SITE_URL}/#organization` }
  };
  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 12).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.title,
      url: `${SITE_URL}${localePath(productPath(product), locale)}`
    }))
  };

  return {
    title: `${t.atelierTitle(name)} | ${SITE_NAME}`,
    description: clamp(atelier.aciklama || t.atelierDescription(name)),
    pathname,
    image: absolute(image),
    type: 'profile',
    jsonLd: [schema, products.length ? list : null, breadcrumb([
      { name: t.home, path: '/' },
      { name: t.ateliers, path: '/atolyeler' },
      { name, path: pathname }
    ], locale)].filter(Boolean),
    body: `<h1>${escapeHtml(name)}</h1>
        ${place ? `<p>${escapeHtml(place)}</p>` : ''}
        <p>${escapeHtml(atelier.aciklama || '')}</p>
        ${productLinks(products, locale)}`
  };
};

const buildCategory = async (categoryId, locale) => {
  const [categories, data] = await Promise.all([
    loadCategories(locale),
    getJson(withLang(`${API_BASE}/products/filter?category=${encodeURIComponent(categoryId)}&sort=popular&limit=24`, locale)).catch(() => null)
  ]);
  const category = categories.find((item) => item.categoryId === categoryId);
  if (!category && categories.length) return { notFound: true };

  const t = TEXT[locale];
  const name = category?.name || categoryName(categories, categoryId);
  const pathname = `/kategori/${encodeURIComponent(categoryId)}`;
  const url = `${SITE_URL}${localePath(pathname, locale)}`;
  const products = Array.isArray(data?.products) ? data.products : [];

  return {
    title: `${t.categoryTitle(name)} | ${SITE_NAME}`,
    description: clamp(t.categoryDescription(name.toLocaleLowerCase(locale === 'en' ? 'en-US' : 'tr-TR'))),
    pathname,
    image: absolute(category?.image || products[0]?.image),
    type: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: t.categoryTitle(name),
        url,
        description: category?.description || undefined
      },
      products.length ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        url,
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: product.title,
          url: `${SITE_URL}${localePath(productPath(product), locale)}`
        }))
      } : null,
      breadcrumb([
        { name: t.home, path: '/' },
        { name: t.products, path: '/urunler' },
        { name, path: pathname }
      ], locale)
    ].filter(Boolean),
    body: `<h1>${escapeHtml(t.categoryTitle(name))}</h1>
        ${category?.description ? `<p>${escapeHtml(category.description)}</p>` : ''}
        ${productLinks(products, locale)}`
  };
};

const productPath = (product) => `/urun/${encodeURIComponent(product.slug || product._id || product.id)}`;

const productLinks = (products, locale) => (products.length
  ? `<ul>${products.slice(0, 24).map((product) => `<li><a href="${escapeHtml(localePath(productPath(product), locale))}">${escapeHtml(product.title)}</a> - ${escapeHtml(formatTRY(salePrice(product), locale))} ₺</li>`).join('')}</ul>`
  : '');

const renderHead = (page, locale) => {
  const t = TEXT[locale];
  const canonical = page.canonical || `${SITE_URL}${localePath(page.pathname, locale)}`;
  const trUrl = `${SITE_URL}${localePath(page.pathname, 'tr')}`;
  const enUrl = `${SITE_URL}${localePath(page.pathname, 'en')}`;
  const image = page.image || `${SITE_URL}/og-cover.jpg`;
  const tag = (attr, key, content) => `<meta ${attr}="${key}" data-default-seo content="${escapeHtml(content)}" />`;

  return [
    `<title data-default-seo>${escapeHtml(page.title)}</title>`,
    tag('name', 'description', page.description),
    tag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'),
    `<link rel="canonical" data-default-seo href="${escapeHtml(canonical)}" />`,
    `<link rel="alternate" data-default-seo hreflang="tr" href="${escapeHtml(trUrl)}" />`,
    `<link rel="alternate" data-default-seo hreflang="en" href="${escapeHtml(enUrl)}" />`,
    `<link rel="alternate" data-default-seo hreflang="x-default" href="${escapeHtml(trUrl)}" />`,
    tag('property', 'og:locale:alternate', TEXT[locale === 'en' ? 'tr' : 'en'].ogLocale),
    tag('property', 'og:type', page.type || 'website'),
    tag('property', 'og:site_name', SITE_NAME),
    tag('property', 'og:locale', t.ogLocale),
    tag('property', 'og:title', page.title),
    tag('property', 'og:description', page.description),
    tag('property', 'og:url', canonical),
    tag('property', 'og:image', image),
    tag('property', 'og:image:alt', page.title),
    tag('name', 'twitter:card', 'summary_large_image'),
    tag('name', 'twitter:title', page.title),
    tag('name', 'twitter:description', page.description),
    tag('name', 'twitter:image', image),
    ...(page.extraMeta || []).map(([attr, key, content]) => tag(attr, key, content)),
    ...(page.jsonLd || []).map((schema) => `<script type="application/ld+json" data-default-seo>${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`)
  ].join('\n    ');
};

const inject = (html, page, locale) => {
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\b[^>]*\bdata-default-seo\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*\bdata-default-seo\b[^>]*>/gi, '');

  if (locale === 'en') out = out.replace('<html lang="tr">', '<html lang="en">');
  out = out.replace('</head>', `    ${renderHead(page, locale)}\n  </head>`);
  if (page.body) {
    out = out.replace(/<noscript>[\s\S]*?<\/noscript>/i, `<noscript>\n        ${page.body}\n      </noscript>`);
  }
  return out;
};

const buildStatic = async (id, locale) => {
  const page = locale === 'en' ? STATIC_PAGES[id] : null;
  if (!page) return { passthrough: true };
  return {
    ...page,
    description: clamp(page.description),
    type: 'website',
    body: `<h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.description)}</p>`
  };
};

const BUILDERS = { product: buildProduct, atelier: buildAtelier, category: buildCategory, page: buildStatic };

export default async function handler(req, res) {
  const type = String(req.query.type || '');
  const id = String(req.query.id || '').trim();
  const locale = req.query.locale === 'en' ? 'en' : 'tr';

  let html;
  try {
    html = await loadTemplate(req);
  } catch {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  const send = (status, body, cache) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', cache);
    res.end(body);
  };

  const redirect = (location) => {
    res.statusCode = 301;
    res.setHeader('Location', location);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.end();
  };

  const builder = BUILDERS[type];
  if (!builder || !id || id.length > 200) {
    return send(200, html, 'public, max-age=0, s-maxage=60');
  }

  // Eski /urunler?category=x adresi: başka filtre yoksa kalıcı olarak /kategori/x'e taşınır
  if (req.query.legacy === '1') {
    const extra = Object.keys(req.query).filter((key) => !['type', 'id', 'locale', 'legacy', 'category', 'cat'].includes(key));
    if (!extra.length) return redirect(localePath(`/kategori/${encodeURIComponent(id)}`, locale));
  }

  try {
    const page = await builder(id, locale);
    if (page?.redirect) return redirect(page.redirect);
    if (page?.passthrough) return send(200, html, 'public, max-age=0, s-maxage=600');
    if (page?.notFound) {
      return send(404, html.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" data-default-seo content="noindex, follow" />'), 'public, max-age=0, s-maxage=120');
    }
    return send(200, inject(html, page, locale), 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  } catch (error) {
    console.warn(`[seo] ${type}/${id}: ${error.message}`);
    return send(200, html, 'public, max-age=0, s-maxage=30');
  }
}
