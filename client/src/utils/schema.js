import {
  DEFAULT_DESCRIPTION,
  ORGANIZATION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  clampDescription
} from './seo';

/** Marka kimliği: Google Knowledge Panel ve site linkleri için. */
export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  legalName: ORGANIZATION.legalName,
  url: SITE_URL,
  logo: absoluteUrl('/favicon.svg'),
  image: absoluteUrl('/og-cover.jpg'),
  description: DEFAULT_DESCRIPTION,
  email: ORGANIZATION.email,
  telephone: ORGANIZATION.phone,
  address: {
    '@type': 'PostalAddress',
    addressLocality: ORGANIZATION.city,
    addressCountry: ORGANIZATION.country
  },
  sameAs: ORGANIZATION.social,
  currenciesAccepted: 'TRY',
  paymentAccepted: 'Kredi Kartı, Banka Havalesi'
});

/** Site içi arama kutusunun Google sonuçlarında görünmesini sağlar. */
export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'tr-TR',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/products?search={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  }
});

/** Arama sonuçlarındaki kırıntı navigasyonu. */
export const breadcrumbSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path)
  }))
});

/** Ürün zengin sonucu: fiyat, stok ve puan bilgisiyle. */
export const productSchema = (product, { path, price, images = [], description }) => {
  if (!product) return null;

  const name = product.title || product.name || 'El yapımı tasarım';
  const stock = Number(product.stock ?? 0);
  const rating = Number(product.rating || product.averageRating || 0);
  const reviewCount = Number(product.reviewCount || product.numReviews || 0);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(path)}#product`,
    name,
    description: clampDescription(description || product.description || product.aciklama || name, 400),
    image: images.map((image) => absoluteUrl(image)),
    sku: product.sku || product._id || product.id,
    category: product.category || product.kategori,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(path),
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
export const itemListSchema = (products = [], { path, limit = 24 } = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  url: absoluteUrl(path),
  numberOfItems: products.length,
  itemListElement: products.slice(0, limit).map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title || product.name,
    url: absoluteUrl(`/product/${product._id || product.id}`)
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
