import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getSitePublic } from '../api/siteService';

export const LEGAL_SLUGS = ['gizlilik', 'kvkk', 'mesafeli-satis', 'on-bilgilendirme', 'iade', 'kargo'];

const fill = (text, site, company) =>
  String(text || '')
    .replaceAll('{{company}}', company)
    .replaceAll('{{email}}', site?.email || '')
    .replaceAll('{{phone}}', site?.phone || '')
    .replaceAll('{{address}}', site?.address || '');

export function LegalTextBody({ slug }) {
  const { t } = useTranslation('legal');
  const [site, setSite] = useState(null);
  const key = LEGAL_SLUGS.includes(slug) ? slug : 'gizlilik';

  useEffect(() => {
    getSitePublic().then(setSite).catch(() => {});
  }, []);

  const sections = t(`${key}.sections`, { returnObjects: true });
  const list = Array.isArray(sections) ? sections : [];
  const company = site?.legalName || site?.companyName || 'Nik Bag';

  return (
    <Box>
      <Typography sx={{ color: '#6E5252', mb: 2.2, lineHeight: 1.6 }}>
        {fill(t(`${key}.lead`, { company, email: site?.email || '', phone: site?.phone || '', address: site?.address || '' }), site, company)}
      </Typography>
      <Stack spacing={2}>
        {list.map((section) => (
          <Box key={section.h}>
            <Typography sx={{ fontWeight: 800, color: '#946D6D', mb: 0.5 }}>{section.h}</Typography>
            <Typography sx={{ color: '#2E3B55', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {fill(section.p, site, company)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default function LegalTextDialog({
  open,
  slug,
  slugs,
  onClose,
  onAccept
}) {
  const { t } = useTranslation('legal');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const choices = (slugs?.length ? slugs : [slug]).filter((item) => LEGAL_SLUGS.includes(item));
  const [active, setActive] = useState(slug || choices[0] || 'gizlilik');

  useEffect(() => {
    if (open && slug) setActive(LEGAL_SLUGS.includes(slug) ? slug : 'gizlilik');
  }, [open, slug]);

  const current = LEGAL_SLUGS.includes(active) ? active : 'gizlilik';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: '24px' } } } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#2E3B55', pr: 2 }}>
        {t(`${current}.title`)}
      </DialogTitle>
      <DialogContent dividers data-lenis-prevent>
        {choices.length > 1 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
            {choices.map((item) => (
              <Button
                key={item}
                onClick={() => setActive(item)}
                sx={{
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  px: 1.4,
                  color: item === current ? '#fff' : '#2E3B55',
                  bgcolor: item === current ? '#2E3B55' : '#FDF4D2',
                  '&:hover': { bgcolor: item === current ? '#946D6D' : 'rgba(148,109,109,0.12)' }
                }}
              >
                {t(`${item}.title`)}
              </Button>
            ))}
          </Box>
        )}
        <LegalTextBody slug={current} />
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ fontWeight: 800, color: '#6E5252', textTransform: 'none' }}>
          Kapat
        </Button>
        <Button
          onClick={() => {
            onAccept?.(current);
            onClose?.();
          }}
          sx={{
            fontWeight: 800,
            color: '#fff',
            bgcolor: '#2E3B55',
            borderRadius: '12px',
            px: 2,
            textTransform: 'none',
            '&:hover': { bgcolor: '#946D6D' }
          }}
        >
          Okudum, onaylıyorum
        </Button>
      </DialogActions>
    </Dialog>
  );
}
