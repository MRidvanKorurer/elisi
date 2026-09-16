import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SITE_NAME,
  absoluteUrl,
  buildTitle,
  clampDescription
} from '../utils/seo';
import { ogLocale, withLocale } from '../i18n/locale';

/**
 * Sayfa başına arama motoru etiketleri.
 * React 19 title/meta/link elemanlarını otomatik olarak <head> içine taşır.
 */
export default function Seo({
  title,
  description,
  path = '/',
  image,
  keywords,
  type = 'website',
  noindex = false,
  jsonLd = null,
  children
}) {
  const { t, i18n } = useTranslation('seo');
  const locale = i18n.language === 'en' ? 'en' : 'tr';

  useEffect(() => {
    document.head.querySelectorAll('[data-default-seo]').forEach((node) => node.remove());
  }, []);

  const metaDescription = clampDescription(description || t('defaultDescription'));
  const pageTitle = buildTitle(title, t('tagline'));
  const canonical = absoluteUrl(withLocale(path, locale));
  const trUrl = absoluteUrl(withLocale(path, 'tr'));
  const enUrl = absoluteUrl(withLocale(path, 'en'));
  const ogImage = absoluteUrl(image || '/og-cover.jpg');
  const keywordList = keywords?.length
    ? keywords
    : t('keywords').split(',').map((item) => item.trim()).filter(Boolean);
  const schemas = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : [jsonLd].filter(Boolean);

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywordList.length > 0 && <meta name="keywords" content={keywordList.join(', ')} />}
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="tr" href={trUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={trUrl} />

      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}
      />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={ogLocale(locale)} />
      <meta property="og:locale:alternate" content={ogLocale(locale === 'en' ? 'tr' : 'en')} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title || SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {schemas.map((schema, index) => (
        <script
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {children}
    </>
  );
}
