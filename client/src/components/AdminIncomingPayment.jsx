import { useState } from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { PanelCard, SectionTitle, primaryButton } from './PanelShell';
import { adminService } from '../api/adminService';
import { PAYMENT_STATUS, T, money } from '../utils/panel';

const tone = {
  completed: { bg: '#E8F5E9', color: '#1B5E20' },
  short: { bg: '#FFF3E0', color: '#E65100' },
  over: { bg: '#E3F2FD', color: '#0D47A1' }
};

export default function AdminIncomingPayment() {
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const data = await adminService.matchPayment({ code, amount });
      setResult(data);
      setCode('');
      setAmount('');
    } catch (err) {
      setError(err.response?.data?.mesaj || 'Ödeme eşleştirilemedi.');
    } finally {
      setBusy(false);
    }
  };

  const order = result?.order;
  const colors = tone[result?.match] || tone.completed;

  return (
    <Box>
      <SectionTitle
        overline="HAVALE"
        title="Gelen ödeme"
        subtitle="Bankadaki açıklamadaki NB kodunu ve gelen tutarı yazın. Sipariş kendiliğinden bulunur."
      />
      <PanelCard sx={{ maxWidth: 560 }}>
        <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 1.6 }}>
          <TextField
            label="Ödeme kodu"
            placeholder="NB-4827"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            required
          />
          <TextField
            label="Gelen tutar (₺)"
            placeholder="1250.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            inputProps={{ inputMode: 'decimal' }}
          />
          <Button type="submit" variant="contained" disabled={busy} sx={primaryButton}>
            {busy ? 'Aranıyor…' : 'Siparişi bul'}
          </Button>
        </Box>
        {error ? <Alert severity="error" sx={{ mt: 2, borderRadius: '14px' }}>{error}</Alert> : null}
        {order ? (
          <Box sx={{ mt: 2, p: 2, borderRadius: '16px', bgcolor: colors.bg }}>
            <Typography sx={{ fontWeight: 900, color: colors.color, mb: 0.6 }}>
              {PAYMENT_STATUS[order.paymentStatus] || result.mesaj}
            </Typography>
            <Typography sx={{ fontWeight: 800, color: T.navy }}>{order.paymentCode} · {order.customer || 'Müşteri'}</Typography>
            <Typography sx={{ color: T.muted, fontWeight: 700, mt: 0.4 }}>
              Beklenen {money(order.totalPrice)} · Gelen {money(order.paidAmount)}
              {Number(result.difference) ? ` · Fark ${money(result.difference)}` : ''}
            </Typography>
            <Typography sx={{ color: T.muted, fontWeight: 600, mt: 0.4 }}>{order.email}</Typography>
          </Box>
        ) : null}
      </PanelCard>
    </Box>
  );
}
