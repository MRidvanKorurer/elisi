import React, { useMemo } from 'react';
import { Box, Typography, Container } from '@mui/material';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ProductCard, { productCardGridSx } from './ProductCard';

export default function NewArrivals({ products = [], onAddToCart }) {
  const arrivals = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const flagged = list.filter((item) => item.isNewProduct === true);
    const source = flagged.length > 0
      ? flagged
      : [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return source.slice(0, 4);
  }, [products]);

  if (arrivals.length === 0) return null;

  return (
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 }, mt: { xs: 1, md: 2 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ textAlign: 'left', mb: 3 }}>
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
          <AutoAwesomeOutlined sx={{ fontSize: '18px' }} />
          ATÖLYEDEN TAZE
        </Typography>
        <Typography variant="h4" fontWeight="800" sx={{ color: '#2E3B55', letterSpacing: '-0.5px', mt: 0.2, fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2.125rem' } }}>
          Yeni Gelenler
        </Typography>
      </Box>

      <Box sx={productCardGridSx}>
        {arrivals.map((product) => (
          <Box key={product._id}>
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </Box>
        ))}
      </Box>
    </Container>
  );
}
