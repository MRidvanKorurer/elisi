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

const PAGE_SIZE = 8;

const SORTS = [
  { id: 'newest', label: 'En yeniler' },
  { id: 'popular', label: 'Çok satan' },
  { id: 'rating', label: 'Puan' },
  { id: 'priceAsc', label: 'Fiyat artan' },
  { id: 'priceDesc', label: 'Fiyat azalan' }
];

const initialsOf = (name = '') => String(name).trim().charAt(0).toUpperCase() || 'N';

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
  const covers = (atelier?.coverImages || []).slice(0, 4);
  const categories = atelier?.categories || [];

  if (loading && !atelier) {
    return (
      <Box sx={{ pt: { xs: 11, md: 14 }, pb: 10 }}>
        <Container maxWidth="lg">
          <Skeleton variant="rounded" height={280} sx={{ borderRadius: '28px', mb: 4 }} />
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
      <Box sx={{ pt: { xs: 14, md: 16 }, pb: 10, textAlign: 'center' }}>
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
    <Box sx={{ pt: { xs: 11, md: 13 }, pb: { xs: 8, md: 12 }, minHeight: '100vh' }}>
      <Seo
        title={`${atelier.magazaAdi} | Atölye`}
        description={atelier.aciklama || `${atelier.magazaAdi} el yapımı vitrini.`}
        path={`/atolye/${atelier.slug}`}
        image={covers[0]}
      />
      <Container maxWidth="lg">
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: { xs: 2.5, md: 3.5 }, color: '#A290B7', fontWeight: 600 }}
        >
          <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Anasayfa</Link>
          <Link underline="hover" color="inherit" onClick={() => navigate('/products')} sx={{ cursor: 'pointer' }}>Ürünler</Link>
          <Typography sx={{ color: '#2E3B55', fontWeight: 800 }}>{atelier.magazaAdi}</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(0, 0.85fr)' },
            gap: { xs: 2.4, md: 4 },
            mb: { xs: 4, md: 5.5 },
            p: { xs: 2, md: 2.6 },
            borderRadius: { xs: '24px', md: '32px' },
            background: 'linear-gradient(160deg, #FFFFFF 0%, #F7FBFF 55%, #FDF4D2 100%)',
            border: '1px solid rgba(148,109,109,0.14)',
            boxShadow: '0 22px 48px -28px rgba(46,59,85,0.45)'
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mb: 1.4 }}>
              <Chip
                icon={<VerifiedOutlined sx={{ fontSize: '16px !important', color: '#FFFFFF !important' }} />}
                label="Onaylı atölye"
                sx={{ bgcolor: '#946D6D', color: '#FFFFFF', fontWeight: 800, height: 28, '& .MuiChip-icon': { ml: 0.6 } }}
              />
              {atelier.hesapTipi ? (
                <Chip label={atelier.hesapTipi} sx={{ bgcolor: '#B0CDE6', color: '#2E3B55', fontWeight: 800, height: 28 }} />
              ) : null}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.6, alignItems: 'flex-start', mb: 1.6 }}>
              <Avatar
                src={mediaUrl(atelier.avatarUrl) || undefined}
                alt={atelier.magazaAdi}
                sx={{ width: 72, height: 72, bgcolor: '#B0CDE6', color: '#2E3B55', fontWeight: 800, fontSize: '1.5rem', flexShrink: 0, border: '3px solid #FFFFFF' }}
              >
                {initialsOf(atelier.magazaAdi)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h1" fontWeight={800} sx={{ color: '#2E3B55', fontSize: { xs: '1.7rem', md: '2.25rem' }, letterSpacing: '-0.04em', lineHeight: 1.12 }}>
                  {atelier.magazaAdi}
                </Typography>
                <Typography sx={{ color: '#6E5252', fontWeight: 700, mt: 0.4 }}>
                  {atelier.makerName && atelier.makerName !== atelier.magazaAdi ? `${atelier.makerName} · ` : ''}
                  {atelier.magazaTuruEtiket || 'El yapımı'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, color: '#6E5252', fontWeight: 700, fontSize: '0.88rem', mb: 1.6 }}>
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
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                  <Rating value={atelier.rating} precision={0.1} readOnly size="small" sx={{ color: '#DDA15E' }} />
                  {Number(atelier.rating).toFixed(1)}
                </Box>
              ) : null}
            </Box>

            {atelier.aciklama ? (
              <Typography sx={{ color: '#2E3B55', fontWeight: 600, lineHeight: 1.7, maxWidth: 560, mb: 2 }}>
                {atelier.aciklama}
              </Typography>
            ) : (
              <Typography sx={{ color: '#6E5252', fontWeight: 600, mb: 2 }}>
                Bu atölye Nik Bag vitrininde onaylı üretim yapıyor.
              </Typography>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1, mb: 2 }}>
              {stats.map((item) => (
                <Box key={item.label} sx={{ p: 1.1, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.8)', border: '1px solid rgba(148,109,109,0.12)', textAlign: 'center' }}>
                  <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: { xs: '0.95rem', md: '1.1rem' } }}>{item.value}</Typography>
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
              <Button onClick={() => navigate('/products')} endIcon={<ArrowForwardRounded />} sx={{ ...socialBtnSx, bgcolor: '#2E3B55', color: '#FFFFFF', borderColor: '#2E3B55', '&:hover': { bgcolor: '#946D6D', borderColor: '#946D6D' } }}>
                Tüm koleksiyon
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: 1.1,
              minHeight: { xs: 220, md: 320 }
            }}
          >
            {(covers.length ? covers : [null, null, null, null]).map((src, index) => (
              <Box
                key={`${src || 'empty'}-${index}`}
                sx={{
                  borderRadius: index === 0 ? '22px 12px 12px 12px' : '16px',
                  overflow: 'hidden',
                  bgcolor: index % 2 ? '#B0CDE6' : '#E4DCF0',
                  minHeight: 0
                }}
              >
                {src ? (
                  <Box component="img" src={mediaUrl(src) || src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : null}
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Box>
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
