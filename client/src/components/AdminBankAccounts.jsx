import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import { adminService } from '../api/adminService';
import { formatIban, isValidIbanTr } from '../utils/sellerValidation';
import { PanelCard, SectionTitle, StatusChip, fieldSx, primaryButton } from './PanelShell';
import { SELLER_STATUS, T, when } from '../utils/panel';

const HESAP_TIPI = { bireysel: 'Bireysel', kurumsal: 'Kurumsal' };

function apiError(err, fallback) {
  const data = err?.response?.data;
  if (typeof data?.mesaj === 'string' && data.mesaj.trim()) return data.mesaj;
  if (err?.response?.status === 404) return 'Hesap bilgisi alınamadı. Sayfayı yenileyin.';
  return fallback;
}

function asSellerAccount(seller = {}) {
  const user = seller.user || {};
  return {
    id: seller._id || seller.id,
    magazaAdi: seller.magazaAdi || '',
    slug: seller.slug || '',
    hesapTipi: seller.hesapTipi || 'bireysel',
    iban: formatIban(seller.iban || ''),
    ibanHolder: seller.ibanHolder || user.adSoyad || seller.adSoyad || '',
    tcKimlik: seller.tcKimlik || '',
    vergiNo: seller.vergiNo || '',
    telefon: seller.telefon || user.telefon || '',
    sehir: seller.sehir || '',
    ilce: seller.ilce || '',
    adres: seller.adres || '',
    email: user.email || seller.email || '',
    adSoyad: user.adSoyad || seller.adSoyad || seller.ibanHolder || '',
    durum: seller.durum,
    isPlatform: Boolean(seller.isPlatform || user.rol === 'superadmin'),
    createdAt: seller.createdAt
  };
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ py: 1, borderBottom: `1px solid ${T.line}` }}>
      <Typography sx={{ color: T.muted, fontWeight: 800, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ color: T.navy, fontWeight: 800, mt: 0.25, wordBreak: 'break-word' }}>{value}</Typography>
    </Box>
  );
}

