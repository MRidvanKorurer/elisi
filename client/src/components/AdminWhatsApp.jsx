import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Typography } from '@mui/material';
import { PanelCard, SectionTitle, primaryButton } from './PanelShell';
import { adminService } from '../api/adminService';
import { T } from '../utils/panel';

export default function AdminWhatsApp() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await adminService.whatsapp();
        if (!cancelled) {
          setStatus(data);
          setError(data.error || '');
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.mesaj || 'WhatsApp durumu alınamadı.');
      }
    };
    load();
    const timer = window.setInterval(load, 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const restart = async () => {
    setBusy(true);
    try {
      const data = await adminService.restartWhatsApp();
      setStatus(data);
      setError(data.error || '');
    } catch (err) {
      setError(err.response?.data?.mesaj || 'Test gönderilemedi.');
    } finally {
      setBusy(false);
    }
  };

  const cloud = status?.provider === 'cloud' || status?.configured;

  return (
    <Box>
      <SectionTitle
        overline="WHATSAPP"
        title="Meta Cloud API"
        subtitle="QR ve Chrome canlıda kullanılmıyor. Bildirimler Meta’nın resmi WhatsApp API’si ile gider; mağaza hızı etkilenmez."
      />
      {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>{error}</Alert> : null}
      {status?.note ? <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>{status.note}</Alert> : null}
      <PanelCard sx={{ maxWidth: 640 }}>
        <Chip
          label={cloud ? 'Meta Cloud bağlı' : 'Anahtar yok'}
          sx={{ fontWeight: 800, mb: 1.5, bgcolor: cloud ? '#E8F5E9' : '#FFF8E1' }}
        />
        <Typography sx={{ color: T.muted, fontWeight: 600, mb: 1 }}>
          Gönderen numara: {status?.from || '905543793235'}
        </Typography>
        <Typography sx={{ color: T.muted, fontWeight: 600, mb: 1 }}>
          Sipariş şablonu: {status?.template || 'siparis_geldi'} (tr)
        </Typography>
        <Typography sx={{ color: T.navy, fontWeight: 700, mb: 1 }}>Render’a eklenecekler</Typography>
        <Typography sx={{ color: T.muted, fontWeight: 600, mb: 0.5, display: 'block' }}>
          WHATSAPP_TOKEN — Meta kalıcı erişim jetonu
        </Typography>
        <Typography sx={{ color: T.muted, fontWeight: 600, mb: 0.5, display: 'block' }}>
          WHATSAPP_PHONE_NUMBER_ID — Cloud API telefon kimliği
        </Typography>
        <Typography sx={{ color: T.muted, fontWeight: 600, mb: 1.5, display: 'block' }}>
          WHATSAPP_TEST_PHONE — testin gideceği cep (iş numarasının kendisi olmasın)
        </Typography>
        <Typography sx={{ color: T.muted, fontWeight: 600, mb: 2 }}>
          Meta Business’ta UTILITY şablon: siparis_geldi, dil tr, gövde değişkenleri:
          {' '}
          {'{{1}}'} sipariş no, {'{{2}}'} müşteri, {'{{3}}'} telefon, {'{{4}}'} sepet, {'{{5}}'} toplam.
          Onaylanmadan ilk mesaj gitmez. Bu numarayı Cloud API’ye alınca telefondaki normal WhatsApp kapanır.
        </Typography>
        <Button variant="contained" onClick={restart} disabled={busy || !cloud} sx={{ ...primaryButton, mt: 1 }}>
          {busy ? 'Gönderiliyor…' : 'Test mesajı gönder'}
        </Button>
      </PanelCard>
    </Box>
  );
}
