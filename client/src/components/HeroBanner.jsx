
import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Button, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import CardGiftcard from '@mui/icons-material/CardGiftcard';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ArrowBackIosNewOutlined from '@mui/icons-material/ArrowBackIosNewOutlined';
import ArrowForwardIosOutlined from '@mui/icons-material/ArrowForwardIosOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import FeaturedModal from './FeaturedModal';
import { lookbookService, mediaUrl } from '../api/lookbookService';

import {
  imgBanner1,
  imgBanner2,
  imgBanner3,
  imgBanner4,
  videoBanner
} from '../assets/media';

const VIDEO_SLIDE = { _id: 'hero-bannervideo', type: 'video', url: videoBanner };

const IMAGE_SLIDES = [
  { _id: 'hero-banner1', type: 'image', url: imgBanner1 },
  { _id: 'hero-banner2', type: 'image', url: imgBanner2 },
  { _id: 'hero-banner3', type: 'image', url: imgBanner3 },
  { _id: 'hero-banner4', type: 'image', url: imgBanner4 }
];

const DEFAULT_SLIDES = [VIDEO_SLIDE, ...IMAGE_SLIDES];

export default function HeroBanner({ user, onNavigateAuth }) {
  const { t } = useTranslation('home');
  const navigate = useLocaleNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [heroImages, setHeroImages] = useState(DEFAULT_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    lookbookService.list(false, 'hero')
      .then((data) => {
        const slides = (data.items || [])
          .map((item) => ({ _id: item._id, type: 'image', url: mediaUrl(item.posterUrl), alt: item.label }))
          .filter((item) => item.url);
        if (!cancelled && slides.length) {
          setHeroImages([VIDEO_SLIDE, ...slides]);
          setCurrentIndex(0);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const slide = heroImages[currentIndex];
  const isVideoSlide = slide?.type === 'video';

  const stageRef = useRef(null);
  const [inView, setInView] = useState(true);

  // Hero ekrandan çıkınca slayt döngüsü durur, boşuna kare harcanmaz
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (isVideoSlide && inView) {
      node.play?.().catch(() => {});
    } else {
      node.pause?.();
    }
  }, [isVideoSlide, inView, currentIndex]);

  useEffect(() => {
    if (heroImages.length <= 1 || !inView) return undefined;
    // Video slaytı biraz daha uzun kalsın
    const delay = isVideoSlide ? 12000 : 7000;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, delay);
    return () => clearInterval(timer);
  }, [heroImages.length, currentIndex, inView, isVideoSlide]);

  // Sıradaki görseli sessizce önden indir, geçiş anında bekleme olmasın
  useEffect(() => {
    const next = heroImages[(currentIndex + 1) % heroImages.length];
    if (!next?.url || next.type === 'video') return;
    const preloader = new Image();
    preloader.src = next.url;
  }, [currentIndex, heroImages]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  const [featuredOpen, setFeaturedOpen] = useState(false);

  const mediaSx = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: { xs: 'contain', md: 'cover' },
    objectPosition: 'center center',
    display: 'block',
    backgroundColor: '#1E2738'
  };

  return (
    <Box
      ref={stageRef}
      sx={{
        position: 'relative',
        width: '100%',
        // Mobil: navbar altında slider + kart; masaüstü: tam ekran overlay
        height: { xs: 'auto', md: 'min(calc(100svh / 1.6180339887 + 156px), calc(100svh - 108px))' },
        mt: 0,
        mb: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'flex-end' },
        overflow: { xs: 'visible', md: 'hidden' },
        backgroundColor: { xs: '#FDF4D2', md: '#1E2738' }
      }}
    >
      <Box
        sx={{
          position: { xs: 'relative', md: 'absolute' },
          inset: { md: 0 },
          width: '100%',
          height: { xs: 'auto', md: '100%' },
          overflow: 'hidden',
          backgroundColor: '#1E2738',
          pt: { xs: '64px', md: 0 }
        }}
      >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: { xs: '2752 / 1536', md: 'unset' },
          height: { xs: 'auto', md: '100%' },
          minHeight: { xs: 168, md: '100%' }
        }}
      >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: isDesktop && !isVideoSlide ? 1.05 : 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.7, ease: 'easeOut' },
            scale: { duration: isDesktop && !isVideoSlide ? 7 : 0.7, ease: isDesktop && !isVideoSlide ? 'linear' : 'easeOut' }
          }}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, willChange: 'opacity, transform' }}
        >
          {isVideoSlide ? (
            <Box
              component="video"
              ref={videoRef}
              src={slide.url}
              muted
              loop
              playsInline
              autoPlay
              disablePictureInPicture
              preload="auto"
              aria-label={t('hero.alt')}
              sx={mediaSx}
            />
          ) : (
            <Box
              component="img"
              src={slide?.url}
              alt={t('hero.alt')}
              decoding="async"
              loading={currentIndex === 0 ? 'eager' : 'lazy'}
              fetchPriority={currentIndex === 0 ? 'high' : 'low'}
              sx={mediaSx}
            />
          )}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: {
                xs: 'transparent',
                md: 'linear-gradient(180deg, rgba(30, 39, 56, 0.22) 0%, rgba(30, 39, 56, 0.05) 42%, rgba(30, 39, 56, 0.42) 100%)'
              },
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        </motion.div>
      </AnimatePresence>

      {heroImages.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: 28, right: 32, display: { xs: 'none', md: 'flex' }, gap: 1, zIndex: 10 }}>
          <IconButton onClick={handlePrev} sx={{ width: 48, height: 48, backgroundColor: 'rgba(253, 244, 210, 0.95)', color: '#946D6D', transition: 'background-color 0.2s, color 0.2s', '&:hover': { backgroundColor: '#B0CDE6', color: '#1E2738' } }}>
            <ArrowBackIosNewOutlined sx={{ fontSize: '16px' }} />
          </IconButton>
          <IconButton onClick={handleNext} sx={{ width: 48, height: 48, backgroundColor: '#A290B7', color: '#FFFFFF', transition: 'all 0.3s', '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF' } }}>
            <ArrowForwardIosOutlined sx={{ fontSize: '16px' }} />
          </IconButton>
        </Box>
      )}

      {heroImages.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 22,
            left: '50%',
            transform: 'translateX(-50%)',
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.2,
            zIndex: 10,
            px: 2,
            py: 1,
            borderRadius: '50px',
            backgroundColor: 'rgba(30, 39, 56, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          {heroImages.map((img, idx) => (
            <Box
              key={`desk-${img._id || idx}`}
              component="button"
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setCurrentIndex(idx)}
              sx={{
                appearance: 'none',
                border: 0,
                p: 0,
                m: 0,
                width: 44,
                height: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: 'transparent',
                '&::after': {
                  content: '""',
                  width: currentIndex === idx ? 28 : 10,
                  height: 7,
                  borderRadius: '10px',
                  backgroundColor: currentIndex === idx ? '#FDF4D2' : 'rgba(253, 244, 210, 0.35)',
                  boxShadow: currentIndex === idx ? '0 0 10px rgba(253, 244, 210, 0.8)' : 'none',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                }
              }}
            />
          ))}
        </Box>
      )}
      </Box>
      {heroImages.length > 1 && (
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.2,
            py: 1.1,
            backgroundColor: '#1E2738'
          }}
        >
          {heroImages.map((img, idx) => (
            <Box
              key={`mobi-${img._id || idx}`}
              component="button"
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setCurrentIndex(idx)}
              sx={{
                appearance: 'none',
                border: 0,
                p: 0,
                m: 0,
                width: 44,
                height: 36,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: 'transparent',
                '&::after': {
                  content: '""',
                  width: currentIndex === idx ? 28 : 10,
                  height: 7,
                  borderRadius: '10px',
                  backgroundColor: currentIndex === idx ? '#FDF4D2' : 'rgba(253, 244, 210, 0.35)',
                  boxShadow: currentIndex === idx ? '0 0 10px rgba(253, 244, 210, 0.8)' : 'none',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                }
              }}
            />
          ))}
        </Box>
      )}
      </Box>

      {/* 2. SOL KART — mobilde sliderın altında, masaüstünde overlay */}
      <Box
        sx={{
          position: { xs: 'relative', md: 'absolute' },
          left: { xs: 0, md: 40 },
          right: { xs: 0, md: 'auto' },
          bottom: { xs: 'auto', md: 44 },
          zIndex: 5,
          width: { xs: '100%', md: 380 },
          maxWidth: { xs: 'none', md: 400 },
          px: { xs: 2, md: 0 },
          pt: { xs: 2, md: 0 },
          pb: { xs: 0.5, md: 0 }
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ width: '100%' }}
        >
          <Box
            sx={{
              p: { xs: 2, sm: 2.75 },
              borderRadius: '20px',
              backgroundColor: 'rgba(253, 244, 210, 0.94)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 15px 30px rgba(0,0,0,0.12)'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#A290B7',
                fontWeight: 800,
                mb: 1,
                display: 'block',
                fontSize: '0.75rem',
                letterSpacing: '2.5px',
                textTransform: 'uppercase'
              }}
            >
              {t('hero.kicker')}
            </Typography>

            <Typography
              variant="h1"
              sx={{
                color: '#946D6D',
                mb: 1.5,
                fontSize: { xs: '2rem', sm: '2.6rem', md: '3.3rem' },
                fontWeight: 800,
                letterSpacing: '-1px',
                lineHeight: 1.05
              }}
            >
              Nik Bag.
              <Box
                component="span"
                sx={{
                  display: 'block',
                  mt: 0.6,
                  color: '#2E3B55',
                  fontSize: { xs: '0.82rem', md: '0.95rem' },
                  fontWeight: 700,
                  letterSpacing: '0.2px',
                  lineHeight: 1.35
                }}
              >
                {t('hero.tagline')}
              </Box>
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#6E5252',
                fontWeight: 500,
                mb: 2.5,
                fontSize: { xs: '0.85rem', md: '0.95rem' },
                lineHeight: 1.5
              }}
            >
              {!user ? t('hero.guestLead') : t('hero.memberLead')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, width: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.2, width: '100%' }}>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<AutoAwesomeIcon sx={{ color: '#1E2738', fontSize: '18px !important' }} />}
                  onClick={() => setFeaturedOpen(true)}
                  fullWidth
                  sx={{
                    borderRadius: '12px',
                    py: 1.1,
                    backgroundColor: '#B0CDE6',
                    color: '#1E2738',
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    letterSpacing: '0.5px',
                    boxShadow: '0 6px 16px rgba(176, 205, 230, 0.35)',
                    transition: 'all 0.3s',
                    '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF', transform: 'translateY(-2px)' }
                  }}
                >
                  {t('hero.featured')}
                </Button>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<StorefrontOutlined sx={{ fontSize: '18px !important' }} />}
                  onClick={() => navigate('/atolyeler')}
                  fullWidth
                  sx={{
                    borderRadius: '12px',
                    py: 1.1,
                    backgroundColor: 'var(--color-accent-lavender)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    letterSpacing: '0.5px',
                    boxShadow: '0 6px 16px rgba(162, 144, 183, 0.35)',
                    transition: 'all 0.3s',
                    '& .MuiSvgIcon-root': { color: '#FFFFFF' },
                    '&:hover': {
                      backgroundColor: 'var(--color-secondary)',
                      color: '#FFFFFF',
                      transform: 'translateY(-2px)',
                      '& .MuiSvgIcon-root': { color: '#FFFFFF' }
                    }
                  }}
                >
                  {t('hero.ateliers')}
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.2, width: '100%' }}>
                {!user && (
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<CardGiftcard sx={{ fontSize: '18px !important' }} />}
                    onClick={onNavigateAuth}
                    fullWidth
                    sx={{
                      borderRadius: '12px',
                      py: 1,
                      backgroundColor: '#946D6D',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      boxShadow: 'none',
                      transition: 'all 0.3s',
                      '&:hover': { backgroundColor: '#A290B7' }
                    }}
                  >
                    {t('hero.register')}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="medium"
                  endIcon={<ArrowForward sx={{ fontSize: '18px !important' }} />}
                  onClick={() => navigate('/urunler')}
                  fullWidth
                  sx={{
                    borderRadius: '12px',
                    py: 1,
                    borderColor: '#A290B7',
                    color: '#946D6D',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    transition: 'all 0.3s',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    '&:hover': {
                      backgroundColor: '#A290B7',
                      color: '#FFFFFF',
                      borderColor: '#A290B7',
                    }
                  }}
                >
                  {t('hero.explore')}
                </Button>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Box>

      <FeaturedModal open={featuredOpen} onClose={() => setFeaturedOpen(false)} />
    </Box>
  );
}
