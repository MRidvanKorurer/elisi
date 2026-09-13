import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { htmlLang, localeFromPath } from './locale';

import trCommon from '../locales/tr/common.json';
import trHome from '../locales/tr/home.json';
import trCatalog from '../locales/tr/catalog.json';
import trAuth from '../locales/tr/auth.json';
import trCheckout from '../locales/tr/checkout.json';
import trSeo from '../locales/tr/seo.json';
import trCategories from '../locales/tr/categories.json';
import trAccount from '../locales/tr/account.json';
import trSeller from '../locales/tr/seller.json';
import trSupport from '../locales/tr/support.json';
import trLegal from '../locales/tr/legal.json';

import enCommon from '../locales/en/common.json';
import enHome from '../locales/en/home.json';
import enCatalog from '../locales/en/catalog.json';
import enAuth from '../locales/en/auth.json';
import enCheckout from '../locales/en/checkout.json';
import enSeo from '../locales/en/seo.json';
import enCategories from '../locales/en/categories.json';
import enAccount from '../locales/en/account.json';
import enSeller from '../locales/en/seller.json';
import enSupport from '../locales/en/support.json';
import enLegal from '../locales/en/legal.json';

export const I18N_NAMESPACES = [
  'common',
  'home',
  'catalog',
  'auth',
  'checkout',
  'seo',
  'categories',
  'account',
  'seller',
  'support',
  'legal'
];

const initialLocale = typeof window !== 'undefined'
  ? localeFromPath(window.location.pathname)
  : 'tr';

if (typeof document !== 'undefined') {
  document.documentElement.lang = htmlLang(initialLocale);
}

void i18n.use(initReactI18next).init({
  resources: {
    tr: {
      common: trCommon,
      home: trHome,
      catalog: trCatalog,
      auth: trAuth,
      checkout: trCheckout,
      seo: trSeo,
      categories: trCategories,
      account: trAccount,
      seller: trSeller,
      support: trSupport,
      legal: trLegal
    },
    en: {
      common: enCommon,
      home: enHome,
      catalog: enCatalog,
      auth: enAuth,
      checkout: enCheckout,
      seo: enSeo,
      categories: enCategories,
      account: enAccount,
      seller: enSeller,
      support: enSupport,
      legal: enLegal
    }
  },
  lng: initialLocale,
  fallbackLng: 'tr',
  defaultNS: 'common',
  ns: I18N_NAMESPACES,
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false }
});

export default i18n;