async function copyText(value) {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function AdminBankAccounts({
  query = '',
  sellers: sellersProp = [],
  bank: bankProp = null,
  onMessage,
  onError,
  onBankSaved
}) {
  const [form, setForm] = useState({
    name: bankProp?.name || '',
    holder: bankProp?.holder || '',
    iban: formatIban(bankProp?.iban || '')
  });
  const [platform, setPlatform] = useState(bankProp || { name: '', holder: '', iban: '' });
  const [remoteSellers, setRemoteSellers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!bankProp) return;
    setPlatform(bankProp);
    setForm({
      name: bankProp.name || '',
      holder: bankProp.holder || '',
      iban: formatIban(bankProp.iban || '')
    });
  }, [bankProp?.name, bankProp?.holder, bankProp?.iban]);

  useEffect(() => {
    if (sellersProp.length) return undefined;
    let cancelled = false;
    adminService.sellers()
      .then((data) => {
        if (!cancelled) setRemoteSellers(data.sellers || []);
      })
      .catch((err) => onError?.(apiError(err, 'Satıcı hesapları yüklenemedi.')));
    return () => { cancelled = true; };
  }, [sellersProp.length]);

  const sellers = useMemo(
    () => (sellersProp.length ? sellersProp : remoteSellers).map(asSellerAccount),
    [sellersProp, remoteSellers]
  );

  const q = String(query || '').trim().toLowerCase();
  const filtered = useMemo(
    () =>
      sellers.filter((seller) => {
        if (!q) return true;
        const hay = [
          seller.magazaAdi,
          seller.ibanHolder,
          seller.iban,
          seller.email,
          seller.adSoyad,
          seller.telefon,
          seller.sehir,
          seller.vergiNo,
          seller.tcKimlik
        ].join(' ').toLowerCase();
        return hay.includes(q);
      }),
    [sellers, q]
  );

  const savePlatform = async (event) => {
    event.preventDefault();
    if (!isValidIbanTr(form.iban)) {
      onError?.('TR ile başlayan 26 karakterlik geçerli bir IBAN yazın.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        holder: form.holder.trim(),
        iban: form.iban
      };
      let data;
      try {
        data = await adminService.savePlatformBank(payload);
      } catch (err) {
        if (err?.response?.status !== 404) throw err;
        data = await adminService.saveFeaturedSettings(payload);
      }
      const bank = data.bank || payload;
      setPlatform(bank);
      setForm({
        name: bank.name || form.name,
        holder: bank.holder || form.holder,
        iban: formatIban(bank.iban || form.iban)
      });
      onBankSaved?.(bank);
      onMessage?.(data.mesaj || 'Site IBAN bilgisi kaydedildi.');
    } catch (err) {
      onError?.(apiError(err, 'IBAN kaydedilemedi.'));
    } finally {
      setSaving(false);
    }
  };

  const copied = async (label, value) => {
    const ok = await copyText(value);
    onMessage?.(ok ? `${label} kopyalandı.` : 'Kopyalanamadı.');
  };

  return (
    <Box>
      <SectionTitle
        overline="ÖDEME HESAPLARI"
        title="IBAN ve havale bilgileri"
        subtitle="Satıcı kayıt olur olmaz ad soyad ve IBAN burada görünür. Site hesabını buradan değiştirin."
      />

      <PanelCard sx={{ mb: 2.2 }}>
        <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Site IBAN’ı</Typography>
        <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.8 }}>
          Kart, havale ve WhatsApp siparişlerinde alıcıya bu hesap gösterilir.
        </Typography>
        {platform.iban ? (
          <Box sx={{ mb: 2, p: 1.6, borderRadius: '16px', bgcolor: T.surfaceSoft, border: `1px dashed ${T.line}` }}>
            <Typography sx={{ color: T.muted, fontWeight: 800, fontSize: 12 }}>{platform.holder || platform.name}</Typography>
            <Typography sx={{ fontWeight: 900, color: T.navy, letterSpacing: 0.4, mt: 0.4 }}>{platform.iban}</Typography>
          </Box>
        ) : (
          <Typography sx={{ color: T.rose, fontWeight: 800, mb: 2 }}>Henüz kayıtlı site IBAN’ı yok.</Typography>
        )}
        <Box component="form" onSubmit={savePlatform} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.4 }}>
          <TextField
            label="Hesap sahibi"
            value={form.holder}
            onChange={(e) => setForm((prev) => ({ ...prev, holder: e.target.value }))}
            sx={fieldSx}
          />
          <TextField
            label="Unvan / mağaza"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            sx={fieldSx}
          />
          <TextField
            label="IBAN"
            value={form.iban}
            onChange={(e) => setForm((prev) => ({ ...prev, iban: formatIban(e.target.value) }))}
            sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
            placeholder="TR00 ACCT-000003 0000 00"
          />
          <Button type="submit" disabled={saving} sx={{ ...primaryButton, justifySelf: 'start' }}>
            {saving ? 'Kaydediliyor...' : 'Site IBAN’ını kaydet'}
          </Button>
        </Box>
      </PanelCard>

      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1.2 }}>
        Satıcı hesapları · {filtered.length}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
        {filtered.map((seller) => (
          <PanelCard key={seller.id}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.2, alignItems: 'flex-start' }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, color: T.navy }}>{seller.adSoyad || seller.ibanHolder || 'Ad soyad yok'}</Typography>
                <Typography sx={{ color: T.muted, fontSize: 13 }}>{seller.magazaAdi}</Typography>
                <Typography sx={{ color: T.muted, fontSize: 13 }}>{seller.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {seller.isPlatform ? <Chip size="small" label="Site hesabı" sx={{ fontWeight: 800, bgcolor: 'rgba(162,144,183,0.22)' }} /> : null}
                <StatusChip map={SELLER_STATUS} value={seller.durum} />
              </Box>
            </Box>
            <Typography sx={{ color: T.muted, fontSize: 13, mt: 1.1 }}>
              {HESAP_TIPI[seller.hesapTipi] || seller.hesapTipi} · {seller.ibanHolder || seller.adSoyad || 'Hesap sahibi yok'}
            </Typography>
            <Typography sx={{ fontWeight: 900, color: T.navy, letterSpacing: 0.3, mt: 0.5, wordBreak: 'break-all' }}>
              {seller.iban || 'IBAN yok'}
            </Typography>
            <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.8 }}>
              {seller.sehir}/{seller.ilce} · {seller.telefon}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1.6, flexWrap: 'wrap' }}>
              <Button
                onClick={() => copied('IBAN', String(seller.iban || '').replace(/\s+/g, ''))}
                disabled={!seller.iban}
                startIcon={<ContentCopyRounded />}
                sx={{ fontWeight: 800, color: T.navy, border: `1px solid ${T.line}`, borderRadius: '12px' }}
              >
                IBAN kopyala
              </Button>
              <Button onClick={() => setOpen(seller)} sx={{ fontWeight: 800, color: T.rose }}>
                Tüm detay
              </Button>
            </Box>
          </PanelCard>
        ))}
      </Box>
      {filtered.length === 0 ? (
        <PanelCard sx={{ mt: 1.8 }}>
          <Typography sx={{ color: T.muted, fontWeight: 700 }}>Satıcı hesabı bulunamadı.</Typography>
        </PanelCard>
      ) : null}

      <Dialog open={Boolean(open)} onClose={() => setOpen(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>{open?.adSoyad || open?.magazaAdi}</DialogTitle>
        <DialogContent>
          <DetailRow label="Ad soyad" value={open?.adSoyad} />
          <DetailRow label="Hesap sahibi" value={open?.ibanHolder} />
          <DetailRow label="IBAN" value={open?.iban} />
          <DetailRow label="Mağaza" value={open?.magazaAdi} />
          <DetailRow label="Hesap tipi" value={HESAP_TIPI[open?.hesapTipi] || open?.hesapTipi} />
          <DetailRow label="E-posta" value={open?.email} />
          <DetailRow label="Telefon" value={open?.telefon} />
          <DetailRow label="TCKN" value={open?.tcKimlik} />
          <DetailRow label="Vergi no" value={open?.vergiNo} />
          <DetailRow label="Adres" value={open ? `${open.adres || ''} ${open.ilce || ''} / ${open.sehir || ''}`.trim() : ''} />
          <DetailRow label="Kayıt" value={open?.createdAt ? when(open.createdAt) : ''} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={() => copied('IBAN', String(open?.iban || '').replace(/\s+/g, ''))} sx={{ fontWeight: 800, color: T.navy }}>
            IBAN kopyala
          </Button>
          <Button onClick={() => setOpen(null)} sx={{ fontWeight: 800, color: T.rose }}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
