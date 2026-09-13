import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { localeFromPath, withLocale } from './locale';

export default function useLocaleNavigate() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const locale = localeFromPath(pathname);

  return useCallback((to, options) => {
    if (typeof to === 'number') return navigate(to, options);
    if (typeof to === 'string') return navigate(withLocale(to, locale), options);
    if (to && typeof to === 'object' && typeof to.pathname === 'string') {
      return navigate({ ...to, pathname: withLocale(to.pathname, locale) }, options);
    }
    return navigate(to, options);
  }, [locale, navigate]);
}
