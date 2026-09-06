const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

const SITE_URL = (process.env.SITE_URL || 'https://www.nikbag.com').replace(/\/$/, '');

// Yalnızca yayında olan ürünler dizine eklenir
const publicMatch = { isActive: true, approvalStatus: { $nin: ['pending', 'rejected'] } };

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

const absolute = (value = '') => (value.startsWith('http') ? value : `${SITE_URL}${value}`);

router.get('/sitemap.xml', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const products = await Product.find(publicMatch)
      .select('_id image updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(5000)
      .lean();

    const urls = [
      ...STATIC_ROUTES.map(
        (route) =>
          `  <url>\n    <loc>${SITE_URL}${route.path}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`
      ),
      ...products.map((product) => {
        const lastmod = (product.updatedAt || product.createdAt || new Date()).toISOString().split('T')[0];
        const image = product.image ? `\n    <image:image><image:loc>${escapeXml(absolute(product.image))}</image:loc></image:image>` : '';
        return (
          `  <url>\n    <loc>${SITE_URL}/product/${product._id}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>${image}\n  </url>`
        );
      })
    ];

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
        `${urls.join('\n')}\n</urlset>\n`
    );
  } catch (error) {
    console.error('Sitemap üretilemedi:', error.message);
    res.status(500).send('Sitemap üretilemedi.');
  }
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(
    `User-agent: *\nAllow: /\n\n` +
      `Disallow: /admin\nDisallow: /auth\nDisallow: /checkout\nDisallow: /profile\n` +
      `Disallow: /siparis-basarili\nDisallow: /odeme-basarisiz\nDisallow: /*?search=\n\n` +
      `Sitemap: ${SITE_URL}/sitemap.xml\n`
  );
});

module.exports = router;
