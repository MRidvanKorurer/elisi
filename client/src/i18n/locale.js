export const SUPPORTED_LOCALES = ['tr', 'en'];
export const DEFAULT_LOCALE = 'tr';
export const LOCALE_COOKIE = 'nb_lang';
export const OPERATOR_PREFIXES = ['/panel', '/admin'];

const EN_PREFIX = /^\/en(?=\/|$)/;

export const isSupportedLocale = (value) => SUPPORTED_LOCALES.includes(value);

export const localeFromPath = (pathname = '/') =>
  pathname === '/en' || pathname.startsWith('/en/') ? 'en' : DEFAULT_LOCALE;

export const stripLocale = (pathname = '/') => {
  if (!pathname) return '/';
  const clean = pathname.replace(EN_PREFIX, '');
  return clean.startsWith('/') ? clean : `/${clean}` || '/';
};

export const isLocaleHome = (pathname = '/') => {
  const clean = stripLocale(pathname);
  return clean === '/';
};

export const isOperatorPath = (pathname = '/') => {
  const clean = stripLocale(pathname).split('?')[0];
  return OPERATOR_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`));
};

const splitPath = (to = '/') => {
  const hashIndex = to.indexOf('#');
  const hash = hashIndex >= 0 ? to.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? to.slice(0, hashIndex) : to;
  const qIndex = withoutHash.indexOf('?');
  const pathname = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const search = qIndex >= 0 ? withoutHash.slice(qIndex) : '';
  return { pathname: pathname || '/', search, hash };
};

export const withLocale = (to, locale = DEFAULT_LOCALE) => {
  if (!to || typeof to !== 'string') return to;
  if (/^(https?:|mailto:|tel:)/i.test(to)) return to;

  const { pathname, search, hash } = splitPath(to);
  const clean = stripLocale(pathname);

  if (isOperatorPath(clean)) return `${clean}${search}${hash}`;

  const localized = locale === 'en'
    ? (clean === '/' ? '/en' : `/en${clean}`)
    : clean;

  return `${localized}${search}${hash}`;
};

export const switchLocalePath = (pathname, search = '', hash = '', nextLocale) =>
  withLocale(`${stripLocale(pathname)}${search}${hash}`, nextLocale);

export const htmlLang = (locale) => (locale === 'en' ? 'en' : 'tr');
export const ogLocale = (locale) => (locale === 'en' ? 'en_US' : 'tr_TR');
export const schemaLang = (locale) => (locale === 'en' ? 'en-US' : 'tr-TR');
export const dateLocale = (locale) => (locale === 'en' ? 'en-US' : 'tr-TR');

export const writeLocaleCookie = (locale) => {
  if (typeof document === 'undefined' || !isSupportedLocale(locale)) return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
};

export const readLocaleCookie = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return isSupportedLocale(value) ? value : null;
};
