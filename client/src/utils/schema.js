import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  clampDescription
} from './seo';
import { withLocale } from '../i18n/locale';

/** Arama sonuçlarındaki kırıntı navigasyonu. */
export const breadcrumbSchema = (items = [], locale = 'tr') => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(withLocale(item.path, locale))
  }))
});

/** Ürün zengin sonucu: fiyat, stok ve puan bilgisiyle. */
export const productSchema = (product, { path, price, images = [], description, locale = 'tr' }) => {
  if (!product) return null;

  const locPath = withLocale(path, locale);
  const name = product.title || product.name || 'El yapımı tasarım';
  const stock = Number(product.stock ?? 0);
  const rating = Number(product.rating || product.averageRating || 0);
  const reviewCount = Number(product.reviewCount || product.numReviews || 0);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(locPath)}#product`,
    name,
    description: clampDescription(description || product.description || product.aciklama || name, 400),
    image: images.map((image) => absoluteUrl(image)),
    sku: product.sku || product._id || product.id,
    category: product.category || product.kategori,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(locPath),
      priceCurrency: 'TRY',
      price: Number(price || 0).toFixed(2),
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'TR',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      }
    }
  };

  if (product.color || product.renk) schema.color = product.color || product.renk;
  if (product.material) schema.material = product.material;

  if (rating > 0 && reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  return schema;
};

/** Kategori/listeleme sayfaları için ürün listesi. */
export const itemListSchema = (products = [], { path, limit = 24, locale = 'tr' } = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  url: absoluteUrl(withLocale(path, locale)),
  numberOfItems: products.length,
  itemListElement: products.slice(0, limit).map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title || product.name,
    url: absoluteUrl(withLocale(`/urun/${product._id || product.id}`, locale))
  }))
});

/** Sıkça sorulan sorular zengin sonucu. */
export const faqSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer }
  }))
});
