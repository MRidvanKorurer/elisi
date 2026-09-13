import { Box, ButtonBase } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { localeFromPath, switchLocalePath } from './locale';

export default function LanguageSwitch({ solid = true }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const locale = localeFromPath(location.pathname);
  const ink = solid ? '#2E3B55' : '#FFFFFF';
  const muted = solid ? 'rgba(46,59,85,0.45)' : 'rgba(255,255,255,0.55)';
  const line = solid ? 'rgba(148,109,109,0.22)' : 'rgba(255,255,255,0.28)';

  const go = (next) => {
    if (next === locale) return;
    navigate(switchLocalePath(location.pathname, location.search, location.hash, next));
  };

  return (
    <Box
      role="group"
      aria-label={t('language.switchTo')}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 34,
        px: 0.35,
        borderRadius: '999px',
        border: `1px solid ${line}`,
        backgroundColor: solid ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)'
      }}
    >
      {['tr', 'en'].map((code, index) => (
        <Box key={code} sx={{ display: 'inline-flex', alignItems: 'center' }}>
          {index > 0 && (
            <Box sx={{ width: '1px', height: 12, bgcolor: line, mx: 0.15 }} />
          )}
          <ButtonBase
            onClick={() => go(code)}
            aria-current={locale === code ? 'true' : undefined}
            sx={{
              px: 0.85,
              py: 0.35,
              borderRadius: '999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: 0.4,
              color: locale === code ? ink : muted,
              minWidth: 28
            }}
          >
            {t(`language.${code}`)}
          </ButtonBase>
        </Box>
      ))}
    </Box>
  );
}
