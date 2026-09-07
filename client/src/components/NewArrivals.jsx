import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Container, IconButton } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRounded from '@mui/icons-material/ArrowForwardIosRounded';
import ProductCard, { PRODUCT_CARD_WIDTH } from './ProductCard';
import { productService } from '../api/productService';

const VISIBLE_LIMIT = 12;
const GAP = 24;

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

export default function NewArrivals({ products = [], onAddToCart }) {
  const trackRef = useRef(null);
  const progressRef = useRef(null);
  const reduced = useReducedMotion();
  const [edges, setEdges] = useState({ start: true, end: true });
  const [bestSellers, setBestSellers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    productService.getBestSellers()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.products || [];
        setBestSellers(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const arrivals = useMemo(() => {
    const source = bestSellers.length > 0 ? bestSellers : (Array.isArray(products) ? products : []);
    return [...source]
      .sort((a, b) => {
        const sold = (b.soldCount || 0) - (a.soldCount || 0);
        if (sold !== 0) return sold;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, VISIBLE_LIMIT);
  }, [bestSellers, products]);

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
  }, [syncEdges, arrivals.length]);

  const scrollByPage = (direction) => {
    const node = trackRef.current;
    if (!node) return;

    const step = PRODUCT_CARD_WIDTH + GAP;
    const perPage = Math.max(1, Math.floor(node.clientWidth / step));
    node.scrollBy({ left: direction * perPage * step, behavior: reduced ? 'auto' : 'smooth' });
  };

  if (arrivals.length === 0) return null;

  const scrollable = !(edges.start && edges.end);

  return (
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 }, mt: { xs: 1, md: 2 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ textAlign: 'left', mb: 3 }}>
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 2,
            color: '#A290B7',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <AutoAwesomeOutlined sx={{ fontSize: '18px' }} />
          ATÖLYEDEN TAZE
        </Typography>
        <Typography component="h2" variant="h4" fontWeight="800" sx={{ color: '#2E3B55', letterSpacing: '-0.5px', mt: 0.2, fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2.125rem' } }}>
          Yeni Gelenler
        </Typography>
      </Box>

      <Box sx={{ position: 'relative', px: { xs: 0, sm: 0 } }}>
        <Box
          ref={trackRef}
          role="region"
          aria-label="Çok satan ürünler"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); scrollByPage(-1); }
            if (event.key === 'ArrowRight') { event.preventDefault(); scrollByPage(1); }
          }}
          sx={{
            display: 'flex',
            gap: `${GAP}px`,
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
          {arrivals.map((product) => (
            <Box
              key={product._id}
              sx={{ flex: `0 0 ${PRODUCT_CARD_WIDTH}px`, scrollSnapAlign: 'start' }}
            >
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </Box>
          ))}
        </Box>

        {/* Kenarlardaki yumuşak geçiş, listenin devam ettiğini gösterir */}
        {!edges.start && (
          <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: -8, width: 48, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(253,244,210,0.95) 0%, rgba(253,244,210,0) 100%)' }} />
        )}
        {!edges.end && (
          <Box sx={{ position: 'absolute', top: 0, bottom: 0, right: -8, width: 48, pointerEvents: 'none', background: 'linear-gradient(270deg, rgba(253,244,210,0.95) 0%, rgba(253,244,210,0) 100%)' }} />
        )}

        {scrollable && (
          <>
            <IconButton
              aria-label="Önceki ürünler"
              disabled={edges.start}
              onClick={() => scrollByPage(-1)}
              sx={{ ...arrowSx(edges.start), position: 'absolute', top: '38%', left: { xs: -6, md: -18 }, zIndex: 2 }}
            >
              <ArrowBackIosNewRounded sx={{ fontSize: 16, ml: 0.4 }} />
            </IconButton>
            <IconButton
              aria-label="Sonraki ürünler"
              disabled={edges.end}
              onClick={() => scrollByPage(1)}
              sx={{ ...arrowSx(edges.end), position: 'absolute', top: '38%', right: { xs: -6, md: -18 }, zIndex: 2 }}
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
    </Container>
  );
}
