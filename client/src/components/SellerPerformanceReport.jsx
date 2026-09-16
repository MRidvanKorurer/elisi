import { useState } from 'react';
import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { PanelCard, SectionTitle } from './PanelShell';
import { PAYMENT_METHOD, PAYMENT_STATUS, T, money } from '../utils/panel';

const CHART_COLORS = ['#2E3B55', '#946D6D', '#A290B7', '#B0CDE6', '#C08A4A'];

const REPORTS = [
  { id: 'performance', label: 'Satış', title: 'Satış', subtitle: 'Ciro ve en çok satan ürünler.' },
  { id: 'payments', label: 'Tahsilat', title: 'Tahsilat', subtitle: 'Ödenen ve bekleyen ödemeler.' },
  { id: 'stock', label: 'Stok', title: 'Stok', subtitle: 'Kritik stok ve satış hızı.' }
];

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

const tooltipStyle = {
  borderRadius: 12,
  border: `1px solid ${T.line}`,
  fontWeight: 700,
  fontSize: 12
};

const shortLabel = (value, max = 16) => {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const dayLabel = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

function StatCards({ items }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${Math.min(items.length, 4)}, 1fr)` }, gap: 1.4, mb: 2 }}>
      {items.map(([label, value]) => (
        <PanelCard key={label} sx={{ py: 1.6 }}>
          <Typography sx={{ color: T.muted, fontWeight: 800, fontSize: 12 }}>{label}</Typography>
          <Typography sx={{ fontWeight: 900, color: T.navy, fontSize: '1.25rem', mt: 0.3 }}>{value}</Typography>
        </PanelCard>
      ))}
    </Box>
  );
}

function EmptyNote({ text }) {
  return (
    <PanelCard sx={{ textAlign: 'center', py: 5 }}>
      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.5 }}>Henüz veri yok</Typography>
      <Typography sx={{ color: T.muted }}>{text}</Typography>
    </PanelCard>
  );
}

function ChartCard({ title, height = 280, children }) {
  return (
    <PanelCard>
      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1.4 }}>{title}</Typography>
      <Box sx={{ height }}>{children}</Box>
    </PanelCard>
  );
}

function PerformanceView({ performance, timeseries }) {
  const categories = (performance?.categories || []).filter((row) => row.qty > 0 || row.revenue > 0).slice(0, 6);
  const products = (performance?.products || []).filter((row) => row.qty > 0).slice(0, 6);
  const totals = performance?.totals || { revenue: 0, qty: 0, products: 0 };
  const daily = timeseries?.daily || [];
  const hasSales = daily.some((row) => row.orders > 0 || row.revenue > 0);
  const today = daily[daily.length - 1] || { revenue: 0, orders: 0 };

  return (
    <Box>
      <StatCards items={[
        ['Ciro', money(totals.revenue)],
        ['Satılan adet', totals.qty],
        ['Bugün', money(today.revenue)],
        ['Bugün sipariş', today.orders]
      ]} />
      {!categories.length && !hasSales ? (
        <EmptyNote text="Sipariş geldikçe satış özeti burada görünür." />
      ) : (
        <Box sx={{ display: 'grid', gap: 1.8 }}>
          {hasSales ? (
            <ChartCard title="Son 30 gün" height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={daily} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={T.line} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: T.muted, fontSize: 11 }} interval={4} />
                  <YAxis yAxisId="left" tick={{ fill: T.muted, fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                  <Tooltip labelFormatter={dayLabel} formatter={(value, name) => [name === 'Ciro' ? money(value) : value, name]} contentStyle={tooltipStyle} />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Ciro" stroke={T.navy} fill="rgba(46,59,85,0.14)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Sipariş" stroke={T.rose} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : null}
          {categories.length ? (
            <ChartCard title="Kategori cirosu" height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={T.line} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} interval={0} angle={-16} textAnchor="end" height={52} />
                  <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                  <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" name="Ciro" radius={[10, 10, 0, 0]}>
                    {categories.map((row, index) => <Cell key={row.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : null}
          {products.length ? (
            <ChartCard title="En çok kazandıran" height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={products} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid stroke={T.line} horizontal={false} />
                  <XAxis type="number" tick={{ fill: T.muted, fontSize: 11 }} />
                  <YAxis type="category" dataKey="title" width={120} tickFormatter={(value) => shortLabel(value, 14)} tick={{ fill: T.navy, fontSize: 12, fontWeight: 700 }} />
                  <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" name="Ciro" radius={[0, 10, 10, 0]} fill={T.rose} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

function PaymentsView({ data }) {
  const methods = (data?.byMethod || []).map((row) => ({ ...row, label: PAYMENT_METHOD[row.method] || row.method }));
  const statuses = (data?.byStatus || []).map((row) => ({ ...row, label: PAYMENT_STATUS[row.status] || row.status }));
  const totals = data?.totals || {};
  return (
    <Box>
      <StatCards items={[['Tahsil edilen', money(totals.collected)], ['Bekleyen', money(totals.outstanding)], ['Ödenen sipariş', totals.completed || 0]]} />
      {!statuses.some((row) => row.count) ? (
        <EmptyNote text="Ödeme kayıtları oluşunca tahsilat burada görünür." />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.8 }}>
          <ChartCard title="Ödeme durumu" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statuses}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Adet" fill={T.navy} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Yöntem cirosu" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={methods.filter((row) => row.revenue > 0 || row.count > 0)}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" name="Ciro" fill={T.rose} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}
    </Box>
  );
}

function StockView({ data }) {
  const items = data?.items || [];
  const moving = items.filter((row) => row.qty30 > 0).slice(0, 6);
  const critical = items.filter((row) => row.stock <= 5).slice(0, 10);
  return (
    <Box>
      <StatCards items={[['Kritik stok', data?.lowStock || 0], ['Satmayan', data?.unsold || 0], ['Hareketli (30g)', data?.moving || 0]]} />
      {moving.length ? (
        <Box sx={{ mb: 1.8 }}>
          <ChartCard title="30 günlük satış hızı" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moving} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke={T.line} horizontal={false} />
                <XAxis type="number" tick={{ fill: T.muted, fontSize: 11 }} />
                <YAxis type="category" dataKey="title" width={120} tickFormatter={(value) => shortLabel(value, 14)} tick={{ fill: T.navy, fontSize: 12, fontWeight: 700 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="dailyRate" name="Günlük adet" fill={T.navy} radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      ) : (
        <EmptyNote text="Son 30 günde satış olmayınca stok hızı hesaplanamaz." />
      )}
      {critical.length ? (
        <PanelCard sx={{ p: 0, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Ürün', 'Stok', '30g', 'Kalan gün'].map((column) => (
                  <TableCell key={column} sx={headCell}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {critical.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.title}</TableCell>
                  <TableCell sx={{ ...bodyCell, fontWeight: 800, color: '#96393C' }}>{row.stock}</TableCell>
                  <TableCell sx={bodyCell}>{row.qty30}</TableCell>
                  <TableCell sx={bodyCell}>{row.daysLeft == null ? '—' : row.daysLeft}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </PanelCard>
      ) : null}
    </Box>
  );
}

export default function SellerPerformanceReport({ report }) {
  const [tab, setTab] = useState('performance');
  const current = REPORTS.find((item) => item.id === tab) || REPORTS[0];
  const views = {
    performance: <PerformanceView performance={report?.performance} timeseries={report?.timeseries} />,
    payments: <PaymentsView data={report?.payments} />,
    stock: <StockView data={report?.stock} />
  };

  return (
    <Box>
      <SectionTitle overline="RAPORLAR" title={current.title} subtitle={current.subtitle} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
        {REPORTS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            onClick={() => setTab(item.id)}
            sx={{
              fontWeight: 800,
              cursor: 'pointer',
              bgcolor: tab === item.id ? T.navy : '#fff',
              color: tab === item.id ? '#fff' : T.navy,
              border: `1px solid ${tab === item.id ? T.navy : T.line}`
            }}
          />
        ))}
      </Box>
      {views[tab]}
    </Box>
  );
}
