import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Link,
  Rating,
  Skeleton,
  Typography
} from '@mui/material';
import SiteContainer from '../components/SiteContainer';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import ProductCard, { productCardGridSx } from '../components/ProductCard';
import LoadingButton from '../components/LoadingButton';
import Seo from '../components/Seo';
import { homeFont } from '../components/homeType';
import { sellerService } from '../api/sellerService';
import { mediaUrl } from '../api/lookbookService';
import { instagramHref, websiteHref } from '../utils/atelierLinks';
import { scrollPageTo } from '../hooks/useSmoothScroll';
import useProductGridPageSize, { resolveFetchLimit } from '../hooks/useProductGridPageSize';

const PAGE_PT = { xs: '96px', md: '120px' };

const SORTS = [
  { id: 'newest', label: 'En yeniler' },
  { id: 'popular', label: 'Çok satan' },
  { id: 'rating', label: 'Puan' },
  { id: 'priceAsc', label: 'Fiyat artan' },
  { id: 'priceDesc', label: 'Fiyat azalan' }
];

const initialsOf = (name = '') => String(name).trim().charAt(0).toUpperCase() || 'N';

const resolveCover = (src) => {
  if (!src) return '';
  return mediaUrl(src) || (String(src).startsWith('http') ? src : '');
};

function CoverTile({ src, alt, onError }) {
  return (
    <Box
      sx={{
        aspectRatio: '1 / 1',
        minWidth: 0,
        p: { xs: 1, md: 1.2 },
        borderRadius: { xs: '18px', md: '22px' },
        bgcolor: '#FFFFFF',
        border: '1px solid rgba(148,109,109,0.12)'
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        onError={onError}
        sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </Box>
  );
}

function CoverGallery({ images, alt }) {
  const [failed, setFailed] = useState({});
  const visible = images.filter((src) => src && !failed[src]).slice(0, 4);
  const markFailed = (src) => setFailed((prev) => ({ ...prev, [src]: true }));

  if (!visible.length) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: visible.length === 1 ? 'minmax(0, 420px)' : '1fr 1fr',
        gap: { xs: 1, md: 1.4 },
        justifyContent: { md: 'end' },
        ml: { md: 'auto' },
        width: visible.length === 1 ? { xs: '72%', md: '78%' } : '100%'
      }}
    >
      {visible.map((src, index) => (
        <CoverTile key={`${src}-${index}`} src={src} alt={index === 0 ? alt : ''} onError={() => markFailed(src)} />
      ))}
    </Box>
  );
}

const chipRowSx = {
  display: 'flex',
  gap: 0.7,
  overflowX: 'auto',
  pb: 0.3,
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' }
};

const chipSx = (active) => ({
  borderRadius: '999px',
  fontWeight: 800,
  fontSize: '0.78rem',
  height: 34,
  flexShrink: 0,
  bgcolor: active ? '#2E3B55' : '#FFFFFF',
  color: active ? '#FFFFFF' : '#2E3B55',
  border: active ? '1px solid #2E3B55' : '1px solid rgba(148,109,109,0.18)',
  '&:hover': { bgcolor: active ? '#946D6D' : '#FDF4D2' }
});

