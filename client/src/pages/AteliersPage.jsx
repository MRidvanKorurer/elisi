import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  InputAdornment,
  Rating,
  Skeleton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import SiteContainer from '../components/SiteContainer';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import SearchRounded from '@mui/icons-material/SearchRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import LocaleLink from '../i18n/LocaleLink';
import LoadingButton from '../components/LoadingButton';
import Seo from '../components/Seo';
import { atelierWeekService } from '../api/atelierWeekService';
import { mediaUrl } from '../api/lookbookService';
import { categoryLabel } from '../utils/categories';
import useDebounce from '../hooks/useDebounce';

const PAGE_PT = { xs: '96px', md: '120px' };
const TONES = ['#2E3B55', '#946D6D', '#A290B7', '#6E5252'];

const SORTS = [
  { id: 'popular', labelKey: 'directory.sortPopular' },
  { id: 'rating', labelKey: 'directory.sortRating' },
  { id: 'newest', labelKey: 'directory.sortNewest' },
  { id: 'name', labelKey: 'directory.sortName' }
];

const chipIdle = {
  fontWeight: 700,
  bgcolor: 'rgba(255,255,255,0.72)',
  color: '#2E3B55',
  border: '1px solid rgba(148,109,109,0.14)',
  '&:hover': { bgcolor: '#FFFFFF', borderColor: 'rgba(46,59,85,0.22)' }
};

const chipActive = {
  fontWeight: 800,
  bgcolor: '#2E3B55',
  color: '#FFFFFF',
  border: '1px solid #2E3B55',
  '&:hover': { bgcolor: '#3a4a68' }
};

const chipAccent = {
  fontWeight: 800,
  bgcolor: '#946D6D',
  color: '#FFFFFF',
  border: '1px solid #946D6D',
  '&:hover': { bgcolor: '#7c5a5a' }
};

const scrollRowSx = {
  display: 'flex',
  gap: 0.8,
  overflowX: 'auto',
  pb: 0.4,
  mx: { xs: -0.5, md: 0 },
  px: { xs: 0.5, md: 0 },
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' }
};

const initialsOf = (name = '') => String(name).trim().charAt(0).toUpperCase() || 'A';

function CoverImage({ covers = [], tone = '#2E3B55', alt = '' }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = !failed ? mediaUrl(covers[index]) : '';

  if (!src) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(145deg, ${tone} 0%, #946D6D 100%)`,
          opacity: 0.88
        }}
      />
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (index < covers.length - 1) setIndex((prev) => prev + 1);
        else setFailed(true);
      }}
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        transition: 'transform 420ms var(--ease-soft, ease)'
      }}
    />
  );
}

