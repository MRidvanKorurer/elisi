import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, Skeleton, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { categoryService } from '../api/categoryService';
import { productService } from '../api/productService';
import ProductCard, { productCardGridSx } from './ProductCard';
import { scrollPageTo } from '../hooks/useSmoothScroll';
import allCover from '../assets/banner1.jpeg';

const PAGE_SIZE = 8;
const tileRadius = { xs: '18px', md: '22px' };

function tileLayout(index) {
  if (index === 0) {
    return { gridColumn: { xs: 'span 2', md: 'span 2' }, gridRow: { xs: 'span 2', md: 'span 2' } };
  }
  if (index === 1) {
    return { gridColumn: { xs: 'span 1', md: 'span 2' }, gridRow: 'span 1' };
  }
  return { gridColumn: 'span 1', gridRow: 'span 1' };
}

function CategoryTile({ item, index, selected, reduced, onSelect }) {
  const featured = index === 0;
  const wide = index <= 1;

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onSelect(item.categoryId)}
      aria-pressed={selected}
      aria-label={`${item.name} ürünlerini göster`}
      sx={{
        ...tileLayout(index),
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        p: 0,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        borderRadius: tileRadius,
        isolation: 'isolate',
        background: item.bgGradient || 'linear-gradient(135deg, #A290B7 0%, #946D6D 100%)',
        boxShadow: selected
          ? '0 0 0 3px #FDF4D2, 0 0 0 6px #946D6D, 0 18px 36px -22px rgba(46,59,85,0.45)'
          : '0 18px 40px -28px rgba(46,59,85,0.45)',
        transform: selected ? 'translateY(-2px)' : 'none',
        transition: 'box-shadow 220ms ease, transform 220ms ease',
        '&:focus-visible': { outline: '3px solid #A290B7', outlineOffset: 3 },
        '&:hover img': reduced ? {} : { transform: 'scale(1.08)' }
      }}
    >
      {item.image ? (
        <Box
          component="img"
          src={item.image}
          alt=""
          loading="lazy"
          onError={(event) => { event.currentTarget.style.opacity = '0'; }}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: 'scale(1.02)',
            transition: 'transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1)'
          }}
        />
      ) : null}

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: selected
            ? 'linear-gradient(180deg, rgba(46,59,85,0.08) 0%, rgba(46,59,85,0.38) 46%, rgba(46,59,85,0.9) 100%)'
            : 'linear-gradient(180deg, rgba(46,59,85,0.04) 0%, rgba(46,59,85,0.28) 48%, rgba(46,59,85,0.82) 100%)',
          pointerEvents: 'none'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          p: featured ? { xs: 1.6, md: 2.2 } : { xs: 1, md: 1.3 },
          zIndex: 1
        }}
      >
        <Typography
          sx={{
            mb: 0.6,
            width: 'fit-content',
            px: 0.9,
            py: 0.2,
            borderRadius: '999px',
            backgroundColor: selected ? '#946D6D' : 'rgba(253,244,210,0.92)',
            color: selected ? '#FFFFFF' : '#946D6D',
            fontWeight: 800,
            fontSize: '0.62rem',
            letterSpacing: 1.3
          }}
        >
          {selected ? 'SEÇİLİ' : featured ? 'KEŞFET' : 'ODA'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0, width: '100%' }}>
            <Box
              component="p"
              sx={{
                m: 0,
                color: '#FDF4D2',
                fontWeight: 800,
                letterSpacing: '-0.4px',
                lineHeight: 1.2,
                wordBreak: 'break-word',
                textShadow: '0 2px 10px rgba(30,39,56,0.55)',
                fontSize: featured
                  ? { xs: '1.28rem', md: '1.65rem' }
                  : wide
                    ? { xs: '0.9rem', md: '1.02rem' }
                    : { xs: '0.82rem', md: '0.9rem' }
              }}
            >
              {item.name}
            </Box>
            <Box component="p" sx={{ m: 0, mt: 0.4, color: '#FDF4D2', fontWeight: 700, fontSize: featured ? '0.76rem' : '0.68rem', textShadow: '0 1px 8px rgba(30,39,56,0.5)' }}>
              {item.countLabel}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function CategoryProductList({ onAddToCart, onToggleFavorite, favorites = [] }) {
  const reduced = useReducedMotion();
  const productsAnchor = useRef(null);

  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [catsLoading, setCatsLoading] = useState(true);

  const [selected, setSelected] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [products, setProducts] = useState([]);
  const [totalInCategory, setTotalInCategory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    categoryService.getAllCategories()
      .then((data) => {
        if (cancelled) return;
        setCategories(data.categories || []);
        setTotalProducts(data.totalProducts || 0);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCatsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    productService.getFilteredProducts({
      category: selected === 'all' ? undefined : selected,
      page: 1,
      limit: visibleCount,
      sort: 'newest'
    })
      .then((response) => {
        if (cancelled) return;
        const list = response?.products || (Array.isArray(response) ? response : []);
        setProducts(list);
        setTotalInCategory(response?.pagination?.totalProducts ?? list.length);
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setError('Ürünler yüklenirken bir sorun oluştu.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [selected, visibleCount]);

  const sortedCats = [...categories]
    .filter((cat) => (cat.productCount || 0) > 0)
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
  const active = selected === 'all'
    ? { categoryId: 'all', name: 'Tüm koleksiyon', description: 'Atölyelerin güncel vitrini, tek bakışta.', image: allCover }
    : sortedCats.find((item) => item.categoryId === selected);

  const tiles = [
    {
      categoryId: 'all',
      name: 'Tüm koleksiyon',
      image: allCover,
      countLabel: totalProducts ? `${totalProducts} parça` : 'Tüm vitrin',
      bgGradient: 'linear-gradient(135deg, #946D6D 0%, #2E3B55 100%)'
    },
    ...sortedCats.map((cat) => ({
      categoryId: cat.categoryId,
      name: cat.name,
      image: cat.image,
      countLabel: cat.productCount ? `${cat.productCount} parça` : 'Yakında',
      bgGradient: cat.bgGradient
    }))
  ];

  const collectionPath = selected === 'all'
    ? '/products'
    : `/products?category=${encodeURIComponent(selected)}`;

  const hasMore = products.length < totalInCategory;
  const remaining = Math.max(0, totalInCategory - products.length);

  const selectCategory = (id) => {
    if (id !== selected) {
      setSelected(id);
      setVisibleCount(PAGE_SIZE);
      setProducts([]);
      setTotalInCategory(0);
    }

    const runScroll = () => {
      scrollPageTo(productsAnchor.current, { offset: -108, immediate: Boolean(reduced) });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(runScroll);
    });
  };

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 5, md: 8 },
        background: 'linear-gradient(180deg, rgba(253,244,210,0) 0%, rgba(176,205,230,0.18) 38%, rgba(253,244,210,0) 100%)'
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
            gap: 2,
            mb: { xs: 2.5, md: 3.2 }
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 2, color: '#A290B7', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              <CategoryOutlined sx={{ fontSize: 18 }} />
              ATÖLYE ODALARI
            </Typography>
            <Typography
              component="h2"
              sx={{
                color: '#2E3B55',
                fontWeight: 800,
                letterSpacing: '-0.6px',
                mt: 0.2,
                fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.2rem' }
              }}
            >
              Kategorilere Göre Keşfet
            </Typography>
            <Typography sx={{ mt: 0.8, color: '#6E5252', fontWeight: 600, maxWidth: 540, fontSize: { xs: '0.88rem', md: '0.95rem' } }}>
              Bir oda seç; o kategoriye ait ürünler hemen aşağıda açılır.
            </Typography>
          </Box>

          <Box
            component={RouterLink}
            to={collectionPath}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              alignItems: 'center',
              gap: 0.6,
              flexShrink: 0,
              px: 2,
              py: 1,
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: '#2E3B55',
              textDecoration: 'none',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(148,109,109,0.16)',
              '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF' }
            }}
          >
            Tüm vitrin
            <ArrowForwardRounded sx={{ fontSize: 18 }} />
          </Box>
        </Box>

        {catsLoading ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gridAutoRows: { xs: 108, md: 118 },
              gap: { xs: 1.1, md: 1.3 }
            }}
          >
            <Skeleton variant="rounded" sx={{ gridColumn: 'span 2', gridRow: 'span 2', borderRadius: tileRadius }} />
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" sx={{ borderRadius: tileRadius, height: '100%' }} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gridAutoRows: { xs: 108, sm: 118, md: 124 },
              gap: { xs: 1.05, md: 1.3 }
            }}
          >
            {tiles.map((item, index) => (
              <CategoryTile
                key={item.categoryId}
                item={item}
                index={index}
                selected={selected === item.categoryId}
                reduced={reduced}
                onSelect={selectCategory}
              />
            ))}
          </Box>
        )}

        <Box ref={productsAnchor} sx={{ scrollMarginTop: { xs: 88, md: 108 }, mt: { xs: 3.2, md: 4.2 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              mb: 2.4,
              p: { xs: 1.4, md: 1.7 },
              borderRadius: '22px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(148,109,109,0.14)',
              boxShadow: '0 16px 36px -26px rgba(46,59,85,0.4)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: { xs: 56, md: 68 },
                  height: { xs: 56, md: 68 },
                  borderRadius: '16px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: '#F3E8D8'
                }}
              >
                {active?.image ? (
                  <Box component="img" src={active.image} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : null}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: '#2E3B55', fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.22rem' }, letterSpacing: '-0.3px' }}>
                  {active?.name || 'Koleksiyon'}
                </Typography>
                <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.82rem' }}>
                  {totalInCategory} parça bu odada
                  {active?.description ? ` · ${active.description}` : ''}
                </Typography>
              </Box>
            </Box>

            <Button
              component={RouterLink}
              to={collectionPath}
              endIcon={<ArrowForwardRounded />}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                flexShrink: 0,
                borderRadius: '999px',
                px: 1.8,
                fontWeight: 800,
                color: '#2E3B55',
                backgroundColor: '#FDF4D2',
                border: '1px solid rgba(148,109,109,0.16)',
                '&:hover': { backgroundColor: '#2E3B55', color: '#FFFFFF' }
              }}
            >
              Koleksiyonu gör
            </Button>
          </Box>

          {error && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: '#946D6D', fontWeight: 700 }}>{error}</Typography>
            </Box>
          )}

          {loading && products.length === 0 ? (
            <Box sx={productCardGridSx}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Box key={index} sx={{ width: 260 }}>
                  <Skeleton variant="rounded" height={248} sx={{ borderRadius: '22px' }} />
                  <Skeleton width="70%" sx={{ mt: 1.5 }} />
                  <Skeleton width="40%" />
                </Box>
              ))}
            </Box>
          ) : products.length > 0 ? (
            <AnimatePresence mode="wait">
              <Box
                key={selected}
                component={motion.div}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
                sx={productCardGridSx}
              >
                {products.map((product) => (
                  <Box key={product._id || product.id}>
                    <ProductCard
                      product={product}
                      onAddToCart={onAddToCart}
                      onToggleFavorite={onToggleFavorite}
                      isFavorite={favorites.includes(product._id)}
                    />
                  </Box>
                ))}
              </Box>
            </AnimatePresence>
          ) : !error ? (
            <Box sx={{ textAlign: 'center', py: 8, px: 2, borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px dashed rgba(148,109,109,0.22)' }}>
              <Typography sx={{ color: '#2E3B55', fontWeight: 800 }}>Bu odada henüz vitrin ürünü yok</Typography>
              <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 0.6 }}>Başka bir kategori seçebilir veya tüm koleksiyona geçebilirsiniz.</Typography>
            </Box>
          ) : null}

          {!loading && hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4.5 }}>
              <Button
                variant="outlined"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                endIcon={<ExpandMoreIcon />}
                sx={{
                  px: { xs: 2.5, sm: 4 },
                  py: 1.25,
                  borderRadius: '999px',
                  borderColor: 'rgba(148,109,109,0.35)',
                  color: '#946D6D',
                  fontWeight: 800,
                  '&:hover': { borderColor: '#946D6D', backgroundColor: '#946D6D', color: '#FFFFFF' }
                }}
              >
                Daha fazla göster ({remaining})
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
