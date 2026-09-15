import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import Seo from '../components/Seo';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', pt: { xs: 12, md: 16 }, pb: 10, px: 2 }}>
      <Seo title={t('notFound.title', { ns: 'catalog' })} path="/404" noindex />
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography component="p" sx={{ fontWeight: 800, letterSpacing: 2, color: '#A290B7' }}>
          404
        </Typography>
        <Typography component="h1" variant="h4" fontWeight={800} sx={{ color: '#2E3B55', mt: 1, mb: 1.5 }}>
          {t('notFound.heading', { ns: 'catalog' })}
        </Typography>
        <Typography sx={{ color: '#6E5252', fontWeight: 600, mb: 4 }}>
          {t('notFound.text', { ns: 'catalog' })}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
          <Button
            variant="contained"
            endIcon={<ArrowForwardRounded />}
            onClick={() => navigate('/urunler')}
            sx={{ bgcolor: '#946D6D', borderRadius: '14px', px: 3, py: 1.2, fontWeight: 800, '&:hover': { bgcolor: '#7c5a5a' } }}
          >
            {t('actions.seeAllProducts')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ borderRadius: '14px', px: 3, py: 1.2, fontWeight: 800, color: '#2E3B55', borderColor: 'rgba(46,59,85,0.25)' }}
          >
            {t('actions.home')}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
