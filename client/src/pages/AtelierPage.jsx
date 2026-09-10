import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Link,
  Rating,
  Skeleton,
  Typography
} from '@mui/material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageRounded from '@mui/icons-material/LanguageRounded';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import ProductCard from '../components/ProductCard';
import Seo from '../components/Seo';
import { sellerService } from '../api/sellerService';
import { mediaUrl } from '../api/lookbookService';
import { instagramHref, websiteHref } from '../utils/atelierLinks';
import { scrollPageTo } from '../hooks/useSmoothScroll';

const PAGE_SIZE = 8;
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

const mosaicPlacement = (count) => {
  if (count <= 1) {
    return {
      columns: '1fr',
      rows: '1fr',
      items: [{}]
    };
  }
  if (count === 2) {
    return {
      columns: '1.2fr 1fr',
      rows: '1fr',
      items: [{}]
    };
  }
  if (count === 3) {
    return {
      columns: '1.35fr 1fr',
      rows: '1fr 1fr',
      items: [{ gridRow: '1 / 3' }, {}, {}]
    };
  }
  return {
    columns: '1.45fr 1fr 1fr',
    rows: '1fr 1fr',
    items: [
      { gridColumn: '1', gridRow: '1 / 3' },
      { gridColumn: '2', gridRow: '1' },
      { gridColumn: '3', gridRow: '1' },
      { gridColumn: '2 / 4', gridRow: '2' }
    ]
  };
};

