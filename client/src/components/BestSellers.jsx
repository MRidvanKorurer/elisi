import React, { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Container, Button, CircularProgress } from '@mui/material';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined';
import ProductCard, { productCardGridSx } from './ProductCard';
import { productService } from '../api/productService';

export default function BestSellers({ products = [] }) {
  const [fetchedProducts, setFetchedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);

  const ranked = useMemo(() => {
    const list = Array.isArray(fetchedProducts) ? [...fetchedProducts] : [];
    return list.sort((a, b) => {
      const sold = (b.soldCount || 0) - (a.soldCount || 0);
      if (sold !== 0) return sold;
      return (b.rating || 0) - (a.rating || 0);
    }).slice(0, 8);
  }, [fetchedProducts]);

  useEffect(() => {
    if (products.length > 0) {
      setFetchedProducts(products);
      setLoading(false);
      return;
    }

    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        const data = await productService.getBestSellers();
        setFetchedProducts(data);
      } catch (err) {
        console.error('En çok satanlar çekilemedi:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [products]);

  const currentProducts = ranked.slice(0, visibleCount);
  const hasMore = visibleCount < ranked.length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
        <CircularProgress sx={{ color: '#946D6D' }} />
      </Box>
    );
  }

  if (error || ranked.length === 0) return null;

  return (
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 }, mt: { xs: 1, md: 2 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ textAlign: 'left', mb: 3 }}>
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 2,
            color: '#946D6D',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <LocalFireDepartmentOutlined sx={{ fontSize: '18px', color: '#946D6D' }} />
          HAFTANIN FAVORİLERİ
        </Typography>
        <Typography component="h2" variant="h4" fontWeight="800" sx={{ color: '#2E3B55', letterSpacing: '-0.5px', mt: 0.2, fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2.125rem' } }}>
          En Çok Satan Ürünler
        </Typography>
      </Box>

      <Box sx={productCardGridSx}>
        {currentProducts.map((product) => (
          <Box key={product._id}>
            <ProductCard product={product} />
          </Box>
        ))}
      </Box>

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => setVisibleCount((prev) => prev + 4)}
            endIcon={<KeyboardArrowDownOutlined />}
            sx={{
              borderRadius: '16px',
              px: { xs: 3, sm: 4 },
              py: 1.3,
              borderColor: '#A290B7',
              color: '#946D6D',
              fontWeight: 700,
              backgroundColor: 'rgba(253, 244, 210, 0.6)',
              '&:hover': { borderColor: '#946D6D', backgroundColor: '#946D6D', color: '#FFFFFF' }
            }}
          >
            Daha fazla göster
          </Button>
        </Box>
      )}
    </Container>
  );
}