function AtelierTile({ atelier, t, index = 0 }) {
  const location = [atelier.ilce, atelier.sehir].filter(Boolean).join(', ');
  const avatar = mediaUrl(atelier.avatarUrl);
  const covers = (atelier.coverImages || []).filter(Boolean);
  const tone = TONES[index % TONES.length];
  const rating = Number(atelier.rating || 0);

  return (
    <Box
      component={LocaleLink}
      to={`/atolye/${atelier.slug}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
        minWidth: 0,
        bgcolor: '#FFFFFF',
        borderRadius: '22px',
        overflow: 'hidden',
        border: '1px solid rgba(148,109,109,0.12)',
        boxShadow: '0 14px 34px -28px rgba(46,59,85,0.5)',
        transition: 'transform 220ms var(--ease-soft, ease), box-shadow 220ms ease, border-color 220ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(46,59,85,0.2)',
          boxShadow: '0 24px 44px -26px rgba(46,59,85,0.55)'
        },
        '&:hover img': { transform: 'scale(1.04)' },
        '&:hover .atelier-cta': { color: '#946D6D', gap: 0.7 },
        '&:focus-visible': { outline: '3px solid #A290B7', outlineOffset: 3 }
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', bgcolor: 'rgba(148,109,109,0.08)' }}>
        <CoverImage covers={covers} tone={tone} alt="" />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(46,59,85,0.08) 0%, rgba(46,59,85,0) 42%, rgba(46,59,85,0.55) 100%)',
            pointerEvents: 'none'
          }}
        />
        {atelier.isWeeklyAtelier ? (
          <Chip
            size="small"
            icon={<CelebrationOutlined sx={{ fontSize: '15px !important', color: '#FFFFFF !important' }} />}
            label={t('weekly.badge', { ns: 'home' })}
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              height: 26,
              fontWeight: 800,
              fontSize: '0.7rem',
              bgcolor: 'rgba(46,59,85,0.88)',
              color: '#FFFFFF',
              backdropFilter: 'blur(6px)',
              '& .MuiChip-icon': { ml: 0.6 }
            }}
          />
        ) : null}
        <Avatar
          src={avatar || undefined}
          sx={{
            position: 'absolute',
            left: 14,
            bottom: 14,
            width: 48,
            height: 48,
            bgcolor: tone,
            color: '#FFFFFF',
            fontWeight: 800,
            border: '3px solid #FFFFFF',
            boxShadow: '0 8px 18px -10px rgba(46,59,85,0.7)'
          }}
        >
          {initialsOf(atelier.magazaAdi)}
        </Avatar>
      </Box>

      <Box sx={{ p: { xs: 1.7, md: 2 }, pt: 1.8, display: 'flex', flexDirection: 'column', flex: 1, gap: 0.7 }}>
        <Typography sx={{ fontWeight: 900, color: '#2E3B55', lineHeight: 1.25, letterSpacing: '-0.02em', fontSize: '1.05rem' }} noWrap>
          {atelier.magazaAdi}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.8, minHeight: 20 }}>
          {location ? (
            <Typography sx={{ color: '#6E5252', fontSize: 12.5, fontWeight: 700, displayItems: 'center', gap: 0.3, display: 'inline-flex' }}>
              <PlaceOutlined sx={{ fontSize: 14 }} /> {location}
            </Typography>
          ) : null}
          {atelier.magazaTuruEtiket ? (
            <Typography sx={{ color: '#A290B7', fontWeight: 800, fontSize: 12 }} noWrap>
              {atelier.magazaTuruEtiket}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mt: 'auto', pt: 0.8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, minWidth: 0 }}>
            {rating > 0 ? (
              <>
                <Rating value={rating} precision={0.1} readOnly size="small" sx={{ color: '#DDA15E' }} />
                <Typography sx={{ color: '#6E5252', fontWeight: 800, fontSize: 12 }}>
                  {rating.toFixed(1)}
                </Typography>
              </>
            ) : (
              <Typography sx={{ color: '#A290B7', fontWeight: 700, fontSize: 12 }}>
                {t('directory.newMaker')}
              </Typography>
            )}
            <Typography sx={{ color: '#6E5252', fontWeight: 700, fontSize: 12 }} noWrap>
              · {atelier.productCount} {t('directory.products')}
            </Typography>
          </Box>
          <Typography
            className="atelier-cta"
            sx={{
              fontWeight: 800,
              color: '#2E3B55',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.35,
              flexShrink: 0,
              transition: 'color 180ms ease, gap 180ms ease'
            }}
          >
            {t('directory.open')} <ArrowForwardRounded sx={{ fontSize: 16 }} />
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function AtelierSkeleton() {
  return (
    <Box sx={{ borderRadius: '22px', overflow: 'hidden', bgcolor: '#FFFFFF', border: '1px solid rgba(148,109,109,0.1)' }}>
      <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 3', transform: 'none' }} />
      <Box sx={{ p: 2 }}>
        <Skeleton width="70%" height={24} />
        <Skeleton width="45%" height={18} sx={{ mt: 1 }} />
        <Skeleton width="55%" height={18} sx={{ mt: 1.4 }} />
      </Box>
    </Box>
  );
}

export default function AteliersPage() {
  const { t } = useTranslation(['home', 'seo', 'common']);
  const theme = useTheme();
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  const pageSize = isLg ? 9 : isMd ? 6 : isSm ? 4 : 2;

  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [items, setItems] = useState([]);
  const [facets, setFacets] = useState({ cities: [], crafts: [] });
  const [pagination, setPagination] = useState({ page: 1, hasMore: false, total: 0 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const q = searchParams.get('q') || '';
  const sehir = searchParams.get('sehir') || '';
  const tur = searchParams.get('tur') || '';
  const sort = searchParams.get('sort') || 'popular';
  const [searchDraft, setSearchDraft] = useState(q);
  const debouncedSearch = useDebounce(searchDraft, 400);

  useEffect(() => {
    setSearchDraft(q);
  }, [q]);

  useEffect(() => {
    if (debouncedSearch === q) return;
    const next = new URLSearchParams(searchParams);
    if (!debouncedSearch) next.delete('q');
    else next.set('q', debouncedSearch);
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, q, searchParams, setSearchParams]);

  const queryKey = useMemo(() => `${q}|${sehir}|${tur}|${sort}`, [q, sehir, tur, sort]);
  const filtersActive = Boolean(q || sehir || tur || (sort && sort !== 'popular'));
  const requestSeq = useRef(0);

  useEffect(() => {
    setItems([]);
    setLoading(true);
    setPage(1);
  }, [queryKey]);

  useEffect(() => {
    if (pageSize < 1 || page < 1) return undefined;
    let cancelled = false;
    const seq = ++requestSeq.current;
    const requestPage = page;
    if (requestPage > 1) setLoadingMore(true);
    else setLoading(true);
    setError('');
    atelierWeekService.directory({
      q: q || undefined,
      sehir: sehir || undefined,
      tur: tur || undefined,
      sort,
      page: requestPage,
      limit: pageSize
    })
      .then((data) => {
        if (cancelled || seq !== requestSeq.current) return;
        const list = data?.ateliers || [];
        setItems((prev) => {
          if (requestPage <= 1) return list;
          const seen = new Set(prev.map((item) => String(item.slug || item.id)));
          return prev.concat(list.filter((item) => !seen.has(String(item.slug || item.id))));
        });
        setFacets(data?.facets || { cities: [], crafts: [] });
        setPagination(data?.pagination || { page: requestPage, hasMore: false, total: 0 });
      })
      .catch(() => {
        if (!cancelled && seq === requestSeq.current && requestPage <= 1) {
          setItems([]);
          setError(t('directory.loadError'));
        }
      })
      .finally(() => {
        if (!cancelled && seq === requestSeq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
    return () => { cancelled = true; };
  }, [queryKey, q, sehir, tur, sort, page, pageSize, t]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchDraft('');
    setSearchParams({}, { replace: true });
  };

  const loadMore = () => {
    if (!pagination.hasMore || loadingMore || pageSize < 1) return;
    setPage((prev) => prev + 1);
  };

  const remaining = Math.max(0, (pagination.total || 0) - items.length);
  const initialBusy = loading && items.length === 0;

  return (
    <Box
      sx={{
        pt: PAGE_PT,
        pb: { xs: 7, md: 10 },
        minHeight: '70vh',
        background: 'linear-gradient(180deg, rgba(176,205,230,0.22) 0%, rgba(253,244,210,0) 28%, rgba(162,144,183,0.1) 72%, rgba(253,244,210,0) 100%)'
      }}
    >
      <Seo
        title={t('directory.title')}
        path="/atolyeler"
        description={t('ateliersDescription', { ns: 'seo' })}
      />
      <SiteContainer>
        <Box
          sx={{
            mb: { xs: 2.5, md: 3.2 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
            gap: { xs: 2, md: 3 },
            alignItems: 'end'
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 2.2, color: '#946D6D', fontWeight: 800, display: 'block', mb: 0.4 }}
            >
              {t('directory.eyebrow')}
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontWeight: 900,
                color: '#2E3B55',
                fontSize: { xs: '2rem', md: '2.55rem' },
                letterSpacing: '-0.04em',
                lineHeight: 1.05
              }}
            >
              {t('directory.title')}
            </Typography>
            <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 0.9, maxWidth: 520, lineHeight: 1.55 }}>
              {t('directory.subtitle')}
            </Typography>
          </Box>

          <TextField
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={t('directory.searchPlaceholder')}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: '#A290B7' }} />
                  </InputAdornment>
                ),
                endAdornment: searchDraft ? (
                  <InputAdornment position="end">
                    <Box
                      component="button"
                      type="button"
                      aria-label={t('actions.clear', { ns: 'common', defaultValue: 'Temizle' })}
                      onClick={() => setSearchDraft('')}
                      sx={{
                        border: 0,
                        background: 'transparent',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        color: '#6E5252',
                        p: 0.4,
                      borderRadius: '999px',
                      '&:hover': { bgcolor: 'rgba(148,109,109,0.12)' }
                    }}
                  >
                    <CloseRounded sx={{ fontSize: 18 }} />
                  </Box>
                </InputAdornment>
              ) : null
              }
            }}
            sx={{
              bgcolor: 'rgba(255,255,255,0.88)',
              borderRadius: '18px',
              boxShadow: '0 16px 36px -28px rgba(46,59,85,0.45)',
              '& .MuiOutlinedInput-root': {
                borderRadius: '18px',
                fontWeight: 600,
                '& fieldset': { borderColor: 'rgba(148,109,109,0.16)' },
                '&:hover fieldset': { borderColor: 'rgba(148,109,109,0.32)' },
                '&.Mui-focused fieldset': { borderColor: '#946D6D', borderWidth: 1.5 }
              }
            }}
          />
        </Box>

        <Box
          sx={{
            mb: 2.6,
            p: { xs: 1.4, md: 1.8 },
            borderRadius: '22px',
            bgcolor: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(148,109,109,0.12)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ ...scrollRowSx, mb: 1.2 }}>
            {SORTS.map((item) => (
              <Chip
                key={item.id}
                clickable
                label={t(item.labelKey)}
                onClick={() => setFilter('sort', item.id === 'popular' ? '' : item.id)}
                sx={sort === item.id ? chipActive : chipIdle}
              />
            ))}
            {filtersActive ? (
              <Chip
                clickable
                icon={<CloseRounded sx={{ fontSize: '16px !important' }} />}
                label={t('directory.clearFilters')}
                onClick={clearFilters}
                sx={{ ...chipIdle, ml: { sm: 'auto' }, fontWeight: 800 }}
              />
            ) : null}
          </Box>

          {facets.cities?.length ? (
            <Box sx={{ ...scrollRowSx, mb: facets.crafts?.length ? 1.1 : 0 }}>
              <Chip
                clickable
                label={t('directory.allCities')}
                onClick={() => setFilter('sehir', '')}
                sx={!sehir ? chipAccent : chipIdle}
              />
              {facets.cities.map((city) => (
                <Chip
                  key={city.label}
                  clickable
                  label={`${city.label} (${city.count})`}
                  onClick={() => setFilter('sehir', city.label === sehir ? '' : city.label)}
                  sx={sehir === city.label ? chipActive : chipIdle}
                />
              ))}
            </Box>
          ) : null}

          {facets.crafts?.length ? (
            <Box sx={scrollRowSx}>
              <Chip
                clickable
                label={t('directory.allCrafts')}
                onClick={() => setFilter('tur', '')}
                sx={!tur ? { ...chipAccent, bgcolor: '#A290B7', borderColor: '#A290B7', '&:hover': { bgcolor: '#8f7da3' } } : chipIdle}
              />
              {facets.crafts.map((craft) => (
                <Chip
                  key={craft.id}
                  clickable
                  label={`${categoryLabel(craft.id, t)} (${craft.count})`}
                  onClick={() => setFilter('tur', craft.id === tur ? '' : craft.id)}
                  sx={tur === craft.id ? chipActive : chipIdle}
                />
              ))}
            </Box>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1.5, mb: 1.8, flexWrap: 'wrap' }}>
          <Typography sx={{ color: '#6E5252', fontWeight: 800 }}>
            {initialBusy
              ? t('directory.loading')
              : t('directory.showing', {
                  shown: items.length,
                  total: pagination.total || items.length
                })}
          </Typography>
        </Box>

        {error && !initialBusy ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 800, color: '#2E3B55', mb: 1 }}>{error}</Typography>
            <LoadingButton tone="outline" onClick={() => setPage(1)}>
              {t('actions.tryAgain', { ns: 'common' })}
            </LoadingButton>
          </Box>
        ) : initialBusy ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: { xs: 1.6, md: 2 } }}>
            {Array.from({ length: Math.max(pageSize, 6) }).map((_, index) => (
              <AtelierSkeleton key={index} />
            ))}
          </Box>
        ) : items.length === 0 ? (
          <Box
            sx={{
              py: 8,
              px: 2,
              textAlign: 'center',
              borderRadius: '24px',
              bgcolor: 'rgba(255,255,255,0.7)',
              border: '1px dashed rgba(148,109,109,0.28)'
            }}
          >
            <Typography sx={{ fontWeight: 900, color: '#2E3B55', mb: 0.8, fontSize: '1.2rem' }}>
              {t('directory.emptyTitle')}
            </Typography>
            <Typography sx={{ color: '#6E5252', mb: 2.2 }}>{t('directory.emptyText')}</Typography>
            {filtersActive ? (
              <LoadingButton tone="navy" onClick={clearFilters}>
                {t('directory.clearFilters')}
              </LoadingButton>
            ) : null}
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
                gap: { xs: 1.6, md: 2 }
              }}
            >
              {items.map((atelier, index) => (
                <AtelierTile key={atelier.id || atelier.slug} atelier={atelier} t={t} index={index} />
              ))}
            </Box>
            {pagination.hasMore ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4.2 }}>
                <LoadingButton
                  tone="outline"
                  loading={loadingMore}
                  onClick={loadMore}
                  endIcon={<ExpandMoreIcon />}
                  sx={{ borderRadius: '16px', px: 4, py: 1.35 }}
                >
                  {t('directory.showMore', { count: remaining })}
                </LoadingButton>
              </Box>
            ) : null}
          </>
        )}
      </SiteContainer>
    </Box>
  );
}
