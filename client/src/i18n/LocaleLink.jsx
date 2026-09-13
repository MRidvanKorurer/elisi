import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { localeFromPath, withLocale } from './locale';

const LocaleLink = forwardRef(function LocaleLink({ to, ...props }, ref) {
  const { pathname } = useLocation();
  const locale = localeFromPath(pathname);
  const resolved = typeof to === 'string' ? withLocale(to, locale) : to;
  return <Link ref={ref} to={resolved} {...props} />;
});

export default LocaleLink;
