import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

function Row({ label, value, strong }) {
  if (!value) return null;
  return (
    <Box sx={{ mt: 0.85 }}>
      <Typography sx={{ color: '#946D6D', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          color: strong ? '#2E3B55' : '#6E5252',
          fontWeight: strong ? 800 : 700,
          fontSize: strong ? '0.95rem' : '0.88rem',
          letterSpacing: strong ? 0.2 : 0,
          wordBreak: 'break-all',
          mt: 0.15
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function BankTransferDetails({ bank, note }) {
  const { t } = useTranslation('checkout');

  if (!bank?.iban) {
    return (
      <Typography variant="body2" sx={{ color: '#946D6D', fontWeight: 700 }}>
        {t('bankMissing')}
      </Typography>
    );
  }

  const holder = bank.holder || bank.name;
  const title = bank.name && bank.name !== holder ? bank.name : '';

  return (
    <>
      <Row label={t('bankHolder')} value={holder} />
      <Row label={t('bankCompany')} value={title} />
      <Row label={t('bankIban')} value={bank.iban} strong />
      {note ? (
        <Typography variant="caption" sx={{ color: '#946D6D', fontWeight: 700, display: 'block', mt: 1 }}>
          {note}
        </Typography>
      ) : null}
    </>
  );
}
