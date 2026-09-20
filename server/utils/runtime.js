const isProd = () => process.env.NODE_ENV === 'production';

const trimSlash = (value = '') => String(value || '').replace(/\/$/, '');

const STOREFRONT_ORIGINS = [
  'https://nikbagstore.com',
  'https://www.nikbagstore.com'
];

const clientUrl = () => trimSlash(process.env.CLIENT_URL) || (isProd() ? 'https://nikbagstore.com' : 'http://localhost:5173');
const serverUrl = () => trimSlash(process.env.SERVER_URL) || (isProd() ? 'https://elisi-fxey.onrender.com' : 'http://localhost:5000');
const siteUrl = () => trimSlash(process.env.SITE_URL || process.env.CLIENT_URL) || 'https://nikbagstore.com';

const hostsDiffer = () => {
  try {
    const cUrl = clientUrl().startsWith('http') ? clientUrl() : `https://${clientUrl()}`;
    const sUrl = serverUrl().startsWith('http') ? serverUrl() : `https://${serverUrl()}`;
    const client = new URL(cUrl);
    const server = new URL(sUrl);
    return client.host !== server.host;
  } catch {
    return true;
  }
};

const cookieOptions = () => {
  const crossSite = hostsDiffer();
  const sameSite = process.env.COOKIE_SAMESITE || (crossSite ? 'none' : 'lax');
  return {
    httpOnly: true,
    secure: isProd() || sameSite === 'none',
    sameSite,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000
  };
};

const normalizeOrigin = (value = '') => String(value || '').trim().replace(/\/$/, '').toLowerCase();

const originAliases = (origin) => {
  const clean = normalizeOrigin(origin);
  if (!clean) return [];
  const aliases = [clean];
  try {
    const url = new URL(clean);
    const host = url.hostname;
    const altHost = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
    aliases.push(normalizeOrigin(`${url.protocol}//${altHost}`));
  } catch {
    // ignore
  }
  return aliases;
};

const corsOrigins = () => {
  const origins = String(process.env.CORS_ORIGIN || process.env.CLIENT_URL || '')
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5000',
    ...STOREFRONT_ORIGINS
  ];

  defaultOrigins.forEach((origin) => {
    originAliases(origin).forEach((alias) => {
      if (!origins.includes(alias)) origins.push(alias);
    });
  });

  return origins;
};

const isAllowedCorsOrigin = (origin) => {
  if (!origin) return true;
  const allowed = new Set();
  corsOrigins().forEach((item) => originAliases(item).forEach((alias) => allowed.add(alias)));
  return originAliases(origin).some((alias) => allowed.has(alias));
};

const corsOriginDelegate = (origin, callback) => {
  if (isAllowedCorsOrigin(origin)) return callback(null, true);
  return callback(null, false);
};

const bank = () => require('./bank').envBank();

const contact = () => ({
  companyName: process.env.COMPANY_NAME || 'Nik Bag',
  legalName: process.env.COMPANY_LEGAL_NAME || process.env.COMPANY_NAME || 'Nik Bag',
  address: process.env.COMPANY_ADDRESS || '',
  email: process.env.CONTACT_EMAIL || 'info@nikbag.com',
  phone: process.env.CONTACT_PHONE || '0554 379 32 35',
  whatsapp: String(process.env.WHATSAPP_NUMBER || '905543793235').replace(/\D/g, ''),
  city: process.env.COMPANY_CITY || 'İstanbul',
  taxOffice: process.env.TAX_OFFICE || '',
  taxNumber: process.env.TAX_NUMBER || '',
  mersis: process.env.MERSIS_NO || '',
  instagram: process.env.INSTAGRAM_URL || '',
  facebook: process.env.FACEBOOK_URL || '',
  pinterest: process.env.PINTEREST_URL || ''
});

const publicSite = (overrides = {}) => ({
  ...contact(),
  bank: overrides.bank || bank(),
  clientUrl: clientUrl(),
  siteUrl: siteUrl(),
  googleClientId: String(process.env.GOOGLE_CLIENT_ID || '').trim()
});

const warnProductionConfig = () => {
  if (!isProd()) return;
  const missing = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'degistir') missing.push('JWT_SECRET');
  if (!process.env.CLIENT_URL) missing.push('CLIENT_URL');
  if (!process.env.SERVER_URL) missing.push('SERVER_URL');
  if (!process.env.SITE_URL && !process.env.CLIENT_URL) missing.push('SITE_URL');
  if (!process.env.CORS_ORIGIN && !process.env.CLIENT_URL) missing.push('CORS_ORIGIN');
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_*');
  if (missing.length) {
    console.error(`Canlı yapılandırma eksik: ${missing.join(', ')}`);
  }
  if (hostsDiffer()) {
    const sameSite = String(process.env.COOKIE_SAMESITE || cookieOptions().sameSite).toLowerCase();
    if (sameSite !== 'none') {
      console.error('Mağaza ve API farklı domainde; oturum çerezi için COOKIE_SAMESITE=none (Secure) gerekir.');
    }
  }
};

module.exports = {
  isProd,
  clientUrl,
  serverUrl,
  siteUrl,
  cookieOptions,
  corsOrigins,
  corsOriginDelegate,
  isAllowedCorsOrigin,
  bank,
  contact,
  publicSite,
  warnProductionConfig
};
