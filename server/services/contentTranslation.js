/**
 * Ürün, kategori ve atölye içeriğinin İngilizce kopyalarını üretir ve `en` alanına yazar.
 * Türkçe metin değiştiğinde (sourceHash tutmadığında) yeniden çevrilir.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Seller = require('../models/Seller');
const Lookbook = require('../models/Lookbook');
const { CATEGORY_LABELS_EN } = require('../constants/categories');
const { lookupColor } = require('../i18n/contentGlossary');
const { translateTexts } = require('./translationService');

const PRODUCT_TEXT_FIELDS = ['title', 'description', 'careInstructions', 'customProductionTime', 'measureNote', 'lookbookLabel'];
const PRODUCT_SOURCE_SELECT = `${PRODUCT_TEXT_FIELDS.join(' ')} features colors sizes dimensions.fits en.sourceHash`;

const clean = (value) => String(value || '').trim();
const cleanList = (list) => (Array.isArray(list) ? list.map(clean).filter(Boolean) : []);
const hashOf = (value) => crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 16);

const productSource = (doc = {}) => ({
  ...Object.fromEntries(PRODUCT_TEXT_FIELDS.map((field) => [field, clean(doc[field])])),
  features: cleanList(doc.features),
  colors: cleanList(doc.colors),
  sizes: cleanList(doc.sizes),
  fits: clean(doc.dimensions?.fits)
});

const categorySource = (doc = {}) => ({ categoryId: clean(doc.categoryId), name: clean(doc.name), description: clean(doc.description) });
const sellerSource = (doc = {}) => ({ aciklama: clean(doc.aciklama) });
const lookbookSource = (doc = {}) => ({ title: clean(doc.title), label: clean(doc.label), subtitle: clean(doc.subtitle) });

const pick = (map, overrides, key, source) => {
  if (!source) return { value: '', ok: true };
  const value = clean(overrides[key]) || map.get(source) || '';
  return { value, ok: Boolean(value) };
};

/** Bir ürünün `en` nesnesini hazırlar. `complete` false ise eksik çeviri vardır. */
const buildProductEn = async (doc, overrides = {}) => {
  const source = productSource(doc);
  const needed = [
    ...PRODUCT_TEXT_FIELDS.filter((field) => !clean(overrides[field])).map((field) => source[field]),
    ...(overrides.features ? [] : source.features),
    ...source.colors.filter((color) => !lookupColor(color)),
    ...source.sizes,
    overrides.fits ? '' : source.fits
  ];
  const map = await translateTexts(needed);

  let complete = true;
  const en = {};
  PRODUCT_TEXT_FIELDS.forEach((field) => {
    const { value, ok } = pick(map, overrides, field, source[field]);
    complete = complete && ok;
    en[field] = value;
  });

  const features = Array.isArray(overrides.features) && overrides.features.length
    ? overrides.features
    : source.features.map((item) => map.get(item) || '');
  if (features.some((item) => !item)) complete = false;
  en.features = features.length ? features.map((item, index) => item || source.features[index]) : undefined;

  const labels = (list, lookup = () => '') => {
    const out = {};
    list.forEach((item) => {
      const value = lookup(item) || map.get(item);
      if (value && value !== item) out[item] = value;
      if (!value) complete = false;
    });
    return Object.keys(out).length ? out : undefined;
  };
  en.colorLabels = labels(source.colors, lookupColor);
  en.sizeLabels = labels(source.sizes);

  const fits = pick(map, overrides, 'fits', source.fits);
  complete = complete && fits.ok;

  en.sourceHash = complete ? hashOf(source) : '';
  en.translatedAt = new Date();
  return { en, fits: fits.value, complete };
};

const saveProductEn = (id, { en, fits }) => Product.updateOne(
  { _id: id },
  { $set: { en, 'dimensions.en.fits': fits } },
  { timestamps: false }
);

const buildCategoryEn = async (doc, overrides = {}) => {
  const source = categorySource(doc);
  const fixedName = clean(overrides.name) || CATEGORY_LABELS_EN[source.categoryId] || '';
  const map = await translateTexts([fixedName ? '' : source.name, clean(overrides.description) ? '' : source.description]);
  const name = fixedName || map.get(source.name) || '';
  const description = clean(overrides.description) || (source.description ? map.get(source.description) || '' : '');
  const complete = Boolean(name) && (!source.description || Boolean(description));
  return { name, description, sourceHash: complete ? hashOf(source) : '', translatedAt: new Date(), complete };
};

const buildSellerEn = async (doc, overrides = {}) => {
  const source = sellerSource(doc);
  const fixed = clean(overrides.aciklama);
  const map = fixed || !source.aciklama ? new Map() : await translateTexts([source.aciklama]);
  const aciklama = fixed || map.get(source.aciklama) || '';
  const complete = !source.aciklama || Boolean(aciklama);
  return { aciklama, sourceHash: complete ? hashOf(source) : '', translatedAt: new Date(), complete };
};

