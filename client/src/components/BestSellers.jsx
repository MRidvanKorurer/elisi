import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import SiteContainer from './SiteContainer';
import { homeEyebrowSx, homeSectionSx, homeTitleSx } from './homeType';
import { useReducedMotion } from 'framer-motion';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRounded from '@mui/icons-material/ArrowForwardIosRounded';
import { useTranslation } from 'react-i18next';
import ProductCard, { productCardSlotSx } from './ProductCard';
import { SectionSpinner } from './LoadingButton';
import { productService } from '../api/productService';

const BESTSELLER_LIMIT = 10;
const arrowSx = (disabled) => ({
  width: 42,
  height: 42,
  borderRadius: '50%',
  color: disabled ? 'rgba(46,59,85,0.28)' : '#2E3B55',
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(148,109,109,0.18)',
  boxShadow: disabled ? 'none' : '0 10px 24px -14px rgba(46,59,85,0.6)',
  transition: 'background-color .2s ease, color .2s ease, transform .2s ease',
  '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF', transform: 'translateY(-1px)' },
  '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(148,109,109,0.12)' }
});

export default function BestSellers() {
  const { t } = useTranslation('home');
  const trackRef = useRef(null);
  const progressRef = useRef(null);
  const reduced = useReducedMotion();
  const [edges, setEdges] = useState({ start: true, end: true });
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    productService.getBestSellers()
      .then((data) => {
        if (cancelled) return;
        setFetchedProducts(Array.isArray(data) ? data : data?.products || []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const products = useMemo(() => {
    const list = Array.isArray(fetchedProducts) ? [...fetchedProducts] : [];
    return list
      .sort((a, b) => {
        const sold = (b.soldCount || 0) - (a.soldCount || 0);
        if (sold !== 0) return sold;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, BESTSELLER_LIMIT);
  }, [fetchedProducts]);

  const syncEdges = useCallback(() => {
    const node = trackRef.current;
    if (!node) return;

    const max = node.scrollWidth - node.clientWidth;
    const start = node.scrollLeft <= 1;
    const end = max <= 1 || node.scrollLeft >= max - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));

    if (progressRef.current) {
      const progress = max > 0 ? Math.min(1, Math.max(0, node.scrollLeft / max)) : 0;
      progressRef.current.style.transform = `translateX(${progress * (100 / 0.38 - 100)}%)`;
    }
  }, []);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return undefined;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        syncEdges();
      });
    };

    syncEdges();
    node.addEventListener('scroll', onScroll, { passive: true });

    const observer = new ResizeObserver(onScroll);
    observer.observe(node);

    return () => {
      node.removeEventListener('scroll', onScroll);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [syncEdges, products.length]);

  const scrollByPage = (direction) => {
    const node = trackRef.current;
    if (!node) return;

    const card = node.firstElementChild;
    const step = card ? card.getBoundingClientRect().width + 12 : node.clientWidth;
    const perPage = Math.max(1, Math.floor(node.clientWidth / step));
    node.scrollBy({ left: direction * perPage * step, behavior: reduced ? 'auto' : 'smooth' });
  };

  if (loading) {
    return (
      <SiteContainer sx={homeSectionSx}>
        <SectionSpinner />
      </SiteContainer>
    );
  }

  if (error || products.length === 0) return null;

  const scrollable = !(edges.start && edges.end);

  return (
    <SiteContainer sx={homeSectionSx}>
      <Box sx={{ textAlign: 'left', mb: 3 }}>
        <Typography sx={homeEyebrowSx}>
          <LocalFireDepartmentOutlined sx={{ fontSize: 16 }} />
          {t('bestsellers.eyebrow')}
        </Typography>
        <Typography component="h2" sx={homeTitleSx}>
          {t('bestsellers.title')}
        </Typography>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Box
          ref={trackRef}
          role="region"
          aria-label={t('bestsellers.region')}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); scrollByPage(-1); }
            if (event.key === 'ArrowRight') { event.preventDefault(); scrollByPage(1); }
          }}
          sx={{
            display: 'flex',
            gap: { xs: '12px', md: '24px' },
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            py: 1,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            '&:focus-visible': { outline: '2px solid #946D6D', outlineOffset: 4, borderRadius: '24px' }
          }}
        >
          {products.map((product) => (
            <Box
              key={product._id}
              sx={productCardSlotSx}
            >
              <ProductCard product={product} fullWidth />
            </Box>
          ))}
        </Box>

        {!edges.start && (
          <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: -8, width: 48, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(253,244,210,0.95) 0%, rgba(253,244,210,0) 100%)' }} />
        )}
        {!edges.end && (
          <Box sx={{ position: 'absolute', top: 0, bottom: 0, right: -8, width: 48, pointerEvents: 'none', background: 'linear-gradient(270deg, rgba(253,244,210,0.95) 0%, rgba(253,244,210,0) 100%)' }} />
        )}

        {scrollable && (
          <>
            <IconButton
              aria-label={t('bestsellers.prev')}
              disabled={edges.start}
              onClick={() => scrollByPage(-1)}
              sx={{ ...arrowSx(edges.start), position: 'absolute', top: '38%', left: { xs: 6, md: -18 }, zIndex: 2, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <ArrowBackIosNewRounded sx={{ fontSize: 16, ml: 0.4 }} />
            </IconButton>
            <IconButton
              aria-label={t('bestsellers.next')}
              disabled={edges.end}
              onClick={() => scrollByPage(1)}
              sx={{ ...arrowSx(edges.end), position: 'absolute', top: '38%', right: { xs: 6, md: -18 }, zIndex: 2, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <ArrowForwardIosRounded sx={{ fontSize: 16 }} />
            </IconButton>
          </>
        )}
      </Box>

      {scrollable && (
        <Box sx={{ mt: 1.5, height: 4, borderRadius: 999, backgroundColor: 'rgba(148,109,109,0.14)', overflow: 'hidden' }}>
          <Box
            ref={progressRef}
            sx={{
              height: '100%',
              width: '38%',
              borderRadius: 999,
              backgroundColor: '#946D6D',
              willChange: 'transform',
              transition: reduced ? 'none' : 'transform .2s ease'
            }}
          />
        </Box>
      )}
    </SiteContainer>
  );
}
