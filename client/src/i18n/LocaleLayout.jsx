import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { htmlLang, localeFromPath, writeLocaleCookie } from './locale';

export default function LocaleLayout() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const locale = localeFromPath(pathname);

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
    document.documentElement.lang = htmlLang(locale);
    writeLocaleCookie(locale);
  }, [i18n, locale]);

  return <Outlet />;
}
