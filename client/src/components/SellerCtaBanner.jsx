import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import SiteContainer from './SiteContainer';
import { homeEyebrowSx, homeSectionSx, homeSubtitleSx, homeTitleSx } from './homeType';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import { imgBagGreen } from '../assets/media';
import { SITE_CLIPS } from '../utils/siteVideos';
import { isSellerRole } from '../utils/roles';

export default function SellerCtaBanner({ user }) {
  const { t } = useTranslation('home');
  const navigate = useLocaleNavigate();
  const isSeller = isSellerRole(user?.rol);

  // Arka plan videosu yalnızca banner görünüme girince indirilip oynatılır
  const videoRef = useRef(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActivated(true);
          node.play?.().catch(() => {});
        } else {
          node.pause?.();
        }
      },
      { threshold: 0.2, rootMargin: '200px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <SiteContainer sx={homeSectionSx}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) minmax(0, 0.95fr)' },
          overflow: 'hidden',
          borderRadius: { xs: '28px', md: '36px' },
          bgcolor: '#1E2738',
          minHeight: { md: 420 },
          boxShadow: '0 24px 50px -24px rgba(46,59,85,0.28)'
        }}
      >
        <Box
          sx={{
            order: { xs: 2, md: 1 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: { xs: 'stretch', md: 'flex-start' },
            gap: 0,
            p: { xs: 3, md: 5.5 }
          }}
        >
          <Typography sx={{ ...homeEyebrowSx, color: '#FDF4D2' }}>
            {t('sellerCta.eyebrow')}
          </Typography>
          <Typography component="h2" sx={{ ...homeTitleSx, color: '#FFFFFF', mb: 0 }}>
            {isSeller ? t('sellerCta.sellerTitle') : t('sellerCta.guestTitle')}
          </Typography>
          <Typography sx={{ ...homeSubtitleSx, color: 'rgba(255,255,255,0.88)', maxWidth: 460 }}>
            {isSeller ? t('sellerCta.sellerText') : t('sellerCta.guestText')}
          </Typography>
          <Button
            onClick={() => navigate(isSeller ? '/panel' : '/satici-ol')}
            startIcon={<StorefrontOutlined />}
            endIcon={<ArrowForwardRounded />}
            sx={{
              mt: 2.4,
              alignSelf: { xs: 'stretch', md: 'flex-start' },
              py: 1.4,
              px: 2.8,
              borderRadius: '14px',
              fontWeight: 800,
              color: '#2E3B55',
              bgcolor: '#FDF4D2',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#946D6D', color: '#fff' }
            }}
          >
            {isSeller ? t('sellerCta.sellerButton') : t('sellerCta.guestButton')}
          </Button>
        </Box>

        <Box sx={{ order: { xs: 1, md: 2 }, position: 'relative', minHeight: { xs: 240, md: '100%' }, aspectRatio: { xs: '16 / 10', md: 'auto' } }}>
          <Box
            component="video"
            ref={videoRef}
            src={activated ? SITE_CLIPS.hareket : undefined}
            poster={imgBagGreen}
            muted
            loop
            playsInline
            disablePictureInPicture
            preload="none"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
              display: 'block'
            }}
          />
        </Box>
      </Box>
    </SiteContainer>
  );
}
