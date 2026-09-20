import { useEffect, useState } from 'react';
import { IconButton } from '@mui/material';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { scrollPageTop } from '../hooks/useSmoothScroll';

/**
 * Viewport’a sabitlenir (App kökü). HomePage içinde kalırsa Footer’ın
 * z-index/isolation katmanının altında kaybolur.
 */
export default function ScrollToTopButton() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!showTop) return null;

  return (
    <IconButton
      aria-label="En üste git"
      onClick={() => scrollPageTop(false)}
      sx={{
        position: 'fixed',
        left: 16,
        bottom: { xs: 96, md: 28 },
        zIndex: 32,
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
    </IconButton>
  );
}