export default function AtelierPage() {
  const { t } = useTranslation('catalog');
  const { slug } = useParams();
  const navigate = useLocaleNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('kategori') || '';
  const sort = SORTS.some((item) => item.id === searchParams.get('sira'))
    ? searchParams.get('sira')
    : 'newest';

  const [atelier, setAtelier] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, hasMore: false, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [bioOpen, setBioOpen] = useState(false);
  const { gridRef, pageSize } = useProductGridPageSize({
    deps: [slug, category, sort],
    fillViewport: true,
    minRows: 2,
    maxRows: 3
  });
  const rowSize = Math.max(0, pageSize);
  const fetchLimitRef = useRef(0);

  useEffect(() => {
    setProducts([]);
    setLoading(true);
    setBioOpen(false);
    setPage(1);
    fetchLimitRef.current = 0;
  }, [slug, category, sort]);

  const requestSeq = useRef(0);

  const setFilter = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next.kategori !== undefined) {
      if (next.kategori) params.set('kategori', next.kategori);
      else params.delete('kategori');
    }
    if (next.sira !== undefined) {
      if (next.sira && next.sira !== 'newest') params.set('sira', next.sira);
      else params.delete('sira');
    }
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    if (rowSize < 1 || page < 1) return undefined;
    let cancelled = false;
    const seq = ++requestSeq.current;
    const requestPage = page;
    const requestLimit = resolveFetchLimit(requestPage, rowSize, fetchLimitRef);
    if (requestLimit < 1) return () => { cancelled = true; };
    if (requestPage > 1) setLoadingMore(true);
    else setLoading(true);
    setError('');
    sellerService.getPublic(slug, { category, sort, page: requestPage, limit: requestLimit })
      .then((data) => {
        if (cancelled || seq !== requestSeq.current) return;
        setAtelier(data.atelier || null);
        const list = data.products || [];
        setProducts((prev) => {
          if (requestPage <= 1) return list;
          const seen = new Set(prev.map((item) => String(item._id || item.id)));
          return prev.concat(list.filter((item) => !seen.has(String(item._id || item.id))));
        });
        setPagination(data.pagination || { page: requestPage, hasMore: false, total: list.length });
      })
      .catch(() => {
        if (!cancelled && seq === requestSeq.current && requestPage <= 1) {
          setAtelier(null);
          setProducts([]);
          setError(t('atelier.notFound', { defaultValue: 'Atölye bulunamadı veya yayında değil.' }));
        }
      })
      .finally(() => {
        if (!cancelled && seq === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
    return () => { cancelled = true; };
  }, [slug, category, sort, page, rowSize]);

  const loadMore = () => {
    if (loadingMore || !pagination.hasMore || rowSize < 1) return;
    setPage((prev) => prev + 1);
  };

  const locationLabel = useMemo(
    () => [atelier?.ilce, atelier?.sehir].filter(Boolean).join(', '),
    [atelier]
  );
  const ig = instagramHref(atelier?.instagram);
  const site = websiteHref(atelier?.website);
  const covers = useMemo(
    () => [...new Set((atelier?.coverImages || []).map(resolveCover).filter(Boolean))].slice(0, 4),
    [atelier]
  );
  const categories = atelier?.categories || [];

  const scrollToVitrin = () => {
    scrollPageTo('#atolye-vitrin', { offset: -88 });
  };

  if (loading && !atelier) {
    return (
      <Box sx={{ pt: PAGE_PT, pb: 10, overflowX: 'hidden' }}>
        <SiteContainer>
          <Box
            ref={gridRef}
            aria-hidden
            sx={{ ...productCardGridSx, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none', m: 0, p: 0 }}
          />
          <Skeleton variant="text" width={220} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={360} sx={{ borderRadius: '28px', mb: 4 }} />
          <Box sx={productCardGridSx}>
            {Array.from({ length: Math.max(rowSize, 6) }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={360} sx={{ borderRadius: '22px' }} />
            ))}
          </Box>
        </SiteContainer>
      </Box>
    );
  }

  if (error || !atelier) {
    return (
      <Box sx={{ pt: PAGE_PT, pb: 10, textAlign: 'center', overflowX: 'hidden' }}>
        <Seo title={t('atelier.notFoundTitle')} path={`/atolye/${slug || ''}`} noindex />
        <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '1.4rem', mb: 1 }}>{t('atelier.notFoundTitle')}</Typography>
        <Typography sx={{ color: '#6E5252', fontWeight: 600, mb: 3 }}>{error || t('atelier.offline', { defaultValue: 'Bu vitrin yayında değil.' })}</Typography>
        <Button
          onClick={() => navigate('/urunler')}
          endIcon={<ArrowForwardRounded />}
          sx={{ bgcolor: '#946D6D', color: '#fff', borderRadius: '14px', px: 3, fontWeight: 800, '&:hover': { bgcolor: '#7c5a5a' } }}
        >
          {t('atelier.backToProducts', { defaultValue: 'Ürünlere dön' })}
        </Button>
      </Box>
    );
  }

  const stats = [
    { label: t('atelier.statVitrine'), value: atelier.productCount || 0 },
    { label: t('atelier.statSales'), value: atelier.soldCount || 0 },
    { label: t('atelier.statReviews'), value: atelier.reviewCount || 0 },
    { label: t('atelier.statSince'), value: atelier.sinceYear || '—' }
  ];

  const bio = atelier.aciklama || t('atelier.defaultBio');
  const bioLong = bio.length > 220;

  return (
    <Box sx={{ pt: PAGE_PT, pb: { xs: 8, md: 12 }, minHeight: '100vh', overflowX: 'hidden', fontFamily: homeFont }}>
      <Seo
        title={t('atelier.seoTitle', { defaultValue: '{{name}} | Atölye', name: atelier.magazaAdi })}
        description={atelier.aciklama || t('atelier.seoDescription', { defaultValue: '{{name}} el yapımı vitrini.', name: atelier.magazaAdi })}
        path={`/atolye/${atelier.slug}`}
        image={covers[0]}
      />
      <SiteContainer sx={{ minWidth: 0 }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{
            mb: { xs: 2, md: 3 },
            color: '#A290B7',
            fontWeight: 700,
            fontSize: '0.82rem',
            '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap', rowGap: 0.4 }
          }}
        >
          <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>{t('atelier.home')}</Link>
          <Link underline="hover" color="inherit" onClick={() => navigate('/urunler')} sx={{ cursor: 'pointer' }}>{t('atelier.products')}</Link>
          <Typography sx={{ color: '#2E3B55', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 180, sm: 360 } }}>
            {atelier.magazaAdi}
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: covers.length ? 'minmax(0, 1.15fr) minmax(260px, 0.85fr)' : '1fr' },
            gap: { xs: 2.4, md: 5 },
            alignItems: 'start',
            mb: { xs: 4, md: 6 }
          }}
        >
          <Box sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, flexWrap: 'wrap', mb: 1.2 }}>
              <Chip
                icon={<VerifiedOutlined sx={{ fontSize: '15px !important', color: '#FFFFFF !important' }} />}
                label={t('atelier.verified')}
                sx={{ bgcolor: '#946D6D', color: '#FFFFFF', fontWeight: 800, height: 26, '& .MuiChip-icon': { ml: 0.55 } }}
              />
              {atelier.isWeeklyAtelier ? (
                <Chip label={t('atelier.weekBadge')} sx={{ bgcolor: '#2E3B55', color: '#FFFFFF', fontWeight: 800, height: 26 }} />
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.3, md: 1.6 }, mb: 1.4 }}>
              <Avatar
                src={mediaUrl(atelier.avatarUrl) || undefined}
                alt=""
                sx={{
                  width: { xs: 52, md: 60 },
                  height: { xs: 52, md: 60 },
                  flexShrink: 0,
                  bgcolor: '#B0CDE6',
                  color: '#2E3B55',
                  fontWeight: 800,
                  fontSize: '1.25rem'
                }}
              >
                {initialsOf(atelier.magazaAdi)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: homeFont,
                    color: '#2E3B55',
                    fontWeight: 800,
                    fontSize: { xs: '1.7rem', sm: '2rem', md: '2.35rem' },
                    letterSpacing: '-0.035em',
                    lineHeight: 1.08,
                    wordBreak: 'break-word'
                  }}
                >
                  {atelier.magazaAdi}
                </Typography>
                <Typography sx={{ color: '#6E5252', fontWeight: 700, mt: 0.35, fontSize: '0.92rem' }}>
                  {atelier.makerName && atelier.makerName !== atelier.magazaAdi ? `${atelier.makerName} · ` : ''}
                  {atelier.magazaTuruEtiket || t('atelier.handmade')}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.6 }, color: '#6E5252', fontWeight: 700, fontSize: '0.86rem', mb: 1.6 }}>
              {locationLabel ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
                  <PlaceOutlined sx={{ fontSize: 17 }} />
                  {locationLabel}
                </Box>
              ) : null}
              {atelier.rating > 0 ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating value={atelier.rating} precision={0.1} readOnly size="small" sx={{ color: '#946D6D' }} />
                  {Number(atelier.rating).toFixed(1)}
                </Box>
              ) : null}
            </Box>

            <Typography
              sx={{
                color: '#2E3B55',
                fontWeight: 600,
                lineHeight: 1.7,
                maxWidth: 560,
                ...(bioLong && !bioOpen ? {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                } : {})
              }}
            >
              {bio}
            </Typography>
            {bioLong ? (
              <Button onClick={() => setBioOpen((open) => !open)} sx={{ mt: 0.4, p: 0, minWidth: 0, fontWeight: 800, color: '#946D6D', textTransform: 'none' }}>
                {bioOpen ? t('atelier.less') : t('atelier.more')}
              </Button>
            ) : null}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                mt: 2.2,
                mb: 2.2,
                py: 1.3,
                borderTop: '1px solid rgba(148,109,109,0.16)',
                borderBottom: '1px solid rgba(148,109,109,0.16)'
              }}
            >
              {stats.map((item) => (
                <Box key={item.label} sx={{ textAlign: 'center', minWidth: 0, px: 0.4 }}>
                  <Typography sx={{ color: '#2E3B55', fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.25rem' }, lineHeight: 1.1 }}>{item.value}</Typography>
                  <Typography sx={{ color: '#A290B7', fontWeight: 800, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', mt: 0.45 }}>{item.label}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button onClick={scrollToVitrin} endIcon={<ArrowForwardRounded />} sx={{ ...socialBtnSx, bgcolor: '#2E3B55', color: '#FFFFFF', borderColor: '#2E3B55', '&:hover': { bgcolor: '#946D6D', borderColor: '#946D6D' } }}>
                {t('atelier.seeVitrine', { defaultValue: 'Vitrine bak' })}
              </Button>
              {ig ? (
                <Button component="a" href={ig} target="_blank" rel="noopener noreferrer" startIcon={<InstagramIcon />} sx={socialBtnSx}>
                  Instagram
                </Button>
              ) : null}
              {site ? (
                <Button component="a" href={site} target="_blank" rel="noopener noreferrer" startIcon={<LanguageRounded />} sx={socialBtnSx}>
                  {t('atelier.website', { defaultValue: 'Web sitesi' })}
                </Button>
              ) : null}
            </Box>
          </Box>

          {covers.length ? (
            <Box sx={{ order: { xs: 1, md: 2 }, minWidth: 0 }}>
              <CoverGallery images={covers} alt={t('atelier.coverAlt', { defaultValue: '{{name}} vitrini', name: atelier.magazaAdi })} />
            </Box>
          ) : null}
        </Box>

        <Box
          id="atolye-vitrin"
          sx={{
            position: 'sticky',
            top: { xs: 68, md: 84 },
            zIndex: 4,
            mx: { xs: -2, sm: -3 },
            px: { xs: 2, sm: 3 },
            py: 1.3,
            mb: 2.4,
            bgcolor: 'rgba(253,244,210,0.94)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(148,109,109,0.12)',
            scrollMarginTop: '96px'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 1 }}>
            <Typography sx={{ fontFamily: homeFont, color: '#2E3B55', fontWeight: 800, fontSize: { xs: '1.15rem', md: '1.3rem' }, letterSpacing: '-0.03em' }}>
              {t('atelier.vitrineTitle', { defaultValue: 'Atölye vitrini' })}
            </Typography>
            <Typography sx={{ color: '#6E5252', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
              {pagination.total > 0
                ? t('atelier.showing', { defaultValue: '{{total}} parçadan {{count}} tanesi', total: pagination.total, count: products.length })
                : ''}
            </Typography>
          </Box>
          <Box sx={chipRowSx}>
            <Chip label={t('atelier.all', { count: atelier.productCount || 0 })} onClick={() => setFilter({ kategori: '' })} sx={chipSx(!category)} />
            {categories.map((item) => (
              <Chip
                key={item.id}
                label={`${item.label} (${item.count})`}
                onClick={() => setFilter({ kategori: item.id })}
                sx={chipSx(category === item.id)}
              />
            ))}
          </Box>
          <Box sx={{ ...chipRowSx, mt: 0.8 }}>
            {SORTS.map((item) => (
              <Chip key={item.id} label={t(`atelier.sort.${item.id}`, { defaultValue: item.label })} onClick={() => setFilter({ sira: item.id })} sx={chipSx(sort === item.id)} />
            ))}
          </Box>
        </Box>

        <Box
          ref={gridRef}
          aria-hidden
          sx={{ ...productCardGridSx, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none', m: 0, p: 0, mb: 0 }}
        />

        {loading && products.length === 0 ? (
          <Box sx={productCardGridSx}>
            {Array.from({ length: Math.max(rowSize, 6) }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={360} sx={{ borderRadius: '22px' }} />
            ))}
          </Box>
        ) : products.length > 0 ? (
          <>
            <Box sx={productCardGridSx}>
              {products.map((product) => (
                <Box key={product._id || product.id} sx={{ minWidth: 0 }}>
                  <ProductCard product={product} fullWidth />
                </Box>
              ))}
            </Box>
            {pagination.hasMore ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <LoadingButton
                  tone="soft"
                  loading={loadingMore}
                  onClick={loadMore}
                  endIcon={<ExpandMoreIcon />}
                >
                  {t('actions.showMoreRemaining', { ns: 'common', count: Math.max(0, (pagination.total || 0) - products.length) })}
                </LoadingButton>
              </Box>
            ) : null}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 7, px: 2, borderRadius: '22px', bgcolor: 'rgba(255,255,255,0.7)', border: '1px dashed rgba(148,109,109,0.25)' }}>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 0.8 }}>{t('atelier.noMatch', { defaultValue: 'Bu seçimde ürün yok' })}</Typography>
            <Typography sx={{ color: '#6E5252', fontWeight: 600, mb: 2 }}>{t('atelier.noMatchText', { defaultValue: 'Başka bir kategori veya sıralama dene.' })}</Typography>
            <Button onClick={() => setFilter({ kategori: '', sira: 'newest' })} sx={{ fontWeight: 800, color: '#946D6D' }}>
              {t('atelier.clearFilters', { defaultValue: 'Filtreleri temizle' })}
            </Button>
          </Box>
        )}
      </SiteContainer>
    </Box>
  );
}

const socialBtnSx = {
  borderRadius: '999px',
  px: 1.8,
  height: 42,
  fontWeight: 800,
  fontSize: '0.82rem',
  color: '#2E3B55',
  bgcolor: '#FFFFFF',
  border: '1px solid rgba(148,109,109,0.18)',
  textTransform: 'none',
  '&:hover': { bgcolor: '#FDF4D2' }
};
