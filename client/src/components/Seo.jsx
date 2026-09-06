import { useEffect } from 'react';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  absoluteUrl,
  buildTitle,
  clampDescription
} from '../utils/seo';

/**
 * Sayfa başına arama motoru etiketleri.
 * React 19 title/meta/link elemanlarını otomatik olarak <head> içine taşır.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image,
  keywords = DEFAULT_KEYWORDS,
  type = 'website',
  noindex = false,
  jsonLd = null,
  children
}) {
  // index.html'deki varsayılan etiketler JS çalışınca kaldırılır, çift etiket kalmaz
  useEffect(() => {
    document.head.querySelectorAll('[data-default-seo]').forEach((node) => node.remove());
  }, []);

  const canonical = absoluteUrl(path);
  const metaDescription = clampDescription(description);
  const ogImage = absoluteUrl(image || '/og-cover.jpg');
  const schemas = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : [jsonLd].filter(Boolean);

  return (
    <>
      <title>{buildTitle(title)}</title>
      <meta name="description" content={metaDescription} />
      {keywords?.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <link rel="canonical" href={canonical} />

      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}
      />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={SITE_LOCALE} />
      <meta property="og:title" content={buildTitle(title)} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title || SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={buildTitle(title)} />
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
