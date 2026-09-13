import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Typography, Stack } from '@mui/material';
import Seo from '../components/Seo';
import { getSitePublic } from '../api/siteService';

const SLUGS = ['gizlilik', 'kvkk', 'mesafeli-satis', 'on-bilgilendirme', 'iade', 'kargo'];

export default function LegalPage() {
  const location = useLocation();
  const { t } = useTranslation('legal');
  const segment = location.pathname.split('/').filter(Boolean).pop();
  const key = SLUGS.includes(segment) ? segment : 'gizlilik';
  const [site, setSite] = useState(null);

  useEffect(() => {
    getSitePublic().then(setSite);
  }, []);

  const sections = t(`${key}.sections`, { returnObjects: true });
  const list = Array.isArray(sections) ? sections : [];
  const company = site?.legalName || site?.companyName || 'Nik Bag';

  return (
    <Box sx={{ minHeight: '70vh', pt: { xs: 12, md: 14 }, pb: 8 }}>
      <Seo title={t(`${key}.title`)} path={`/${key}`} />
      <Container maxWidth="md">
        <Typography component="h1" sx={{ fontWeight: 800, color: '#2E3B55', letterSpacing: '-0.03em', fontSize: { xs: '1.7rem', md: '2.2rem' }, mb: 1 }}>
          {t(`${key}.title`)}
        </Typography>
        <Typography sx={{ color: '#6E5252', mb: 3, lineHeight: 1.6 }}>
          {t(`${key}.lead`, { company, email: site?.email || '', phone: site?.phone || '', address: site?.address || '' })}
        </Typography>
        <Stack spacing={2.5}>
          {list.map((section) => (
            <Box key={section.h}>
              <Typography sx={{ fontWeight: 800, color: '#946D6D', mb: 0.6 }}>{section.h}</Typography>
              <Typography sx={{ color: '#2E3B55', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {String(section.p || '')
                  .replaceAll('{{company}}', company)
                  .replaceAll('{{email}}', site?.email || '')
                  .replaceAll('{{phone}}', site?.phone || '')
                  .replaceAll('{{address}}', site?.address || '')}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Typography sx={{ mt: 4, color: '#6E5252', fontSize: '0.85rem' }}>
          {t('disclaimer')}
        </Typography>
      </Container>
    </Box>
  );
}
