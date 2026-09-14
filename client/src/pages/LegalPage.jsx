import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography } from '@mui/material';
import Seo from '../components/Seo';
import { LEGAL_SLUGS, LegalTextBody } from '../components/LegalTextDialog';

export default function LegalPage() {
  const location = useLocation();
  const { t } = useTranslation('legal');
  const segment = location.pathname.split('/').filter(Boolean).pop();
  const key = LEGAL_SLUGS.includes(segment) ? segment : 'gizlilik';

  return (
    <Box sx={{ minHeight: '70vh', pt: { xs: 12, md: 14 }, pb: 8 }}>
      <Seo title={t(`${key}.title`)} path={`/${key}`} />
      <Container maxWidth="md">
        <Typography component="h1" sx={{ fontWeight: 800, color: '#2E3B55', letterSpacing: '-0.03em', fontSize: { xs: '1.7rem', md: '2.2rem' }, mb: 1 }}>
          {t(`${key}.title`)}
        </Typography>
        <LegalTextBody slug={key} />
        <Typography sx={{ mt: 4, color: '#6E5252', fontSize: '0.85rem' }}>
          {t('disclaimer')}
        </Typography>
      </Container>
    </Box>
  );
}
