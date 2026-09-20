import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import { useTranslation } from 'react-i18next';
import { formatTRY } from '../utils/price';
import { hasBankAccount } from '../utils/bank';

function Row({ label, value, strong, action }) {
  if (!value) return null;
  return (
    <Box sx={{ mt: 0.85 }}>
      <Typography sx={{ color: '#946D6D', fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.15 }}>
        <Typography
          sx={{
            color: strong ? '#2E3B55' : '#6E5252',
            fontWeight: strong ? 800 : 700,
            fontSize: strong ? '0.95rem' : '0.88rem',
            letterSpacing: strong ? 0.2 : 0,
            wordBreak: 'break-all',
            flex: 1,
            minWidth: 0
          }}
        >
          {value}
        </Typography>
        {action}
      </Box>
    </Box>
  );
}

export default function BankTransferDetails({ bank, note, amount }) {
  const { t } = useTranslation('checkout');
  const [copied, setCopied] = useState('');

  if (!hasBankAccount(bank)) {
    return (
      <Typography variant="body2" sx={{ color: '#946D6D', fontWeight: 700 }}>
        {t('bankMissing')}
      </Typography>
    );
  }

  const holder = bank.holder || bank.name;
  const title = bank.name && bank.name !== holder ? bank.name : '';
  const amountText = amount != null && amount !== '' ? `${formatTRY(amount)} ₺` : '';

  const copy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('');
    }
  };

  const copyBtn = (key, value) => (
    <Button
      size="small"
      onClick={() => copy(key, value)}
      startIcon={copied === key ? <CheckRounded fontSize="small" /> : <ContentCopyRounded fontSize="small" />}
      sx={{
        flexShrink: 0,
        minWidth: 0,
        px: 1,
        py: 0.2,
        fontWeight: 800,
        fontSize: '0.7rem',
        color: copied === key ? '#2E7D32' : '#946D6D',
        textTransform: 'none'
      }}
    >
      {copied === key ? t('copied') : t('copy')}
    </Button>
  );

  return (
    <>
      {amountText ? <Row label={t('bankAmount')} value={amountText} strong /> : null}
      <Row label={t('bankHolder')} value={holder} action={holder ? copyBtn('holder', holder) : null} />
      <Row label={t('bankCompany')} value={title} />
      <Row label={t('bankIban')} value={bank.iban} strong action={copyBtn('iban', bank.iban)} />
      {note ? (
        <Typography variant="caption" sx={{ color: '#946D6D', fontWeight: 700, display: 'block', mt: 1 }}>
          {note}
        </Typography>
      ) : null}
    </>
  );
}