const buildLookbookEn = async (doc) => {
  const source = lookbookSource(doc);
  const map = await translateTexts([source.title, source.label, source.subtitle]);
  const title = source.title ? map.get(source.title) || '' : '';
  const label = source.label ? map.get(source.label) || '' : '';
  const subtitle = source.subtitle ? map.get(source.subtitle) || '' : '';
  const complete = (!source.title || Boolean(title))
    && (!source.label || Boolean(label))
    && (!source.subtitle || Boolean(subtitle));
  return { title, label, subtitle, sourceHash: complete ? hashOf(source) : '', translatedAt: new Date(), complete };
};

const stripComplete = ({ complete, ...rest }) => rest;

// Çeviri başarısız olan kayıtları bir süre tekrar denemeyelim.
const retryAfter = new Map();
const RETRY_MS = 60 * 60 * 1000;
const canTry = (key) => (retryAfter.get(key) || 0) < Date.now();
const markResult = (key, complete) => {
  if (complete) retryAfter.delete(key);
  else retryAfter.set(key, Date.now() + RETRY_MS);
};

let running = false;

/** Türkçesi değişmiş veya hiç çevrilmemiş içeriği çevirir. */
const sweepTranslations = async ({ limit = 25 } = {}) => {
  if (running || mongoose.connection.readyState !== 1) return { skipped: true };
  running = true;
  const stats = { products: 0, categories: 0, sellers: 0, lookbook: 0, incomplete: 0 };
  try {
    const products = await Product.find({}).select(PRODUCT_SOURCE_SELECT).lean();
    const stale = products
      .filter((doc) => hashOf(productSource(doc)) !== doc.en?.sourceHash && canTry(`p:${doc._id}`))
      .slice(0, limit);
    for (const doc of stale) {
      const built = await buildProductEn(doc);
      await saveProductEn(doc._id, built);
      markResult(`p:${doc._id}`, built.complete);
      stats.products += 1;
      if (!built.complete) stats.incomplete += 1;
    }

    const categories = await Category.find({}).select('categoryId name description en.sourceHash').lean();
    for (const doc of categories) {
      if (hashOf(categorySource(doc)) === doc.en?.sourceHash || !canTry(`c:${doc._id}`)) continue;
      const built = await buildCategoryEn(doc);
      await Category.updateOne({ _id: doc._id }, { $set: { en: stripComplete(built) } }, { timestamps: false });
      markResult(`c:${doc._id}`, built.complete);
      stats.categories += 1;
    }

    const sellers = await Seller.find({}).select('aciklama en.sourceHash').lean();
    for (const doc of sellers) {
      if (hashOf(sellerSource(doc)) === doc.en?.sourceHash || !canTry(`s:${doc._id}`)) continue;
      const built = await buildSellerEn(doc);
      await Seller.updateOne({ _id: doc._id }, { $set: { en: stripComplete(built) } }, { timestamps: false });
      markResult(`s:${doc._id}`, built.complete);
      stats.sellers += 1;
    }

    const clips = await Lookbook.find({}).select('title label subtitle en.sourceHash').lean();
    for (const doc of clips) {
      if (hashOf(lookbookSource(doc)) === doc.en?.sourceHash || !canTry(`l:${doc._id}`)) continue;
      const built = await buildLookbookEn(doc);
      await Lookbook.updateOne({ _id: doc._id }, { $set: { en: stripComplete(built) } }, { timestamps: false });
      markResult(`l:${doc._id}`, built.complete);
      stats.lookbook += 1;
    }

    if (stats.products || stats.categories || stats.sellers || stats.lookbook) {
      console.log('[translate] güncellendi:', JSON.stringify(stats));
    }
    return stats;
  } catch (error) {
    console.warn('[translate] tarama hatası:', error.message);
    return { error: error.message };
  } finally {
    running = false;
  }
};

let timer = null;
/** Kayıt sonrası kısa gecikmeyle tarama başlatır (art arda kayıtlar tek taramada toplanır). */
const scheduleSweep = (delayMs = 8000) => {
  clearTimeout(timer);
  timer = setTimeout(() => sweepTranslations().catch(() => {}), delayMs);
  timer.unref?.();
};

const startTranslationJobs = () => {
  scheduleSweep(30000);
  const interval = setInterval(() => sweepTranslations().catch(() => {}), 15 * 60 * 1000);
  interval.unref?.();
};

module.exports = {
  productSource,
  hashOf,
  buildProductEn,
  saveProductEn,
  buildCategoryEn,
  buildSellerEn,
  buildLookbookEn,
  stripComplete,
  sweepTranslations,
  scheduleSweep,
  startTranslationJobs
};
