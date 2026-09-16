import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
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
import { PanelCard } from './PanelShell';
import { PAYMENT_STATUS, SELLER_STATUS, T, money, when } from '../utils/panel';

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

export default function AdminCommission({ data, query = '', onOpenSeller }) {
  const q = String(query || '').trim().toLowerCase();
  const sellers = (data?.sellers || []).filter((row) => !q || `${row.shop} ${row.city}`.toLowerCase().includes(q));
  const orders = (data?.orders || []).filter((row) => !q || `${row.shops?.join(' ')} ${row.paymentStatus}`.toLowerCase().includes(q));
  const daily = data?.daily || [];
  const hasChart = daily.some((row) => row.commission || row.orders);

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.4, mb: 2.2 }}>
        {[
          ['Hesaba düşen', money(data?.collected)],
          ['Bekleyen pay', money(data?.pending)],
          ['Satış hacmi', money(data?.gross)],
          ['Satıcılarda kalan', money(data?.sellerNet)]
        ].map(([label, value]) => (
          <PanelCard key={label} sx={{ py: 1.8 }}>
            <Typography sx={{ color: T.muted, fontWeight: 800, fontSize: 12 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 900, color: T.navy, fontSize: '1.35rem', mt: 0.3 }}>{value}</Typography>
          </PanelCard>
        ))}
      </Box>
      <Typography sx={{ color: T.muted, fontWeight: 700, mb: 1.8 }}>
        Tek pay ürün satışından alınır (kart ücreti dahil). Varsayılan %10, 90 günde 50.000 ₺ ciroda %8. Site ve hoş geldin indirimini platform karşılar; satıcı kodu o mağazanın payını düşürür. Kargo paya dahil değildir.
      </Typography>
      {hasChart ? (
        <PanelCard sx={{ mb: 1.8 }}>
          <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Son 30 gün platform payı</Typography>
          <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.6 }}>Tahsil edilmese de oluşan platform payı.</Typography>
          <Box sx={{ height: 280 }}>
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

      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Mağaza kırılımı</Typography>
      <PanelCard sx={{ p: 0, overflow: 'auto', mb: 1.8 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Mağaza', 'Oran', 'Sipariş', 'Satış', 'Platform payı', 'Satıcıya kalan', 'Tahsil edilen pay', 'Durum'].map((h) => (
                <TableCell key={h} sx={headCell}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sellers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ ...bodyCell, color: T.muted }}>Henüz komisyon oluşmadı.</TableCell>
              </TableRow>
            ) : sellers.map((row) => (
              <TableRow
                key={row.sellerId}
                hover
                onClick={() => onOpenSeller?.(row.sellerId)}
                sx={{ cursor: onOpenSeller ? 'pointer' : 'default' }}
              >
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.shop}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>%{row.commissionPercent != null ? row.commissionPercent : 10}</TableCell>
                <TableCell sx={bodyCell}>{row.orders}</TableCell>
                <TableCell sx={bodyCell}>{money(row.gross)}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800, color: T.rose }}>{money(row.fee)}</TableCell>
                <TableCell sx={bodyCell}>{money(row.net)}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.collectedFee)}</TableCell>
                <TableCell sx={bodyCell}>{SELLER_STATUS[row.status] || row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelCard>

      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Son satışlar</Typography>
      <PanelCard sx={{ p: 0, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Tarih', 'Mağaza', 'Satış', 'Platform payı', 'Satıcıya kalan', 'Ödeme'].map((h) => (
                <TableCell key={h} sx={headCell}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ ...bodyCell, color: T.muted }}>Satış geldikçe pay burada görünür.</TableCell>
              </TableRow>
            ) : orders.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={bodyCell}>{when(row.createdAt)}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{(row.shops || []).join(', ') || '—'}</TableCell>
                <TableCell sx={bodyCell}>{money(row.gross)}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800, color: T.rose }}>{money(row.fee)}</TableCell>
                <TableCell sx={bodyCell}>{money(row.net)}</TableCell>
                <TableCell sx={bodyCell}>
                  <Chip size="small" label={PAYMENT_STATUS[row.paymentStatus] || row.paymentStatus} sx={{ fontWeight: 800 }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PanelCard>
    </Box>
  );
}
