import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { adminService } from '../api/adminService';
import { PanelCard, primaryButton } from './PanelShell';
import { PAYMENT_METHOD, PAYMENT_STATUS, SELLER_STATUS, T, money, when } from '../utils/panel';

const headCell = {
  fontWeight: 800,
  color: T.muted,
  fontSize: '0.78rem',
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  borderBottom: `1px solid ${T.line}`,
  bgcolor: T.surfaceSoft
};
const bodyCell = { borderBottom: `1px solid ${T.line}`, color: T.navy };
const tooltipStyle = { borderRadius: 12, border: `1px solid ${T.line}`, fontWeight: 700, fontSize: 12 };
const dayLabel = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

async function copyText(value) {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(String(value).replace(/\s+/g, ''));
    return true;
  } catch {
    return false;
  }
}

export default function AdminCommission({ data, query = '', onChanged, onMessage, onError }) {
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState('');
  const q = String(query || '').trim().toLowerCase();
  const sellers = (data?.sellers || [])
    .map((row) => ({
      ...row,
      toPay: row.toPay != null ? row.toPay : row.isPlatform ? 0 : row.net,
      paidOut: row.paidOut || 0,
      waitingNet: row.waitingNet || 0,
      holder: row.holder || '',
      iban: row.iban || ''
    }))
    .filter((row) =>
      !q || `${row.shop} ${row.holder} ${row.iban} ${row.city} ${row.phone}`.toLowerCase().includes(q)
    );
  const orders = (data?.orders || []).filter((row) =>
    !q || `${row.shops?.join(' ')} ${(row.lines || []).map((line) => line.shop).join(' ')} ${row.customer} ${row.paymentStatus}`.toLowerCase().includes(q)
  );
  const daily = data?.daily || [];
  const hasChart = daily.some((row) => row.commission || row.orders);
  const openOrders = useMemo(
    () => (data?.orders || []).filter((row) => (row.lines || []).some((line) => line.sellerId === open?.sellerId)),
    [data?.orders, open?.sellerId]
  );

  const markOrder = async (orderId, sellerId, payoutStatus = 'paid') => {
    setBusy(`${orderId}-${sellerId}`);
    try {
      const result = await adminService.markOrderPayout(orderId, { sellerId, payoutStatus });
      onMessage?.(result.mesaj || 'Güncellendi.');
      await onChanged?.();
    } catch (err) {
      onError?.(err.response?.data?.mesaj || 'Ödeme işaretlenemedi.');
    } finally {
      setBusy('');
    }
  };

  const markSeller = async (sellerId) => {
    setBusy(`seller-${sellerId}`);
    try {
      const result = await adminService.markSellerPayouts(sellerId);
      onMessage?.(result.mesaj || 'Satıcı ödemeleri işaretlendi.');
      await onChanged?.();
      setOpen(null);
    } catch (err) {
      onError?.(err.response?.data?.mesaj || 'Ödemeler işaretlenemedi.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 1.4, mb: 2.2 }}>
        {[
          ['Alıcıdan gelen', money(data?.buyerCollected ?? data?.gross), 'Ödenmiş sipariş tutarı'],
          ['Komisyon (sende)', money(data?.collectedFee ?? data?.collected), 'Site payı'],
          ['Ödemen gereken', money(data?.toPay ?? sellers.reduce((sum, row) => sum + Number(row.toPay || 0), 0)), 'Satıcı IBAN’larına'],
          ['Ödediğin', money(data?.paidOut ?? sellers.reduce((sum, row) => sum + Number(row.paidOut || 0), 0)), 'İşaretlenen paylar'],
          ['Tahsil bekleyen', money(data?.waitingNet ?? sellers.reduce((sum, row) => sum + Number(row.waitingNet || 0), 0)), 'Alıcı henüz ödemedi']
        ].map(([label, value, hint]) => (
          <PanelCard key={label} sx={{ py: 1.8 }}>
            <Typography sx={{ color: T.muted, fontWeight: 800, fontSize: 12 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 900, color: label === 'Ödemen gereken' ? T.rose : T.navy, fontSize: '1.25rem', mt: 0.3 }}>{value}</Typography>
            {hint ? <Typography sx={{ color: T.muted, fontSize: 11, mt: 0.4 }}>{hint}</Typography> : null}
          </PanelCard>
        ))}
      </Box>
      <Typography sx={{ color: T.muted, fontWeight: 700, mb: 1.8 }}>
        Alıcı tüm tutarı senin IBAN’ına yatırır. Kargo ücreti varsa komisyon ürün+kargo üzerindendir (300+100=%10 → 40 ₺). Ücretsiz kargoda pay yalnızca üründendir. “Ödemen gereken” satıcıya geçireceğin net paydır.
      </Typography>
      {hasChart ? (
        <PanelCard sx={{ mb: 1.8 }}>
          <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Son 30 gün platform payı</Typography>
          <Box sx={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={daily} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: T.muted, fontSize: 11 }} interval={4} />
                <YAxis yAxisId="left" tick={{ fill: T.muted, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip
                  labelFormatter={dayLabel}
                  formatter={(value, name) => [name === 'Komisyon' ? money(value) : value, name]}
                  contentStyle={tooltipStyle}
                />
                <Area yAxisId="left" type="monotone" dataKey="commission" name="Komisyon" stroke={T.rose} fill="rgba(148,109,109,0.18)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Sipariş" stroke={T.navy} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </PanelCard>
      ) : null}

      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Satıcı bazında ödeme</Typography>
      <PanelCard sx={{ p: 0, overflow: 'auto', mb: 1.8 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Satıcı', 'IBAN', 'Sipariş', 'Satış', 'Komisyon', 'Satıcı payı', 'Ödemen gereken', 'Ödendi', 'Bekleyen'].map((h) => (
                <TableCell key={h} sx={headCell}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sellers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ ...bodyCell, color: T.muted }}>Henüz satış yok.</TableCell>
              </TableRow>
            ) : sellers.map((row) => (
              <TableRow key={row.sellerId} hover onClick={() => setOpen(row)} sx={{ cursor: 'pointer' }}>
                <TableCell sx={bodyCell}>
                  <Typography sx={{ fontWeight: 800 }}>{row.shop}</Typography>
                  <Typography sx={{ fontSize: 12, color: T.muted }}>{row.holder || '—'} · %{row.commissionPercent ?? 10}</Typography>
                  {row.isPlatform ? <Chip size="small" label="Kendi atölyen" sx={{ mt: 0.5, fontWeight: 800 }} /> : null}
                </TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800, fontSize: 12, letterSpacing: 0.2, maxWidth: 180 }}>{row.iban || '—'}</TableCell>
                <TableCell sx={bodyCell}>{row.orders}</TableCell>
                <TableCell sx={bodyCell}>{money(row.gross)}</TableCell>
                <TableCell sx={{ ...bodyCell, color: T.rose, fontWeight: 800 }}>{money(row.fee)}</TableCell>
                <TableCell sx={bodyCell}>{money(row.net)}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 900, color: row.toPay ? T.rose : T.navy }}>{money(row.toPay)}</TableCell>
                <TableCell sx={bodyCell}>{money(row.paidOut)}</TableCell>
                <TableCell sx={bodyCell}>{money(row.waitingNet)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelCard>

      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Sipariş kırılımı</Typography>
      <PanelCard sx={{ p: 0, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Tarih', 'Sipariş', 'Satış', 'Komisyon', 'Satıcıya', 'Ödeme', 'Satıcı payları'].map((h) => (
                <TableCell key={h} sx={headCell}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ ...bodyCell, color: T.muted }}>Satış geldikçe pay burada görünür.</TableCell>
              </TableRow>
            ) : orders.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={bodyCell}>{when(row.createdAt)}</TableCell>
                <TableCell sx={bodyCell}>
                  <Typography sx={{ fontWeight: 800, fontSize: 12 }}>{row.customer || '—'}</Typography>
                  <Typography sx={{ color: T.muted, fontSize: 11 }}>{String(row.id).slice(-8)}</Typography>
                </TableCell>
                <TableCell sx={bodyCell}>{money(row.gross)}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800, color: T.rose }}>{money(row.fee)}</TableCell>
                <TableCell sx={bodyCell}>{money(row.net)}</TableCell>
                <TableCell sx={bodyCell}>
                  <Chip size="small" label={PAYMENT_STATUS[row.paymentStatus] || row.paymentStatus} sx={{ fontWeight: 800 }} />
                  <Typography sx={{ color: T.muted, fontSize: 11, mt: 0.4 }}>{PAYMENT_METHOD[row.paymentMethod] || row.paymentMethod}</Typography>
                </TableCell>
                <TableCell sx={bodyCell}>
                  {(row.lines || []).map((line) => (
                    <Box key={`${row.id}-${line.sellerId}`} sx={{ mb: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 12 }}>{line.shop}</Typography>
                      <Typography sx={{ fontSize: 12 }}>{money(line.net)} net · {money(line.fee)} komisyon</Typography>
                      {line.payable ? (
                        <Button
                          size="small"
                          disabled={busy === `${row.id}-${line.sellerId}`}
                          onClick={() => markOrder(row.id, line.sellerId, 'paid')}
                          sx={{ fontWeight: 800, color: T.rose, px: 0 }}
                        >
                          Ödendi işaretle
                        </Button>
                      ) : (
                        <Typography sx={{ fontSize: 11, color: T.muted }}>
                          {line.isPlatform ? 'Site atölyesi' : line.payoutStatus === 'paid' ? 'Satıcıya ödendi' : 'Tahsil bekleniyor'}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelCard>

      <Dialog open={Boolean(open)} onClose={() => setOpen(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>{open?.shop}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.muted, fontWeight: 700, mb: 1.2 }}>{open?.holder} · {SELLER_STATUS[open?.status] || open?.status}</Typography>
          <Typography sx={{ fontWeight: 800, color: T.navy, letterSpacing: 0.3, mb: 0.6 }}>{open?.iban || 'IBAN yok'}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, my: 1.6 }}>
            {[
              ['Satış', money(open?.gross)],
              ['Komisyon', money(open?.fee)],
              ['Ödemen gereken', money(open?.toPay)],
              ['Ödediğin', money(open?.paidOut)]
            ].map(([label, value]) => (
              <Box key={label} sx={{ p: 1.2, borderRadius: '14px', bgcolor: T.surfaceSoft }}>
                <Typography sx={{ color: T.muted, fontSize: 12, fontWeight: 800 }}>{label}</Typography>
                <Typography sx={{ fontWeight: 900, color: T.navy }}>{value}</Typography>
              </Box>
            ))}
          </Box>
          {openOrders.map((order) => {
            const line = (order.lines || []).find((item) => item.sellerId === open?.sellerId);
            if (!line) return null;
            return (
              <Box key={order.id} sx={{ py: 1, borderBottom: `1px solid ${T.line}` }}>
                <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{when(order.createdAt)} · {money(line.net)}</Typography>
                <Typography sx={{ color: T.muted, fontSize: 12 }}>
                  {PAYMENT_STATUS[order.paymentStatus]} · {line.payable ? 'Ödeme bekliyor' : line.payoutStatus === 'paid' ? 'Ödendi' : 'Tahsil yok'}
                </Typography>
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2, gap: 1, flexWrap: 'wrap' }}>
          <Button startIcon={<ContentCopyRounded />} disabled={!open?.iban} onClick={async () => onMessage?.((await copyText(open?.iban)) ? 'IBAN kopyalandı.' : 'Kopyalanamadı.')} sx={{ fontWeight: 800, color: T.navy }}>
            IBAN kopyala
          </Button>
          {open?.toPay > 0 && !open?.isPlatform ? (
            <Button
              disabled={busy === `seller-${open.sellerId}`}
              onClick={() => markSeller(open.sellerId)}
              sx={primaryButton}
            >
              Tümünü ödendi işaretle
            </Button>
          ) : null}
          <Button onClick={() => setOpen(null)} sx={{ fontWeight: 800, color: T.rose }}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