function CoverGallery({ images, alt }) {
  const [failed, setFailed] = useState({});
  const visible = images.filter((src) => src && !failed[src]);
  const layout = mosaicPlacement(visible.length);

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: 220, sm: 280, md: 360 },
        minHeight: { xs: 220, sm: 280, md: 360 },
        overflow: 'hidden',
        bgcolor: '#E8DFF3',
        background:
          'linear-gradient(135deg, #B0CDE6 0%, #E4DCF0 48%, #FDF4D2 100%)'
      }}
    >
      {visible.length ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: layout.columns,
            gridTemplateRows: layout.rows,
            gap: { xs: 0.7, md: 0.9 },
            height: '100%',
            p: { xs: 0.7, md: 0.9 }
          }}
        >
          {visible.map((src, index) => (
            <Box
              key={`${src}-${index}`}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                minWidth: 0,
                minHeight: 0,
                borderRadius: index === 0 ? '18px 12px 12px 18px' : '14px',
                bgcolor: index % 2 ? '#B0CDE6' : '#E4DCF0',
                ...layout.items[index]
              }}
            >
              <Box
                component="img"
                src={src}
                alt={index === 0 ? alt : ''}
                onError={() => setFailed((prev) => ({ ...prev, [src]: true }))}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

const chipSx = (active) => ({
  borderRadius: '999px',
  fontWeight: 800,
  fontSize: '0.8rem',
  height: 36,
  bgcolor: active ? '#2E3B55' : '#FFFFFF',
  color: active ? '#FFFFFF' : '#2E3B55',
  border: active ? '1px solid #2E3B55' : '1px solid rgba(148,109,109,0.18)',
  '&:hover': { bgcolor: active ? '#946D6D' : '#FDF4D2' }
});

export default function AtelierPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('kategori') || '';
  const sort = SORTS.some((item) => item.id === searchParams.get('sira'))
    ? searchParams.get('sira')
    : 'newest';

  const [atelier, setAtelier] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, hasMore: false, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

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
    let cancelled = false;
    setLoading(true);
    setError('');
    sellerService.getPublic(slug, { category, sort, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setAtelier(data.atelier || null);
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, hasMore: false, total: (data.products || []).length });
      })
      .catch(() => {
        if (!cancelled) {
          setAtelier(null);
          setProducts([]);
          setError('Atölye bulunamadı veya yayında değil.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, category, sort]);

  const loadMore = async () => {
    if (loadingMore || !pagination.hasMore) return;
    setLoadingMore(true);
    try {
      const data = await sellerService.getPublic(slug, {
        category,
        sort,
        page: (pagination.page || 1) + 1,
        limit: PAGE_SIZE
      });
      setProducts((prev) => [...prev, ...(data.products || [])]);
      setPagination(data.pagination || pagination);
    } catch {
      setPagination((prev) => ({ ...prev, hasMore: false }));
    } finally {
      setLoadingMore(false);
    }
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
        <Container maxWidth="lg">
          <Skeleton variant="text" width={220} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={360} sx={{ borderRadius: '28px', mb: 4 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={360} sx={{ borderRadius: '22px' }} />
            ))}
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !atelier) {
    return (
      <Box sx={{ pt: PAGE_PT, pb: 10, textAlign: 'center', overflowX: 'hidden' }}>
        <Seo title="Atölye bulunamadı" path={`/atolye/${slug || ''}`} noindex />
        <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '1.4rem', mb: 1 }}>Atölye bulunamadı</Typography>
        <Typography sx={{ color: '#6E5252', fontWeight: 600, mb: 3 }}>{error || 'Bu vitrin yayında değil.'}</Typography>
        <Button
          onClick={() => navigate('/products')}
          endIcon={<ArrowForwardRounded />}
          sx={{ bgcolor: '#946D6D', color: '#fff', borderRadius: '14px', px: 3, fontWeight: 800, '&:hover': { bgcolor: '#7c5a5a' } }}
        >
          Ürünlere dön
        </Button>
      </Box>
    );
  }

  const stats = [
    { label: 'Vitrin', value: atelier.productCount || 0 },
    { label: 'Satış', value: atelier.soldCount || 0 },
    { label: 'Yorum', value: atelier.reviewCount || 0 },
    { label: 'Kuruluş', value: atelier.sinceYear || '—' }
  ];

  return (
    <Box sx={{ pt: PAGE_PT, pb: { xs: 8, md: 12 }, minHeight: '100vh', overflowX: 'hidden' }}>
      <Seo
        title={`${atelier.magazaAdi} | Atölye`}
        description={atelier.aciklama || `${atelier.magazaAdi} el yapımı vitrini.`}
        path={`/atolye/${atelier.slug}`}
        image={covers[0]}
      />
      <Container maxWidth="lg" sx={{ minWidth: 0 }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{
            mb: { xs: 2, md: 2.8 },
            color: '#A290B7',
            fontWeight: 600,
            '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap', rowGap: 0.4 }
          }}
        >
          <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Anasayfa</Link>
          <Link underline="hover" color="inherit" onClick={() => navigate('/products')} sx={{ cursor: 'pointer' }}>Ürünler</Link>
          <Typography sx={{ color: '#2E3B55', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: { xs: 180, sm: 320 } }}>
            {atelier.magazaAdi}
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            mb: { xs: 4, md: 5.5 },
            borderRadius: { xs: '24px', md: '30px' },
            overflow: 'hidden',
            minWidth: 0,
            background: '#FFFFFF',
            border: '1px solid rgba(148,109,109,0.14)',
            boxShadow: '0 22px 48px -28px rgba(46,59,85,0.45)'
          }}
        >
          <CoverGallery images={covers} alt={`${atelier.magazaAdi} vitrini`} />

          <Box sx={{ px: { xs: 2, md: 3.2 }, pb: { xs: 2.4, md: 3.2 }, pt: 0, minWidth: 0 }}>
            <Avatar
              src={mediaUrl(atelier.avatarUrl) || undefined}
              alt={atelier.magazaAdi}
              sx={{
                width: { xs: 76, md: 88 },
                height: { xs: 76, md: 88 },
                mt: { xs: -5, md: -6 },
                mb: 1.6,
                bgcolor: '#B0CDE6',
                color: '#2E3B55',
                fontWeight: 800,
                fontSize: '1.6rem',
                border: '4px solid #FFFFFF',
                boxShadow: '0 10px 24px -12px rgba(46,59,85,0.45)'
              }}
            >
              {initialsOf(atelier.magazaAdi)}
            </Avatar>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mb: 1.2 }}>
              <Chip
                icon={<VerifiedOutlined sx={{ fontSize: '16px !important', color: '#FFFFFF !important' }} />}
                label="Onaylı atölye"
                sx={{ bgcolor: '#946D6D', color: '#FFFFFF', fontWeight: 800, height: 28, '& .MuiChip-icon': { ml: 0.6 } }}
              />
              {atelier.hesapTipi ? (
                <Chip label={atelier.hesapTipi} sx={{ bgcolor: '#B0CDE6', color: '#2E3B55', fontWeight: 800, height: 28 }} />
              ) : null}
            </Box>

            <Typography
              component="h1"
              fontWeight={800}
              sx={{
                color: '#2E3B55',
                fontSize: { xs: '1.7rem', md: '2.2rem' },
                letterSpacing: '-0.04em',
                lineHeight: 1.12,
                wordBreak: 'break-word'
              }}
            >
              {atelier.magazaAdi}
            </Typography>
            <Typography sx={{ color: '#6E5252', fontWeight: 700, mt: 0.45 }}>
              {atelier.makerName && atelier.makerName !== atelier.magazaAdi ? `${atelier.makerName} · ` : ''}
              {atelier.magazaTuruEtiket || 'El yapımı'}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, color: '#6E5252', fontWeight: 700, fontSize: '0.88rem', mt: 1.3, mb: 1.6 }}>
              {locationLabel ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
                  <PlaceOutlined sx={{ fontSize: 18 }} />
                  {locationLabel}
                </Box>
              ) : null}
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
                <StorefrontOutlined sx={{ fontSize: 18 }} />
                {atelier.productCount} parça vitrinde
              </Box>
              {atelier.rating > 0 ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, flexShrink: 0 }}>
                  <Rating value={atelier.rating} precision={0.1} readOnly size="small" sx={{ color: '#DDA15E' }} />
                  {Number(atelier.rating).toFixed(1)}
                </Box>
              ) : null}
            </Box>

            <Typography sx={{ color: '#2E3B55', fontWeight: 600, lineHeight: 1.7, maxWidth: 640, mb: 2.2 }}>
              {atelier.aciklama || 'Bu atölye Nik Bag vitrininde onaylı üretim yapıyor.'}
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
                gap: 1,
                mb: 2.2
              }}
            >
              {stats.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    p: { xs: 1.15, md: 1.25 },
                    borderRadius: '16px',
                    bgcolor: '#FDF4D2',
                    border: '1px solid rgba(148,109,109,0.12)',
                    textAlign: 'center',
                    minWidth: 0
                  }}
                >
                  <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: { xs: '1rem', md: '1.15rem' } }}>{item.value}</Typography>
                  <Typography sx={{ color: '#8A7373', fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.4 }}>{item.label}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {ig ? (
                <Button component="a" href={ig} target="_blank" rel="noopener noreferrer" startIcon={<InstagramIcon />} sx={socialBtnSx}>
                  Instagram
                </Button>
              ) : null}
              {site ? (
                <Button component="a" href={site} target="_blank" rel="noopener noreferrer" startIcon={<LanguageRounded />} sx={socialBtnSx}>
                  Web sitesi
                </Button>
              ) : null}
              <Button onClick={scrollToVitrin} endIcon={<ArrowForwardRounded />} sx={{ ...socialBtnSx, bgcolor: '#2E3B55', color: '#FFFFFF', borderColor: '#2E3B55', '&:hover': { bgcolor: '#946D6D', borderColor: '#946D6D' } }}>
                Vitrine bak
              </Button>
            </Box>
          </Box>
        </Box>

        <Box id="atolye-vitrin" sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap', scrollMarginTop: '96px' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: { xs: '1.35rem', md: '1.7rem' }, letterSpacing: '-0.03em' }}>
              Atölye vitrini
            </Typography>
            <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 0.4 }}>
              {pagination.total > 0
                ? `${pagination.total} parçadan ${products.length} tanesi gösteriliyor`
                : 'Bu atölyenin vitrininde henüz ürün yok.'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.6 }}>
          <Chip label={`Tümü (${atelier.productCount || 0})`} onClick={() => setFilter({ kategori: '' })} sx={chipSx(!category)} />
          {categories.map((item) => (
            <Chip
              key={item.id}
              label={`${item.label} (${item.count})`}
              onClick={() => setFilter({ kategori: item.id })}
              sx={chipSx(category === item.id)}
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 3 }}>
          {SORTS.map((item) => (
            <Chip key={item.id} label={item.label} onClick={() => setFilter({ sira: item.id })} sx={chipSx(sort === item.id)} />
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1.5, md: 2.5 } }}>
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={360} sx={{ borderRadius: '22px' }} />
            ))}
          </Box>
        ) : products.length > 0 ? (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                gap: { xs: 1.5, md: 2.5 }
              }}
            >
              {products.map((product) => (
                <Box key={product._id || product.id} sx={{ minWidth: 0 }}>
                  <ProductCard product={product} fullWidth />
                </Box>
              ))}
            </Box>
            {pagination.hasMore ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  endIcon={<ExpandMoreIcon />}
                  sx={{ borderRadius: '999px', px: 3, py: 1.1, fontWeight: 800, color: '#2E3B55', bgcolor: '#FFFFFF', border: '1px solid rgba(148,109,109,0.2)', '&:hover': { bgcolor: '#946D6D', color: '#FFFFFF' } }}
                >
                  {loadingMore ? 'Yükleniyor' : `Daha fazla göster (${Math.max(0, (pagination.total || 0) - products.length)})`}
                </Button>
              </Box>
            ) : null}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 7, px: 2, borderRadius: '22px', bgcolor: 'rgba(255,255,255,0.7)', border: '1px dashed rgba(148,109,109,0.25)' }}>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 0.8 }}>Bu seçimde ürün yok</Typography>
            <Typography sx={{ color: '#6E5252', fontWeight: 600, mb: 2 }}>Başka bir kategori veya sıralama dene.</Typography>
            <Button onClick={() => setFilter({ kategori: '', sira: 'newest' })} sx={{ fontWeight: 800, color: '#946D6D' }}>
              Filtreleri temizle
            </Button>
          </Box>
        )}
      </Container>
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
