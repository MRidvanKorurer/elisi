import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import SiteContainer from './SiteContainer';
import { useTranslation } from 'react-i18next';
import LocaleLink from '../i18n/LocaleLink';
import { categoryLabel } from '../utils/categories';
import { useReducedMotion } from 'framer-motion';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { categoryService } from '../api/categoryService';
import { productService } from '../api/productService';
import ProductCard, { productCardGridSx } from './ProductCard';
import LoadingButton, { ProductGridSkeleton } from './LoadingButton';
import { scrollPageTo } from '../hooks/useSmoothScroll';
import useProductGridPageSize, { resolveFetchLimit } from '../hooks/useProductGridPageSize';
import { imgBanner1Tile as allCover } from '../assets/media';

const tileRadius = { xs: '20px', md: '24px' };

function CategoryTile({ item, index, selected, reduced, onSelect, t }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={() => onSelect(item.categoryId)}
      aria-pressed={selected}
      aria-label={t('categories.showProducts', { ns: 'home', name: item.name })}
      sx={{
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        p: 0,
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        flex: { xs: '0 0 168px', sm: '0 0 190px', md: 'auto' },
        width: { md: '100%' },
        height: { xs: 220, sm: 236, md: index === 0 ? 280 : 210 },
        scrollSnapAlign: 'start',
        borderRadius: tileRadius,
        background: item.bgGradient || 'linear-gradient(160deg, #3d4d68 0%, #946D6D 100%)',
        boxShadow: selected ? '0 0 0 2px #F7F1E8, 0 0 0 4px #2E3B55' : 'none',
        transition: reduced ? 'none' : 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': reduced ? undefined : { transform: 'translateY(-3px)' },
        '&:focus-visible': { outline: '3px solid #B0CDE6', outlineOffset: 3 }
      }}
    >
      {item.image ? (
        <Box
          component="img"
          src={item.image}
          alt=""
          loading={index < 3 ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={index === 0 ? 'high' : 'low'}
          onError={(event) => { event.currentTarget.style.opacity = '0'; }}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
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
          p: { xs: 1.4, md: 1.6 },
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
          {selected ? t('categories.selected', { ns: 'home' }) : t('categories.discover', { ns: 'home' })}
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
                fontSize: { xs: '1.05rem', md: index === 0 ? '1.35rem' : '1.05rem' }
              }}
            >
              {item.name}
            </Box>
            <Box component="p" sx={{ m: 0, mt: 0.4, color: '#FDF4D2', fontWeight: 700, fontSize: '0.75rem', textShadow: '0 1px 8px rgba(30,39,56,0.5)' }}>
              {item.countLabel}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function CategoryProductList() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const productsAnchor = useRef(null);

  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [catsLoading, setCatsLoading] = useState(true);
  const [productsReady, setProductsReady] = useState(false);

  const [selected, setSelected] = useState('all');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [totalInCategory, setTotalInCategory] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const { gridRef, pageSize } = useProductGridPageSize({
    enabled: productsReady,
    deps: [selected, productsReady]
  });
  const requestSeq = useRef(0);
  const fetchLimitRef = useRef(0);

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

  // Ürün ızgarasını bölüm yakına gelmeden yükleme; ilk kaydırmayı boğmasın
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || productsReady) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setProductsReady(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setProductsReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '280px 0px', threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [productsReady]);

  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchLimitRef.current = 0;
  }, [selected, productsReady]);

  useEffect(() => {
    if (!productsReady || pageSize < 1 || page < 1) return undefined;
    let cancelled = false;
    const seq = ++requestSeq.current;
    const requestPage = page;
    const requestLimit = resolveFetchLimit(requestPage, pageSize, fetchLimitRef);
    if (requestLimit < 1) return () => { cancelled = true; };

    if (requestPage > 1) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    productService.getFilteredProducts({
      category: selected === 'all' ? undefined : selected,
      page: requestPage,
      limit: requestLimit,
      sort: 'created'
    })
      .then((response) => {
        if (cancelled || seq !== requestSeq.current) return;
        const list = response?.products || (Array.isArray(response) ? response : []);
        setProducts((prev) => {
          if (requestPage <= 1) return list;
          const seen = new Set(prev.map((item) => String(item._id || item.id)));
          return prev.concat(list.filter((item) => !seen.has(String(item._id || item.id))));
        });
        setTotalInCategory(response?.pagination?.totalProducts ?? list.length);
      })
      .catch(() => {
        if (!cancelled && seq === requestSeq.current && requestPage <= 1) {
          setProducts([]);
          setError(t('categories.loadError', { ns: 'home' }));
        }
      })
      .finally(() => {
        if (!cancelled && seq === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => { cancelled = true; };
  }, [productsReady, selected, page, pageSize, t]);

  const sortedCats = useMemo(
    () => [...categories]
      .filter((cat) => (cat.productCount || 0) > 0)
      .sort((a, b) => (b.productCount || 0) - (a.productCount || 0)),
    [categories]
  );

  const active = selected === 'all'
    ? {
        categoryId: 'all',
        name: t('categories.allName', { ns: 'home' }),
        description: t('categories.allDescription', { ns: 'home' }),
        image: allCover
      }
    : {
        ...sortedCats.find((item) => item.categoryId === selected),
        name: categoryLabel(selected, t)
      };

  const tiles = useMemo(() => ([
    {
      categoryId: 'all',
      name: t('categories.allName', { ns: 'home' }),
      image: allCover,
      countLabel: totalProducts
        ? t('categories.pieceCount', { ns: 'home', count: totalProducts })
        : t('categories.allCount', { ns: 'home' }),
      bgGradient: 'linear-gradient(135deg, #946D6D 0%, #2E3B55 100%)'
    },
    ...sortedCats.map((cat) => ({
      categoryId: cat.categoryId,
      name: categoryLabel(cat.categoryId, t),
      image: cat.image,
      countLabel: cat.productCount
        ? t('categories.pieceCount', { ns: 'home', count: cat.productCount })
        : t('categories.soon', { ns: 'home' }),
      bgGradient: cat.bgGradient
    }))
  ]), [sortedCats, t, totalProducts]);

  const collectionPath = selected === 'all'
    ? '/urunler'
    : `/kategori/${encodeURIComponent(selected)}`;

  const hasMore = products.length < totalInCategory;
  const remaining = Math.max(0, totalInCategory - products.length);
  const initialLoading = Boolean(productsReady && loading && products.length === 0);

  const selectCategory = (id) => {
    if (id !== selected) {
      setProductsReady(true);
      setSelected(id);
      setPage(1);
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
      ref={sectionRef}
      component="section"
      sx={{
        py: { xs: 4, md: 7 },
        backgroundColor: '#FDF4D2',
        contentVisibility: 'auto',
        containIntrinsicSize: '1200px'
      }}
    >
      <SiteContainer sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'flex-end' },
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
              {t('categories.eyebrow', { ns: 'home' })}
            </Typography>
            <Typography
              component="h2"
              sx={{
                color: '#2E3B55',
                fontWeight: 800,
                letterSpacing: '-0.6px',
                mt: 0.2,
                fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.2rem' },
                pr: { xs: 1, sm: 0 }
              }}
            >
              {t('categories.title', { ns: 'home' })}
            </Typography>
            <Typography sx={{ mt: 0.8, color: '#6E5252', fontWeight: 600, maxWidth: 540, fontSize: { xs: '0.88rem', md: '0.95rem' } }}>
              {t('categories.subtitle', { ns: 'home' })}
            </Typography>
          </Box>

          <Box
            component={LocaleLink}
            to={collectionPath}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              flexShrink: 0,
              alignSelf: { xs: 'flex-start', sm: 'auto' },
              px: 2,
              py: 1,
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '0.88rem',
              color: '#F7F1E8',
              textDecoration: 'none',
              backgroundColor: '#2E3B55',
              '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF' }
            }}
          >
            {t('categories.allCount', { ns: 'home' })}
            <ArrowForwardRounded sx={{ fontSize: 18 }} />
          </Box>
        </Box>

        {catsLoading ? (
          <Box
            sx={{
              display: 'flex',
              gap: 1.2,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              pb: 0.6,
              mx: { xs: -2, sm: -3, md: 0 },
              px: { xs: 2, sm: 3, md: 0 },
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              '@media (min-width: 900px)': {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                overflow: 'visible',
                mx: 0,
                px: 0
              }
            }}
          >
            <Skeleton variant="rounded" sx={{ flex: '0 0 168px', height: 220, borderRadius: tileRadius }} />
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" sx={{ flex: '0 0 168px', height: 220, borderRadius: tileRadius }} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              gap: 1.2,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              pb: 0.6,
              mx: { xs: -2, sm: -3, md: 0 },
              px: { xs: 2, sm: 3, md: 0 },
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              '@media (min-width: 900px)': {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                overflow: 'visible',
                mx: 0,
                px: 0
              }
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
                t={(key, opts) => t(key, { ns: 'home', ...opts })}
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
              border: '1px solid rgba(148,109,109,0.14)'
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
                  <Box
                    component="img"
                    src={active.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : null}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ color: '#2E3B55', fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.22rem' }, letterSpacing: '-0.3px' }}>
                  {active?.name || t('categories.collection', { ns: 'home' })}
                </Typography>
                <Typography
                  sx={{
                    color: '#6E5252',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {t('categories.inRoom', { ns: 'home', count: totalInCategory })}
                  {active?.description ? ` · ${active.description}` : ''}
                </Typography>
                <Button
                  component={LocaleLink}
                  to={collectionPath}
                  size="small"
                  sx={{
                    display: { xs: 'inline-flex', sm: 'none' },
                    mt: 0.8,
                    px: 0,
                    minWidth: 0,
                    fontWeight: 800,
                    color: '#946D6D'
                  }}
                >
                  {t('categories.seeCollection', { ns: 'home' })}
                </Button>
              </Box>
            </Box>

            <Button
              component={LocaleLink}
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
              {t('categories.seeCollection', { ns: 'home' })}
            </Button>
          </Box>

          {!productsReady ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <>
              {(initialLoading || (productsReady && pageSize < 1)) && (
                <ProductGridSkeleton count={Math.max(pageSize, 4)} />
              )}

              {error && !initialLoading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography sx={{ color: '#946D6D', fontWeight: 700 }}>{error}</Typography>
                </Box>
              ) : null}

              {!error && !initialLoading && products.length === 0 && pageSize > 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, px: 2, borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px dashed rgba(148,109,109,0.22)' }}>
                  <Typography sx={{ color: '#2E3B55', fontWeight: 800 }}>{t('categories.emptyTitle', { ns: 'home' })}</Typography>
                  <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 0.6 }}>{t('categories.emptyText', { ns: 'home' })}</Typography>
                </Box>
              ) : null}

              <Box
                ref={gridRef}
                aria-hidden
                sx={{
                  ...productCardGridSx,
                  height: 0,
                  overflow: 'hidden',
                  opacity: 0,
                  pointerEvents: 'none',
                  m: 0,
                  p: 0,
                  border: 0
                }}
              />

              <Box
                key={selected}
                sx={{
                  ...productCardGridSx,
                  ...((initialLoading || error || products.length === 0)
                    ? { height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none', mb: 0 }
                    : {})
                }}
              >
                {products.map((product) => (
                  <Box key={product._id || product.id}>
                    <ProductCard product={product} fullWidth />
                  </Box>
                ))}
              </Box>

              {hasMore ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4.5 }}>
                  <LoadingButton
                    tone="outline"
                    loading={loadingMore}
                    onClick={() => {
                      if (pageSize < 1 || loadingMore) return;
                      setPage((prev) => prev + 1);
                    }}
                    endIcon={<ExpandMoreIcon />}
                  >
                    {t('actions.showMoreCount', { count: remaining })}
                  </LoadingButton>
                </Box>
              ) : null}
            </>
          )}
        </Box>
      </SiteContainer>
    </Box>
  );
}
