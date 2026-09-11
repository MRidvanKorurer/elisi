import { useEffect, useState } from 'react';
import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { adminService } from '../api/adminService';
import { PanelCard } from './PanelShell';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, T, money, when } from '../utils/panel';

const CHART_COLORS = ['#2E3B55', '#946D6D', '#A290B7', '#B0CDE6', '#C08A4A', '#3F6B47', '#6E5252', '#5B4B72'];
const SECTIONS = [
  { id: 'cargo', label: 'Kargo süresi' },
  { id: 'orders', label: 'Siparişler' },
  { id: 'catalog', label: 'Ürün & varyasyon' },
  { id: 'customers', label: 'Müşteri & tahsilat' }
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
const tooltipStyle = { borderRadius: 12, border: `1px solid ${T.line}`, fontWeight: 700, fontSize: 12 };

const daysText = (value) => (value == null ? '—' : `${Number(value).toLocaleString('tr-TR')} gün`);
const pct = (value) => `%${Number(value || 0).toLocaleString('tr-TR')}`;
const shortLabel = (value, max = 16) => {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};
const lateNote = (row) => {
  if (row.status === 'cancelled') return 'İptal';
  if (row.status === 'processing') return row.late ? 'Geç hazırlık' : 'Hazırlanıyor';
  return row.late ? 'Geç kargo' : 'Zamanında';
};

function StatCards({ items }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${Math.min(items.length, 4)}, 1fr)` }, gap: 1.4, mb: 2.2 }}>
      {items.map(([label, value]) => (
        <PanelCard key={label} sx={{ py: 1.8 }}>
          <Typography sx={{ color: T.muted, fontWeight: 800, fontSize: 12 }}>{label}</Typography>
          <Typography sx={{ fontWeight: 900, color: T.navy, fontSize: '1.35rem', mt: 0.3 }}>{value}</Typography>
        </PanelCard>
      ))}
    </Box>
  );
}

function ChartCard({ title, hint, height = 280, children }) {
  return (
    <PanelCard>
      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>{title}</Typography>
      {hint ? <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.6 }}>{hint}</Typography> : null}
      <Box sx={{ height }}>{children}</Box>
    </PanelCard>
  );
}

function ReportTable({ columns, rows, empty = 'Kayıt yok.' }) {
  return (
    <PanelCard sx={{ p: 0, overflow: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>{columns.map((column) => <TableCell key={column} sx={headCell}>{column}</TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {rows}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={columns.length} sx={{ ...bodyCell, color: T.muted }}>{empty}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </PanelCard>
  );
}

export default function AdminSellerDetailReport({ sellers = [], sellerId, onSelect, query = '' }) {
  const [section, setSection] = useState('cargo');
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const q = query.trim().toLowerCase();
  const shops = (sellers || []).filter((row) => !q || `${row.shop} ${row.city}`.toLowerCase().includes(q));
  const activeId = sellerId || shops[0]?.sellerId || '';

  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      return undefined;
    }
    let live = true;
    setLoading(true);
    adminService.reportsSeller(activeId)
      .then((payload) => {
        if (!live) return;
        setDetail(payload.report || null);
        setError('');
      })
      .catch((err) => {
        if (!live) return;
        setDetail(null);
        setError(err.response?.data?.mesaj || 'Satıcı raporu alınamadı.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => { live = false; };
  }, [activeId]);

  const kpis = detail?.kpis || {};
  const orders = (detail?.orders || []).filter((row) => `${row.customer} ${row.city} ${(row.products || []).join(' ')}`.toLowerCase().includes(q));
  const products = (detail?.products || []).filter((row) => `${row.title} ${row.label}`.toLowerCase().includes(q));

  return (
    <Box>
      <Typography sx={{ color: T.muted, fontWeight: 700, mb: 1.2 }}>
        Mağaza seçin. Kargoya çıkış, teslim ve geç kalan siparişler bu satıcıya özel hesaplanır.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
        {shops.map((row) => (
          <Chip
            key={row.sellerId}
            label={row.shop}
            onClick={() => onSelect?.(row.sellerId)}
            sx={{
              fontWeight: 800,
              cursor: 'pointer',
              bgcolor: activeId === row.sellerId ? T.navy : '#fff',
              color: activeId === row.sellerId ? '#fff' : T.navy,
              border: `1px solid ${activeId === row.sellerId ? T.navy : T.line}`
            }}
          />
        ))}
      </Box>

      {!activeId ? (
        <PanelCard sx={{ textAlign: 'center', py: 6 }}><Typography sx={{ fontWeight: 800, color: T.navy }}>Satıcı yok.</Typography></PanelCard>
      ) : loading && !detail ? (
        <PanelCard sx={{ textAlign: 'center', py: 6 }}><Typography sx={{ color: T.muted }}>Rapor yükleniyor…</Typography></PanelCard>
      ) : error ? (
        <PanelCard sx={{ textAlign: 'center', py: 6 }}><Typography sx={{ color: T.rose, fontWeight: 800 }}>{error}</Typography></PanelCard>
      ) : (
        <>
          <StatCards items={[
            ['Ciro', money(kpis.revenue)],
            ['Sipariş', kpis.orders || 0],
            ['Ort. kargoya çıkış', daysText(kpis.avgDaysToShip)],
            ['Ort. teslim', daysText(kpis.avgDaysToDeliver)],
            ['Geç kargo', pct(kpis.lateRate)],
            ['İptal', pct(kpis.cancelRate)],
            ['Bekleyen yaş', daysText(kpis.avgWaiting)],
            ['Yanıtsız soru', detail?.quality?.questions?.unanswered || 0]
          ]} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.2 }}>
            {SECTIONS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                onClick={() => setSection(item.id)}
                sx={{
                  fontWeight: 800,
                  cursor: 'pointer',
                  bgcolor: section === item.id ? T.rose : '#fff',
                  color: section === item.id ? '#fff' : T.navy,
                  border: `1px solid ${section === item.id ? T.rose : T.line}`
                }}
              />
            ))}
          </Box>

          {section === 'cargo' && (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' }, gap: 1.8, mb: 1.8 }}>
                <ChartCard title="Kaç günde kargoya verdi" hint={`3 günden uzun çıkış geç sayılır. SLA: ${kpis.slaDays || 3} gün.`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpis.shipBuckets || []}>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis dataKey="bucket" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                      <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Sipariş" radius={[10, 10, 0, 0]}>
                        {(kpis.shipBuckets || []).map((row, index) => (
                          <Cell key={row.key || row.bucket} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Sipariş durumu">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(kpis.byStatus || []).filter((row) => row.count > 0).map((row) => ({ ...row, label: ORDER_STATUS[row.status] || row.status }))}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={2}
                      >
                        {(kpis.byStatus || []).filter((row) => row.count > 0).map((row, index) => (
                          <Cell key={row.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8, mb: 1.8 }}>
                <ChartCard title="Hâlâ hazırlanan siparişlerin yaşı" hint="Kargoya verilmemiş siparişler.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpis.waitBuckets || []}>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis dataKey="bucket" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                      <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Sipariş" fill={T.lavender} radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Son 30 gün satış">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={detail?.timeseries?.daily || []}>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 11 }} interval={4} />
                      <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [name === 'Ciro' ? money(value) : value, name]} />
                      <Bar dataKey="revenue" name="Ciro" fill={T.navy} radius={[8, 8, 0, 0]} />
                      <Line type="monotone" dataKey="orders" name="Sipariş" stroke={T.rose} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Box>
              <StatCards items={[
                ['Kargo sonrası teslim', daysText(kpis.avgDaysAfterShip)],
                ['Açık sipariş', kpis.open || 0],
                ['Teslim', kpis.delivered || 0],
                ['Puan', detail?.quality?.avgRating || 0]
              ]} />
            </Box>
          )}

          {section === 'orders' && (
            <ReportTable
              columns={['Tarih', 'Müşteri', 'Ürün', 'Durum', 'Kargoya', 'Teslim', 'Not']}
              rows={orders.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={bodyCell}>{when(row.createdAt)}</TableCell>
                  <TableCell sx={bodyCell}>
                    <Typography sx={{ fontWeight: 800 }}>{row.customer}</Typography>
                    <Typography sx={{ color: T.muted, fontSize: 12 }}>{row.city}</Typography>
                  </TableCell>
                  <TableCell sx={bodyCell}>{shortLabel((row.products || []).join(', '), 28)}</TableCell>
                  <TableCell sx={bodyCell}>{ORDER_STATUS[row.status] || row.status}</TableCell>
                  <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{daysText(row.daysToShip)}</TableCell>
                  <TableCell sx={bodyCell}>{daysText(row.daysToDeliver)}</TableCell>
                  <TableCell sx={{ ...bodyCell, color: row.late ? T.rose : T.navy, fontWeight: 800 }}>{lateNote(row)}</TableCell>
                </TableRow>
              ))}
              empty="Bu satıcıya ait sipariş yok."
            />
          )}

          {section === 'catalog' && (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8, mb: 1.8 }}>
                <ChartCard title="Renk">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(detail?.variants?.colors || []).slice(0, 8)}>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                      <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="qty" name="Adet" fill={T.navy} radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Beden / ölçü">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(detail?.variants?.sizes || []).slice(0, 8)}>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                      <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="qty" name="Adet" fill={T.lavender} radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Box>
              <ReportTable
                columns={['Ürün', 'Kategori', 'Adet', 'Ciro', 'Ort. kargo']}
                rows={products.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.title}</TableCell>
                    <TableCell sx={bodyCell}>{row.label}</TableCell>
                    <TableCell sx={bodyCell}>{row.qty}</TableCell>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
                    <TableCell sx={bodyCell}>{daysText(row.avgDaysToShip)}</TableCell>
                  </TableRow>
                ))}
              />
            </Box>
          )}

          {section === 'customers' && (
            <Box>
              <StatCards items={[
                ['Müşteri', detail?.customers?.totals?.all || 0],
                ['Tekrar eden', detail?.customers?.totals?.repeat || 0],
                ['Tıklama', detail?.ads?.clicks || 0],
                ['CTR', pct(detail?.ads?.ctr)]
              ]} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8, mb: 1.8 }}>
                <ChartCard title="Şehir cirosu">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={detail?.customers?.cities || []}>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis dataKey="city" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} interval={0} angle={-18} textAnchor="end" height={56} />
                      <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                      <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                      <Bar dataKey="revenue" name="Ciro" fill={T.navy} radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Ödeme yöntemi">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(detail?.payments?.byMethod || []).map((row) => ({ ...row, label: PAYMENT_METHOD[row.method] || row.method }))}>
                      <CartesianGrid stroke={T.line} vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                      <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                      <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                      <Bar dataKey="revenue" name="Ciro" fill={T.rose} radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Box>
              <ReportTable
                columns={['Alıcı', 'Şehir', 'Sipariş', 'Ciro']}
                rows={(detail?.customers?.list || []).map((row) => (
                  <TableRow key={row.key} hover>
                    <TableCell sx={bodyCell}>
                      <Typography sx={{ fontWeight: 800 }}>{row.name}</Typography>
                      <Typography sx={{ color: T.muted, fontSize: 12 }}>{row.email || '—'}</Typography>
                    </TableCell>
                    <TableCell sx={bodyCell}>{row.city}</TableCell>
                    <TableCell sx={bodyCell}>{row.orders}</TableCell>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              />
              {(detail?.payments?.byStatus || []).length ? (
                <Box sx={{ mt: 1.8 }}>
                  <ReportTable
                    columns={['Ödeme', 'Adet', 'Tutar']}
                    rows={(detail.payments.byStatus || []).map((row) => (
                      <TableRow key={row.status} hover>
                        <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{PAYMENT_STATUS[row.status] || row.status}</TableCell>
                        <TableCell sx={bodyCell}>{row.count}</TableCell>
                        <TableCell sx={bodyCell}>{money(row.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  />
                </Box>
              ) : null}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
