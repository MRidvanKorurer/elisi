import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Skeleton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import CategoryBar from './CategoryBar';
import ProductCard, { productCardGridSx } from './ProductCard';
import { categoryService } from '../api/categoryService';
import { productService } from '../api/productService';
import allCover from '../assets/banner1.jpeg';

const PAGE_SIZE = 8;

const BANNER_THEMES = {
  all: {
    background: 'linear-gradient(115deg, #FDF4D2 0%, #E4D4EC 52%, #B0CDE6 100%)',
    orbs: ['rgba(162,144,183,0.38)', 'rgba(176,205,230,0.5)']
  },
  canta: {
    background: 'linear-gradient(115deg, #F8E8E2 0%, #E2B8B4 50%, #946D6D 100%)',
    orbs: ['rgba(253,244,210,0.4)', 'rgba(46,59,85,0.16)']
  },
  aksesuar: {
    background: 'linear-gradient(115deg, #F3EEF7 0%, #C9B8D8 48%, #A290B7 100%)',
    orbs: ['rgba(176,205,230,0.45)', 'rgba(253,244,210,0.35)']
  },
  makrome: {
    background: 'linear-gradient(115deg, #F6EFE8 0%, #D4C0D4 46%, #A290B7 100%)',
    orbs: ['rgba(148,109,109,0.22)', 'rgba(253,244,210,0.4)']
  },
  ahsap: {
    background: 'linear-gradient(115deg, #F7EBD6 0%, #E6C48A 48%, #C48A4A 100%)',
    orbs: ['rgba(148,109,109,0.2)', 'rgba(253,244,210,0.45)']
  },
  seramik: {
    background: 'linear-gradient(115deg, #EEF4F8 0%, #B7D0E2 50%, #7A9EBD 100%)',
    orbs: ['rgba(253,244,210,0.4)', 'rgba(46,59,85,0.12)']
  },
  taki: {
    background: 'linear-gradient(115deg, #F8EBE4 0%, #E8B8A4 48%, #C97B6A 100%)',
    orbs: ['rgba(162,144,183,0.28)', 'rgba(253,244,210,0.4)']
  },
  mum: {
    background: 'linear-gradient(115deg, #EEF6F1 0%, #B7D4C4 50%, #81B29A 100%)',
    orbs: ['rgba(176,205,230,0.4)', 'rgba(253,244,210,0.35)']
  },
  deri: {
    background: 'linear-gradient(115deg, #F3E8E2 0%, #C4A090 50%, #6E5252 100%)',
    orbs: ['rgba(148,109,109,0.28)', 'rgba(253,244,210,0.3)']
  },
  diger: {
    background: 'linear-gradient(115deg, #EEF1F5 0%, #B8C0D0 50%, #2E3B55 100%)',
    orbs: ['rgba(162,144,183,0.3)', 'rgba(176,205,230,0.35)']
  },
  giyim: {
    background: 'linear-gradient(115deg, #F8E8E2 0%, #D4A5A0 50%, #946D6D 100%)',
    orbs: ['rgba(253,244,210,0.4)', 'rgba(46,59,85,0.12)']
  },
  'banyo-tekstili': {
    background: 'linear-gradient(115deg, #EEF4F8 0%, #B0CDE6 50%, #7A9EBD 100%)',
    orbs: ['rgba(253,244,210,0.35)', 'rgba(122,158,189,0.25)']
  },
  'ev-dekorasyon': {
    background: 'linear-gradient(115deg, #F3EEF7 0%, #C9B8D8 48%, #A290B7 100%)',
    orbs: ['rgba(176,205,230,0.4)', 'rgba(253,244,210,0.35)']
  },
  'bebek-cocuk': {
    background: 'linear-gradient(115deg, #F8EBE4 0%, #F0C8B8 50%, #E29578 100%)',
    orbs: ['rgba(253,244,210,0.45)', 'rgba(226,149,120,0.22)']
  },
  mobilya: {
    background: 'linear-gradient(115deg, #F3E8E2 0%, #C4A090 50%, #6E5252 100%)',
    orbs: ['rgba(221,161,94,0.28)', 'rgba(253,244,210,0.3)']
  },
  'hediye-kutulari': {
    background: 'linear-gradient(115deg, #F8E8E2 0%, #E2B8B4 50%, #946D6D 100%)',
    orbs: ['rgba(226,149,120,0.25)', 'rgba(253,244,210,0.4)']
  },
  kisisellestirilebilir: {
    background: 'linear-gradient(115deg, #F3EEF7 0%, #D4C0D4 46%, #A290B7 100%)',
    orbs: ['rgba(148,109,109,0.2)', 'rgba(253,244,210,0.4)']
  },
  'kitap-kirtasiye': {
    background: 'linear-gradient(115deg, #EEF1F5 0%, #B8C0D0 50%, #2E3B55 100%)',
    orbs: ['rgba(176,205,230,0.4)', 'rgba(162,144,183,0.25)']
  },
  'evcil-hayvan': {
    background: 'linear-gradient(115deg, #F7EBD6 0%, #E6C48A 48%, #81B29A 100%)',
    orbs: ['rgba(129,178,154,0.28)', 'rgba(253,244,210,0.4)']
  },
  'parti-malzemeleri': {
    background: 'linear-gradient(115deg, #F8EBE4 0%, #E8B8A4 48%, #A290B7 100%)',
    orbs: ['rgba(226,149,120,0.25)', 'rgba(162,144,183,0.22)']
  },
  kozmetik: {
    background: 'linear-gradient(115deg, #EEF6F1 0%, #B7D4C4 50%, #81B29A 100%)',
    orbs: ['rgba(162,144,183,0.22)', 'rgba(253,244,210,0.35)']
  },
  epoksi: {
    background: 'linear-gradient(115deg, #EEF4F8 0%, #7A9EBD 50%, #2E3B55 100%)',
    orbs: ['rgba(176,205,230,0.4)', 'rgba(46,59,85,0.16)']
  },
  'hobi-malzemeleri': {
    background: 'linear-gradient(115deg, #F3EEF7 0%, #C9B8D8 48%, #B0CDE6 100%)',
    orbs: ['rgba(162,144,183,0.28)', 'rgba(253,244,210,0.35)']
  },
  'mutfak-esyalari': {
    background: 'linear-gradient(115deg, #F7EBD6 0%, #E2B8B4 50%, #946D6D 100%)',
    orbs: ['rgba(221,161,94,0.25)', 'rgba(253,244,210,0.4)']
  }
};

