import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';

export default function SellerCtaBanner({ user }) {
  const navigate = useNavigate();
  const isSeller = user?.rol === 'seller';

  return (
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: '28px', md: '36px' },
          p: { xs: 3.5, md: 5.5 },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
          gap: 3,
          background: 'linear-gradient(125deg, rgba(176,205,230,0.55) 0%, rgba(255,255,255,0.7) 45%, rgba(162,144,183,0.35) 100%)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 24px 50px -24px rgba(46,59,85,0.28)',
          backdropFilter: 'blur(16px)'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 220,
            height: 220,
            right: -40,
            bottom: -70,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(148,109,109,0.22), transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <Box sx={{ position: 'relative', maxWidth: 560 }}>
          <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 800, color: '#946D6D' }}>
            ÜRETİCİLER İÇİN
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#2E3B55', letterSpacing: '-0.6px', mb: 1.2, fontSize: { xs: '1.7rem', md: '2.1rem' } }}>
            {isSeller ? 'Mağazan seni bekliyor.' : 'Atölyeni vitrine taşı.'}
          </Typography>
          <Typography sx={{ color: '#6E5252', fontWeight: 600, lineHeight: 1.75 }}>
            {isSeller
              ? 'Başvuru durumunu gör, el emeğini Nik Bag koleksiyonuna eklemeye hazırlan.'
              : 'El yapımı ürünlerini binlerce meraklıya ulaştır. Başvurun incelenir, onay sonrası mağazan yayına alınır.'}
          </Typography>
        </Box>
        <Button
          onClick={() => navigate('/satici-ol')}
          startIcon={<StorefrontOutlined />}
          endIcon={<ArrowForwardRounded />}
          sx={{
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
