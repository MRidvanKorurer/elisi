import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import HandshakeOutlined from '@mui/icons-material/HandshakeOutlined';
import VolunteerActivismOutlined from '@mui/icons-material/VolunteerActivismOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';

const ITEMS = [
  {
    icon: <HandshakeOutlined />,
    title: 'El emeği üretim',
    text: 'Her parça atölyelerde, kişiye özel tempo ile hazırlanır.'
  },
  {
    icon: <VolunteerActivismOutlined />,
    title: 'Yerel üretici',
    text: 'Türkiye’deki bağımsız zanaatkârlarla çalışıyoruz.'
  },
  {
    icon: <PaymentsOutlined />,
    title: 'Güvenli ödeme',
    text: 'Kart bilgilerin Iyzico altyapısıyla korunur.'
  },
  {
    icon: <LocalShippingOutlined />,
    title: 'Kargo ve iade',
    text: 'Sipariş üzerine üretim süreleri üründe yazılır.'
  }
];

export default function TrustStrip() {
  return (
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, md: 2.5 }
        }}
      >
        {ITEMS.map((item) => (
          <Box
            key={item.title}
            sx={{
              p: { xs: 2, md: 2.6 },
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.62)',
              border: '1px solid rgba(162, 144, 183, 0.22)',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 12px 30px -18px rgba(148,109,109,0.35)'
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                mb: 1.4,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(176,205,230,0.45)',
                color: '#946D6D'
              }}
            >
              {item.icon}
            </Box>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 0.5, fontSize: { xs: '0.92rem', md: '1rem' } }}>
              {item.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600, lineHeight: 1.55 }}>
              {item.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
