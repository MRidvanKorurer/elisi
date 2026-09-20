import { useEffect, useState } from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import SiteContainer from './SiteContainer';
import { useTranslation } from 'react-i18next';
import LocaleLink from '../i18n/LocaleLink';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import Reveal from './Reveal';
import { SectionSpinner } from './LoadingButton';
import { atelierWeekService } from '../api/atelierWeekService';
import { adsService } from '../api/adsService';
import { mediaUrl } from '../api/lookbookService';

const initialsOf = (name = '') => String(name).trim().charAt(0).toUpperCase() || 'N';
const TILE_TONES = ['#2E3B55', '#946D6D', '#A290B7', '#B0CDE6'];

const uniqueCovers = (images = []) => {
  const seen = new Set();
  return images.map(mediaUrl).filter((src) => {
    if (!src || seen.has(src)) return false;
    seen.add(src);
    return true;
  }).slice(0, 4);
};

function ProductTiles({ images = [] }) {
  const covers = uniqueCovers(images);
  const tiles = Array.from({ length: 4 }, (_, index) => covers[index] || covers[index % Math.max(covers.length, 1)] || null);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        aspectRatio: '1 / 1',
        gap: '3px',
        bgcolor: '#FFFFFF'
      }}
    >
      {tiles.map((src, index) => (
        src ? (
          <Box
            key={`${src}-${index}`}
            sx={{
              minWidth: 0,
              minHeight: 0,
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 0.6
            }}
          >
            <Box
              component="img"
              src={src}
              alt=""
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block'
              }}
            />
          </Box>
        ) : (
          <Box key={`empty-${index}`} sx={{ bgcolor: TILE_TONES[index], opacity: 0.22 }} />
        )
      ))}
    </Box>
  );
}

function WeekShopCard({ atelier, onVisit, t }) {
  const storePath = atelier.slug ? `/atolye/${atelier.slug}` : '/urunler';
  const location = [atelier.ilce, atelier.sehir].filter(Boolean).join(', ');
  const avatar = mediaUrl(atelier.avatarUrl);
  const countLabel = atelier.productCount > 0
    ? t('weekly.products', { count: atelier.productCount })
    : t('weekly.vitrine');

  return (
    <Box
      component={LocaleLink}
      to={storePath}
      onClick={() => onVisit?.(atelier)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        textDecoration: 'none',
        color: 'inherit',
        bgcolor: '#FFFFFF',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid rgba(148,109,109,0.12)',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: 'rgba(46,59,85,0.18)',
          boxShadow: '0 18px 36px -24px rgba(46,59,85,0.45)'
        },
        '&:hover .week-cta': { color: '#946D6D' },
        '&:focus-visible': { outline: '3px solid #A290B7', outlineOffset: 3 }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <ProductTiles images={atelier.coverImages} />
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            px: 1,
            height: 22,
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '999px',
            bgcolor: 'rgba(46,59,85,0.88)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.64rem',
            letterSpacing: 0.4
          }}
        >
          {t('weekly.badge')}
        </Box>
      </Box>

      <Box sx={{ p: 1.7, display: 'flex', flexDirection: 'column', gap: 1.2, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, minWidth: 0 }}>
          <Avatar
            src={avatar || undefined}
            alt={atelier.magazaAdi}
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              bgcolor: '#B0CDE6',
              color: '#2E3B55',
              fontWeight: 800,
              fontSize: '0.95rem'
            }}
          >
            {initialsOf(atelier.magazaAdi)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              fontWeight={800}
              sx={{
                color: '#2E3B55',
                fontSize: '0.98rem',
                letterSpacing: '-0.2px',
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {atelier.magazaAdi}
            </Typography>
            <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.75rem', mt: 0.2, display: 'flex', gap: 0.7, alignItems: 'center', flexWrap: 'wrap' }}>
              {location ? (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                  <PlaceOutlined sx={{ fontSize: 13 }} />
                  {location}
                </Box>
              ) : null}
              <Box component="span">{countLabel}</Box>
            </Typography>
          </Box>
        </Box>

        <Box
          className="week-cta"
          sx={{
            mt: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.4,
            color: '#2E3B55',
            fontWeight: 800,
            fontSize: '0.78rem',
            transition: 'color 160ms ease'
          }}
        >
          {t('weekly.seeShop')}
          <ArrowForwardRounded sx={{ fontSize: 16 }} />
        </Box>
      </Box>
    </Box>
  );
}

export default function WeeklyAteliers() {
  const { t } = useTranslation('home');
  const [ateliers, setAteliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    atelierWeekService.list()
      .then((data) => {
        if (!active) return;
        setAteliers((data?.ateliers || []).slice(0, 3));
      })
      .catch(() => {
        if (active) setAteliers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ateliers.length) return;
    adsService.track(ateliers.map((atelier) => ({
      type: 'impression',
      surface: 'atelier',
      seller: atelier.userId || null
    })));
  }, [ateliers]);

  if (loading) {
    return (
      <Box component="section" sx={{ py: { xs: 5, md: 7 } }}>
        <SiteContainer sx={{ px: { xs: 2, sm: 3 } }}>
          <SectionSpinner />
        </SiteContainer>
      </Box>
    );
  }

  if (!ateliers.length) return null;

  return (
    <Reveal>
      <Box component="section" sx={{ py: { xs: 5, md: 7 } }}>
        <SiteContainer sx={{ px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              justifyContent: 'space-between',
              gap: 2,
              mb: { xs: 2.4, md: 3 }
            }}
          >
            <Box sx={{ minWidth: 0, maxWidth: 560 }}>
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
                <CelebrationOutlined sx={{ fontSize: 18 }} />
                {t('weekly.eyebrow')}
              </Typography>
              <Typography
                component="h2"
                fontWeight={800}
                sx={{ color: '#2E3B55', letterSpacing: '-0.5px', mt: 0.2, fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2.125rem' } }}
              >
                {t('weekly.title')}
              </Typography>
              <Typography sx={{ mt: 0.7, color: '#6E5252', fontWeight: 600, fontSize: { xs: '0.88rem', md: '0.95rem' } }}>
                {t('weekly.subtitle')}
              </Typography>
            </Box>
            <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: '#A290B7', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
              {t('weekly.slots', { current: ateliers.length })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.6 }}>
            <Box
              component={LocaleLink}
              to="/atolyeler"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color: '#2E3B55',
                fontWeight: 800,
                fontSize: '0.88rem',
                textDecoration: 'none',
                '&:hover': { color: '#946D6D' }
              }}
            >
              {t('weekly.seeAll')}
              <ArrowForwardRounded sx={{ fontSize: 18 }} />
            </Box>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: ateliers.length === 1 ? 'minmax(0, 360px)' : 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))'
              },
              gap: { xs: 1.6, md: 2 }
            }}
          >
            {ateliers.map((atelier) => (
              <WeekShopCard
                key={atelier.id}
                atelier={atelier}
                t={t}
                onVisit={() => adsService.track({
                  type: 'click',
                  surface: 'atelier',
                  seller: atelier.userId || null
                })}
              />
            ))}
          </Box>
        </SiteContainer>
      </Box>
    </Reveal>
  );
}
