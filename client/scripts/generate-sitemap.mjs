/**
 * Derleme sonrası robots.txt üretir.
 * sitemap.xml her istekte api/sitemap.js tarafından canlı üretilir; burada dosya yazılmaz,
 * aksi halde statik dosya fonksiyonun önüne geçer.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, '../dist');

const rawSiteUrl = process.env.VITE_SITE_URL || '';
const SITE_URL = (rawSiteUrl && !rawSiteUrl.includes('localhost') ? rawSiteUrl : 'https://nikbagstore.com').replace(/\/$/, '');

const PRIVATE_PATHS = [
  '/panel',
  '/admin',
  '/giris',
  '/sepet',
  '/hesabim',
  '/siparis-basarili',
  '/odeme-basarisiz',
  '/auth',
  '/checkout',
  '/profile'
];

const robots = `User-agent: *
Allow: /

# Hesap, sepet, ödeme ve panel sayfaları dizine eklenmez
${PRIVATE_PATHS.flatMap((p) => [`Disallow: ${p}`, `Disallow: /en${p}`]).join('\n')}

# Arama ve sıralama varyasyonları kopya içerik üretir
Disallow: /*?search=
Disallow: /*&search=
Disallow: /*?sort=
Disallow: /*&sort=
Disallow: /*?page=
Disallow: /*&page=
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;

await writeFile(path.join(distDir, 'robots.txt'), robots, 'utf8');
console.log(`[robots] ${PRIVATE_PATHS.length * 2} özel yol engellendi (${SITE_URL}).`);
