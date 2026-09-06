import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';

const STEPS = [
  {
    n: '01',
    icon: <TravelExploreOutlined />,
    title: 'Keşfet',
    text: 'Kategori ve atölyelere göz at, sana uyan el emeğini seç.'
  },
  {
    n: '02',
    icon: <ShoppingBagOutlined />,
    title: 'Sipariş ver',
    text: 'Güvenli ödeme ile sepetini tamamla; kişiye özel üretim notu üründe yazar.'
  },
  {
    n: '03',
    icon: <HomeOutlined />,
    title: 'Kapına gelsin',
    text: 'Üretici hazırlar, kargoya verir. Teslimat süresini sipariş özetinde görürsün.'
  }
];

export default function HowItWorks() {
  return (
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ textAlign: { xs: 'left', md: 'center' }, mb: 4, maxWidth: 640, mx: { md: 'auto' } }}>
        <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 800, color: '#A290B7' }}>
          SÜREÇ
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color: '#2E3B55', letterSpacing: '-0.5px', mt: 0.2, fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2.125rem' } }}>
          Nasıl çalışır?
        </Typography>
        <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 1, lineHeight: 1.7 }}>
          Birçok ürün sipariş üzerine üretilir. Bu yüzden teslimat, stoklu mağazadan biraz daha kişisel bir ritimdedir.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: { xs: 1.5, md: 2.5 }
        }}
      >
        {STEPS.map((step) => (
          <Box
            key={step.n}
            sx={{
              p: { xs: 2.4, md: 3.2 },
              borderRadius: { xs: '22px', md: '28px' },
              background: 'rgba(253,244,210,0.55)',
              border: '1px solid rgba(162, 144, 183, 0.25)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#FFFFFF',
                  color: '#946D6D',
                  boxShadow: '0 8px 18px rgba(148,109,109,0.12)'
                }}
              >
                {step.icon}
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#B0CDE6', fontSize: '1.4rem', letterSpacing: '-1px' }}>
                {step.n}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#2E3B55', mb: 0.8 }}>
              {step.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600, lineHeight: 1.7 }}>
              {step.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
