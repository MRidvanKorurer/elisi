import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import Seo from '../components/Seo';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', pt: { xs: 12, md: 16 }, pb: 10, px: 2 }}>
      <Seo title="Sayfa bulunamadı" path="/404" noindex />
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography component="p" sx={{ fontWeight: 800, letterSpacing: 2, color: '#A290B7' }}>
          404
        </Typography>
        <Typography component="h1" variant="h4" fontWeight={800} sx={{ color: '#2E3B55', mt: 1, mb: 1.5 }}>
          Aradığınız sayfa bulunamadı
        </Typography>
        <Typography sx={{ color: '#6E5252', fontWeight: 600, mb: 4 }}>
          Bağlantı değişmiş veya ürün kaldırılmış olabilir. Koleksiyondan devam edebilirsiniz.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
          <Button
            variant="contained"
            endIcon={<ArrowForwardRounded />}
            onClick={() => navigate('/products')}
            sx={{ bgcolor: '#946D6D', borderRadius: '14px', px: 3, py: 1.2, fontWeight: 800, '&:hover': { bgcolor: '#7c5a5a' } }}
          >
            Tüm ürünleri gör
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ borderRadius: '14px', px: 3, py: 1.2, fontWeight: 800, color: '#2E3B55', borderColor: 'rgba(46,59,85,0.25)' }}
          >
            Ana sayfa
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
