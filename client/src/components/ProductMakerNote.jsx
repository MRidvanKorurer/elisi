import { Box, Typography } from '@mui/material';
import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined';
import { useTranslation } from 'react-i18next';
import { buildFulfillment } from '../utils/shipping';

export default function ProductMakerNote({ product }) {
  const { t } = useTranslation('catalog');
  const fulfillment = buildFulfillment(product);
  const isCustom = fulfillment?.delivery?.kind === 'custom';

  // Üretim, kargo ve ölçü ProductFulfillment’da duruyor; burada tekrarlama.
  if (isCustom) return null;

  return (
    <Box
      sx={{
        mb: 2.5,
        p: 1.8,
        borderRadius: '16px',
        bgcolor: 'rgba(243,232,216,0.55)',
        border: '1px solid rgba(148,109,109,0.14)',
        display: 'flex',
        gap: 1.3,
        alignItems: 'flex-start'
      }}
    >
      <Box sx={{ width: 40, height: 40, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: '#fff', color: '#946D6D', flexShrink: 0 }}>
        <CardGiftcardOutlined sx={{ fontSize: 22 }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, color: '#2E3B55', fontSize: '0.92rem' }}>
          {t('product.giftNoteTitle')}
        </Typography>
        <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.82rem', mt: 0.4, lineHeight: 1.55 }}>
          {t('product.giftNoteText')}
        </Typography>
      </Box>
    </Box>
  );
}
