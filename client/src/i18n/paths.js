/** Vitrin sayfa yolları (Türkçe). API uçları İngilizce kalır. */

export const PATHS = {
  home: '/',
  products: '/urunler',
  product: (id) => `/urun/${encodeURIComponent(id)}`,
  auth: '/giris',
  checkout: '/sepet',
  profile: '/hesabim',
  panel: '/panel',
  ateliers: '/atolyeler',
  atelier: (slug) => `/atolye/${encodeURIComponent(slug)}`,
  becomeSeller: '/satici-ol',
  orderSuccess: '/siparis-basarili',
  paymentFailed: '/odeme-basarisiz',
  privacy: '/gizlilik',
  kvkk: '/kvkk',
  distanceSales: '/mesafeli-satis',
  preInfo: '/on-bilgilendirme',
  returns: '/iade',
  shipping: '/kargo',
  sellerAgreement: '/satici-sozlesmesi'
};

/** Eski İngilizce yollar → yeni Türkçe (bookmark / SEO). */
export const LEGACY_PAGE_REDIRECTS = [
  { from: 'products', to: PATHS.products },
  { from: 'product/:id', to: 'urun/:id' },
  { from: 'auth', to: PATHS.auth },
  { from: 'checkout', to: PATHS.checkout },
  { from: 'profile', to: PATHS.profile },
  { from: 'admin', to: PATHS.panel }
];

export const isPanelPath = (pathname = '/') => {
  const clean = String(pathname).replace(/^\/en(?=\/|$)/, '') || '/';
  return clean === PATHS.panel || clean.startsWith(`${PATHS.panel}/`)
    || clean === '/admin' || clean.startsWith('/admin/');
};

export const isProductPath = (pathname = '/') => {
  const clean = String(pathname).replace(/^\/en(?=\/|$)/, '') || '/';
  return clean.startsWith('/urun/') || clean.startsWith('/product/');
};

export const isCheckoutPath = (pathname = '/') => {
  const clean = String(pathname).replace(/^\/en(?=\/|$)/, '') || '/';
  return clean === PATHS.checkout || clean.startsWith(`${PATHS.checkout}/`)
    || clean === '/checkout' || clean.startsWith('/checkout/');
};

export const isProductsListPath = (pathname = '/') => {
  const clean = String(pathname).replace(/^\/en(?=\/|$)/, '') || '/';
  return clean === PATHS.products || clean === '/products';
};
