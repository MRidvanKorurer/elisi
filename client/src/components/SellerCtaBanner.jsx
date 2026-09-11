import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';
import { imgBagGreen } from '../assets/media';
import { SITE_CLIPS } from '../utils/siteVideos';
import { isSellerRole } from '../utils/roles';

export default function SellerCtaBanner({ user }) {
  const navigate = useNavigate();
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
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: '28px', md: '36px' },
          minHeight: { xs: 280, md: 320 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
          gap: 3,
          p: { xs: 3.5, md: 5.5 },
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 24px 50px -24px rgba(46,59,85,0.28)'
        }}
      >
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
            objectFit: 'cover'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(30,39,56,0.78) 0%, rgba(30,39,56,0.45) 55%, rgba(30,39,56,0.2) 100%)'
          }}
        />
        <Box sx={{ position: 'relative', maxWidth: 560, zIndex: 1 }}>
          <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 800, color: '#FDF4D2' }}>
            ÜRETİCİLER İÇİN
          </Typography>
          <Typography component="h2" variant="h4" fontWeight={800} sx={{ color: '#FFFFFF', letterSpacing: '-0.6px', mb: 1.2, fontSize: { xs: '1.7rem', md: '2.1rem' } }}>
            {isSeller ? 'Mağazan seni bekliyor.' : 'Atölyeni vitrine taşı.'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontWeight: 600, lineHeight: 1.75 }}>
            {isSeller
              ? 'Başvuru durumunu gör, el emeğini Nik Bag koleksiyonuna eklemeye hazırlan.'
              : 'El yapımı ürünlerini binlerce meraklıya ulaştır. Başvurun incelenir, onay sonrası mağazan yayına alınır.'}
          </Typography>
        </Box>
        <Button
          onClick={() => navigate(isSeller ? '/admin' : '/satici-ol')}
          startIcon={<StorefrontOutlined />}
          endIcon={<ArrowForwardRounded />}
          sx={{
            position: 'relative',
            zIndex: 1,
            flexShrink: 0,
            width: { xs: '100%', md: 'auto' },
            py: 1.5,
            px: 3.2,
            borderRadius: '16px',
            fontWeight: 800,
            color: '#2E3B55',
            background: 'linear-gradient(135deg, #B0CDE6 0%, #9BB8D4 100%)',
            boxShadow: '0 12px 24px rgba(176,205,230,0.45)',
            '&:hover': { background: '#946D6D', color: '#fff' }
          }}
        >
          {isSeller ? 'Mağazama git' : 'Satıcı Ol'}
        </Button>
      </Box>
    </Container>
  );
}
