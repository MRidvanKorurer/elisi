import { useEffect, useState } from 'react';
import { Alert, Box, Chip, Typography } from '@mui/material';
import { PanelCard, SectionTitle } from './PanelShell';
import { adminService } from '../api/adminService';
import { T } from '../utils/panel';

export default function AdminWhatsApp() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await adminService.whatsapp();
        if (!cancelled) {
          setStatus(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.mesaj || 'WhatsApp durumu alınamadı.');
      }
    };
    load();
    const timer = window.setInterval(load, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const qrSrc = status?.qr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(status.qr)}`
    : '';

  return (
    <Box>
      <SectionTitle
        overline="WHATSAPP"
        title="Canlı bildirim oturumu"
        subtitle="QR’ı 0554 379 32 35 telefonundan Bağlı cihazlar ile tara. Bağlanınca sipariş mesajları o numaradan gider."
      />
      {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>{error}</Alert> : null}
      <PanelCard sx={{ maxWidth: 520 }}>
        <Chip
          label={status?.ready ? 'Bağlı' : status?.qr ? 'QR bekliyor' : 'Bağlanıyor'}
          sx={{ fontWeight: 800, mb: 1.5, bgcolor: status?.ready ? '#E8F5E9' : '#FFF8E1' }}
        />
        <Typography sx={{ color: T.muted, fontWeight: 600, mb: 0.5 }}>
          Gönderen: {status?.from || '905543793235'}
        </Typography>
        {status?.connected ? (
          <Typography sx={{ color: T.muted, fontWeight: 600, mb: 1.5 }}>
            Bağlı hesap: {status.connected}
          </Typography>
        ) : null}
        {qrSrc ? (
          <Box sx={{ mt: 1 }}>
            <Box component="img" src={qrSrc} alt="WhatsApp QR" sx={{ width: 280, height: 280, display: 'block' }} />
            <Typography sx={{ color: T.muted, mt: 1, fontWeight: 600 }}>
              WhatsApp → Ayarlar → Bağlı cihazlar → Cihaz bağla
            </Typography>
          </Box>
        ) : status?.ready ? (
          <Typography sx={{ color: T.navy, fontWeight: 800 }}>Oturum açık. Canlı sipariş denemesi yapabilirsin.</Typography>
        ) : (
          <Typography sx={{ color: T.muted, fontWeight: 600 }}>Sunucu WhatsApp’ı açıyor…</Typography>
        )}
      </PanelCard>
    </Box>
  );
}
