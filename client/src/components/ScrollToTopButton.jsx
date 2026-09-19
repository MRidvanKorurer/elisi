import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { IconButton } from '@mui/material';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { scrollPageTop } from '../hooks/useSmoothScroll';

const scrollTop = () =>
  window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

export default function ScrollToTopButton() {
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(scrollTop() > 280);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  if (!showTop || typeof document === 'undefined') return null;

  return createPortal(
    <IconButton
      aria-label="En üste git"
      onClick={() => scrollPageTop(false)}
      sx={{
        position: 'fixed',
        left: 16,
        bottom: { xs: 96, md: 28 },
        zIndex: 1200,
        width: 48,
        height: 48,
        bgcolor: '#2E3B55',
        color: '#FFFFFF',
        boxShadow: '0 10px 24px -12px rgba(46,59,85,0.55)',
        '&:hover': { bgcolor: '#946D6D', transform: 'translateY(-2px)' },
        transition: 'transform 0.2s ease, background-color 0.2s ease'
      }}
    >
      <KeyboardArrowUpRoundedIcon />
    </IconButton>,
    document.body
  );
}
