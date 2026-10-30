import { useEffect, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { scrollPageTop } from '../hooks/useSmoothScroll';
import SaleProductsFloat from './SaleProductsFloat';

/**
 * Viewport’a sabitlenir (App kökü). HomePage içinde kalırsa Footer’ın
 * z-index/isolation katmanının altında kaybolur.
 */
export default function ScrollToTopButton() {
  const { t } = useTranslation('common');
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!showTop) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 16,
        bottom: { xs: 128, md: 28 },
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 1
      }}
    >
      <SaleProductsFloat />
      <IconButton
        aria-label={t('actions.scrollTop', 'En üste git')}
        onClick={() => scrollPageTop(false)}
        sx={{
          width: 48,
          height: 48,
          bgcolor: '#2E3B55',
          color: '#FFFFFF',
          boxShadow: '0 10px 24px -12px rgba(46,59,85,0.55)',
          '&:hover': { bgcolor: '#946D6D' }
        }}
      >
        <KeyboardArrowUpRoundedIcon />
      </IconButton>
    </Box>
  );
}