export default function CategoryProductList({ onAddToCart, onToggleFavorite, favorites = [] }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

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

  const active = selected === 'all'
    ? { categoryId: 'all', name: 'Tüm koleksiyon', description: 'Atölyenin güncel vitrini', image: allCover }
    : categories.find((item) => item.categoryId === selected);

  const theme = BANNER_THEMES[selected] || BANNER_THEMES.diger;

  const countLabel = selected === 'all'
    ? (totalInCategory || totalProducts)
    : (active?.productCount ?? totalInCategory);
  const hasMore = products.length < totalInCategory;
  const remaining = Math.max(0, totalInCategory - products.length);

  const selectCategory = (id) => {
    setSelected(id);
    setVisibleCount(PAGE_SIZE);
  };

  const collectionPath = selected === 'all'
    ? '/products'
    : `/products?category=${encodeURIComponent(selected)}`;

  return (
    <Box sx={{ pb: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
          <Box sx={{ minWidth: 0 }}>
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
              <CategoryOutlined sx={{ fontSize: 18 }} />
              ÖZEL ATÖLYELER
            </Typography>
            <Typography component="h2" variant="h4" fontWeight={800} sx={{ color: '#2E3B55', letterSpacing: '-0.5px', mt: 0.2, fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2.125rem' } }}>
              Kategorilere Göre Keşfet
            </Typography>
          </Box>
          <Button
            onClick={() => navigate(collectionPath)}
            endIcon={<ArrowForwardRounded />}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              flexShrink: 0,
              borderRadius: '999px',
              px: 2,
              py: 1,
              fontWeight: 800,
              color: '#2E3B55',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(148,109,109,0.16)',
              '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF' }
            }}
          >
            Tüm vitrin
          </Button>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' },
            gap: { xs: 2.2, md: 3 },
            alignItems: 'start'
          }}
        >
          <CategoryBar
            categories={categories}
            totalProducts={totalProducts}
            selectedCategory={selected}
            onSelectCategory={selectCategory}
            loading={catsLoading}
          />

          <Box sx={{ minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <Box
            key={selected}
            component={motion.div}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
            sx={{
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1.6, md: 2 },
              p: { xs: 1.4, md: 1.6 },
              borderRadius: '22px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(148,109,109,0.14)',
              boxShadow: '0 14px 32px -22px rgba(46,59,85,0.4)'
            }}
          >
            <Box
              sx={{
                width: { xs: 72, md: 88 },
                height: { xs: 72, md: 88 },
                borderRadius: '20px',
                overflow: 'hidden',
                flexShrink: 0,
                background: theme.background
              }}
            >
              {active?.image ? (
                <Box component="img" src={active.image} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : null}
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                component="h3"
                sx={{
                  color: '#2E3B55',
                  fontWeight: 800,
                  letterSpacing: '-0.4px',
                  lineHeight: 1.15,
                  fontSize: { xs: '1.15rem', sm: '1.3rem' }
                }}
              >
                {active?.name || 'Koleksiyon'}
              </Typography>
              <Typography sx={{ mt: 0.35, color: '#5C4A4A', fontWeight: 600, fontSize: '0.8rem' }}>
                {countLabel} parça
                {active?.description ? (
                  <>
                    <Box component="span" sx={{ mx: 0.7, opacity: 0.35 }}>·</Box>
                    {active.description}
                  </>
                ) : null}
              </Typography>
            </Box>

            <Button
              onClick={() => navigate(collectionPath)}
              endIcon={<ArrowForwardRounded />}
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                flexShrink: 0,
                borderRadius: '999px',
                px: 1.8,
                py: 0.75,
                minHeight: 0,
                fontWeight: 800,
                fontSize: '0.8rem',
                color: '#2E3B55',
                backgroundColor: '#FDF4D2',
                border: '1px solid rgba(148,109,109,0.16)',
                '&:hover': { backgroundColor: '#2E3B55', color: '#FFFFFF' }
              }}
            >
              Koleksiyonu gör
            </Button>
          </Box>
        </AnimatePresence>

        {error && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
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
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              sx={productCardGridSx}
            >
              {products.map((product) => (
                <Box key={product._id}>
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
          <Box sx={{ textAlign: 'center', py: 8, px: 2, borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.55)', border: '1px dashed rgba(148,109,109,0.22)' }}>
            <Typography sx={{ color: '#2E3B55', fontWeight: 800 }}>Bu kategoride henüz vitrin ürünü yok</Typography>
            <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 0.6 }}>Başka bir atölyeyi deneyebilir veya tüm koleksiyona geçebilirsiniz.</Typography>
          </Box>
        ) : null}

        {!loading && hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <Button
              variant="outlined"
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              endIcon={<ExpandMoreIcon />}
              sx={{
                px: { xs: 2.5, sm: 4 },
                py: 1.3,
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
        </Box>
      </Container>
    </Box>
  );
}
