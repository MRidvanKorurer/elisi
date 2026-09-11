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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { PanelCard, SectionTitle } from './PanelShell';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, SELLER_STATUS, T, money } from '../utils/panel';
import AdminSellerDetailReport from './AdminSellerDetailReport';

const CHART_COLORS = ['#2E3B55', '#946D6D', '#A290B7', '#B0CDE6', '#C08A4A', '#3F6B47', '#6E5252', '#5B4B72'];
const SURFACE = { featured: 'Önerilen vitrin', product: 'Ürün kartı', atelier: 'Atölye', banner: 'Banner' };

const REPORTS = [
  { id: 'overview', n: 1, label: 'Platform', title: 'Platform özeti', subtitle: 'Ciro, sipariş, alıcı ve satıcı hacmi.' },
  { id: 'timeseries', n: 2, label: 'Zaman', title: 'Ciro ve kayıt zaman serisi', subtitle: 'Son 30 gün satış ve yeni alıcı kayıtları.' },
  { id: 'sellers', n: 3, label: 'Satıcılar', title: 'Satıcı performansı', subtitle: 'Mağaza cirosu, kargoya çıkış süresi ve onay durumu. Satıra tıklayınca detay açılır.' },
  { id: 'sellerDetail', n: 4, label: 'Satıcı detay', title: 'Detaylı satıcı raporu', subtitle: 'Seçilen mağazanın kargoya çıkış, teslim, ürün ve müşteri kırılımı.' },
  { id: 'buyers', n: 5, label: 'Alıcılar', title: 'Alıcı ve şehir kırılımı', subtitle: 'Kayıtlı kullanıcı, ilk sipariş ve tekrar alım.' },
  { id: 'fulfillment', n: 6, label: 'Kargo', title: 'Sipariş ve kargo', subtitle: 'Hazırlık, kargoya çıkış süresi, teslim ve iptal.' },
  { id: 'payments', n: 7, label: 'Tahsilat', title: 'Tahsilat ve ödeme yöntemi', subtitle: 'Bekleyen / ödenen ciro ve yöntem dağılımı.' },
  { id: 'catalog', n: 8, label: 'Katalog', title: 'Kategori ve ürün', subtitle: 'Kategori cirosu ve en çok kazandıran ürünler.' },
  { id: 'ads', n: 9, label: 'Reklam', title: 'Reklam, vitrin ve tıklama', subtitle: 'Önerilen ürün gösterim, tıklama, CTR ve paket getirisi.' },
  { id: 'promos', n: 10, label: 'Kampanya', title: 'Kampanya kodları', subtitle: 'Platform ve satıcı kodlarının ciro etkisi.' },
  { id: 'quality', n: 11, label: 'Kalite', title: 'Puan ve soru', subtitle: 'Yorum dağılımı ve yanıtsız ürün soruları.' }
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
const shortLabel = (value, max = 16) => {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};
const includesQ = (q, ...values) => !q || values.join(' ').toLowerCase().includes(q);
const dayLabel = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};
const monthLabel = (value) => {
  const [year, month] = String(value).split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('tr-TR', { month: 'short' });
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
function EmptyNote({ text }) {
  return (
    <PanelCard sx={{ textAlign: 'center', py: 6, mb: 1.8 }}>
      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.6 }}>Henüz veri yok</Typography>
      <Typography sx={{ color: T.muted }}>{text}</Typography>
    </PanelCard>
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

function OverviewView({ data }) {
  return (
    <StatCards items={[
      ['GMV', money(data?.gmv)],
      ['Tahsil edilen', money(data?.collected)],
      ['Sipariş', data?.orders || 0],
      ['Alıcı', data?.buyers || 0],
      ['Satıcı', data?.sellers || 0],
      ['Ürün', data?.products || 0],
      ['Bekleyen satıcı', data?.pendingSellers || 0],
      ['Onay bekleyen ürün', data?.pendingProducts || 0]
    ]} />
  );
}

function TimeView({ data }) {
  const daily = data?.daily || [];
  const monthly = data?.monthly || [];
  const has = daily.some((row) => row.orders || row.revenue || row.users);
  const today = daily[daily.length - 1] || {};
  const month = monthly[monthly.length - 1] || {};
  return (
    <Box>
      <StatCards items={[['Bugün ciro', money(today.revenue)], ['Bugün sipariş', today.orders || 0], ['Bu ay ciro', money(month.revenue)], ['Yeni alıcı (bugün)', today.users || 0]]} />
      {!has ? <EmptyNote text="Satış ve kayıt geldikçe çizgiler dolar." /> : (
        <Box sx={{ display: 'grid', gap: 1.8 }}>
          <ChartCard title="Son 30 gün" hint="Ciro, sipariş ve yeni alıcı." height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={daily} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: T.muted, fontSize: 11 }} interval={4} />
                <YAxis yAxisId="left" tick={{ fill: T.muted, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip labelFormatter={dayLabel} formatter={(value, name) => [name === 'Ciro' ? money(value) : value, name]} contentStyle={tooltipStyle} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Ciro" stroke={T.navy} fill="rgba(46,59,85,0.16)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Sipariş" stroke={T.rose} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="users" name="Kayıt" stroke={T.lavender} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Son 12 ay" hint="Aylık ciro.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip labelFormatter={monthLabel} formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" name="Ciro" fill={T.lavender} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}
    </Box>
  );
}

function SellersView({ data, q, onOpenSeller }) {
  const rows = (data?.list || data?.top || []).filter((row) => includesQ(q, row.shop, row.city));
  const pie = (data?.byStatus || []).filter((row) => row.count > 0).map((row) => ({ ...row, label: SELLER_STATUS[row.status] || row.status }));
  return (
    <Box>
      <StatCards items={[['Satıcı', data?.totals?.all || 0], ['Onaylı', data?.totals?.approved || 0], ['Bekleyen', data?.totals?.pending || 0], ['Satan mağaza', data?.totals?.withSales || 0]]} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 1.8, mb: 1.8 }}>
        <ChartCard title="Mağaza cirosu" hint="En yüksek ciro.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid stroke={T.line} horizontal={false} />
              <XAxis type="number" tick={{ fill: T.muted, fontSize: 11 }} />
              <YAxis type="category" dataKey="shop" width={120} tickFormatter={(value) => shortLabel(value, 14)} tick={{ fill: T.navy, fontSize: 12, fontWeight: 700 }} />
              <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
              <Bar dataKey="revenue" name="Ciro" fill={T.navy} radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Onay durumu">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pie} dataKey="count" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={2}>
                {pie.map((row, index) => <Cell key={row.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </Box>
      <Typography sx={{ color: T.muted, fontWeight: 700, mb: 1.2 }}>Mağazaya tıklayınca kargoya çıkış ve detay rapor açılır.</Typography>
      <ReportTable
        columns={['Mağaza', 'Şehir', 'Sipariş', 'Ciro', 'Ort. kargo', 'Geç %', 'İptal %', 'Durum']}
        rows={rows.map((row) => (
          <TableRow
            key={row.sellerId}
            hover
            onClick={() => onOpenSeller?.(row.sellerId)}
            sx={{ cursor: 'pointer' }}
          >
            <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.shop}</TableCell>
            <TableCell sx={bodyCell}>{row.city || '—'}</TableCell>
            <TableCell sx={bodyCell}>{row.orders}</TableCell>
            <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
            <TableCell sx={bodyCell}>{row.avgDaysToShip ? `${row.avgDaysToShip} gün` : '—'}</TableCell>
            <TableCell sx={{ ...bodyCell, color: row.lateRate > 0 ? T.rose : T.navy, fontWeight: 800 }}>%{row.lateRate || 0}</TableCell>
            <TableCell sx={bodyCell}>%{row.cancelRate || 0}</TableCell>
            <TableCell sx={bodyCell}>{SELLER_STATUS[row.status] || row.status}</TableCell>
          </TableRow>
        ))}
      />
    </Box>
  );
}

function BuyersView({ data, q }) {
  const totals = data?.totals || {};
  const cities = (data?.cities || []).filter((row) => includesQ(q, row.city));
  const list = (data?.list || []).filter((row) => includesQ(q, row.name, row.email, row.city));
  const pie = [
    { name: 'İlk sipariş', value: totals.firstRevenue || 0 },
    { name: 'Tekrar', value: totals.repeatRevenue || 0 }
  ].filter((row) => row.value > 0);
  return (
    <Box>
      <StatCards items={[['Kayıtlı alıcı', totals.registered || 0], ['Sipariş veren', totals.checkout || 0], ['Tekrar eden', totals.repeat || 0], ['Tekrar ciro', money(totals.repeatRevenue)]]} />
      {!totals.checkout ? <EmptyNote text="Siparişler gelince alıcı kırılımı oluşur." /> : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8, mb: 1.8 }}>
            <ChartCard title="Şehir cirosu">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cities}>
                  <CartesianGrid stroke={T.line} vertical={false} />
                  <XAxis dataKey="city" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} interval={0} angle={-18} textAnchor="end" height={56} />
                  <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                  <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" name="Ciro" fill={T.navy} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="İlk vs tekrar">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
                    {pie.map((row, index) => <Cell key={row.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Box>
          <ReportTable
            columns={['Alıcı', 'Şehir', 'Sipariş', 'Ciro', 'Tür']}
            rows={list.map((row) => (
              <TableRow key={row.key} hover>
                <TableCell sx={bodyCell}>
                  <Typography sx={{ fontWeight: 800 }}>{row.name}</Typography>
                  <Typography sx={{ color: T.muted, fontSize: 12 }}>{row.email || '—'}</Typography>
                </TableCell>
                <TableCell sx={bodyCell}>{row.city}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.orders}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
                <TableCell sx={bodyCell}>{row.repeat ? 'Tekrar' : 'İlk'}</TableCell>
              </TableRow>
            ))}
          />
        </>
      )}
    </Box>
  );
}

function StatusBars({ rows, labelMap }) {
  const chart = rows.map((row) => ({ ...row, label: labelMap[row.status] || row.status }));
  const pie = chart.filter((row) => row.count > 0);
  if (!rows.some((row) => row.count)) return <EmptyNote text="Kayıt yok." />;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' }, gap: 1.8 }}>
      <ChartCard title="Dağılım">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
            <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Adet" radius={[10, 10, 0, 0]}>
              {chart.map((row, index) => <Cell key={row.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Pay">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pie} dataKey="count" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={2}>
              {pie.map((row, index) => <Cell key={row.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </Box>
  );
}

function AdsView({ data, q }) {
  const totals = data?.totals || {};
  const products = (data?.products || []).filter((row) => includesQ(q, row.title, row.shop));
  const featured = (data?.featured || []).filter((row) => includesQ(q, row.title, row.shop));
  const daily = data?.daily || [];
  const surfaces = (data?.surfaces || []).map((row) => ({ ...row, label: SURFACE[row.surface] || row.surface }));
  return (
    <Box>
      <StatCards items={[['Gösterim', totals.impressions || 0], ['Tıklama', totals.clicks || 0], ['CTR', `%${totals.ctr || 0}`], ['Vitrin harcaması', money(totals.spend)], ['Atfedilen satış', money(totals.attributed)], ['Yayında', totals.live || 0]]} />
      {!totals.impressions && !totals.clicks && !featured.length ? (
        <EmptyNote text="Önerilen vitrin açılınca gösterim, ürüne tıklanınca tıklama yazılır." />
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 1.8, mb: 1.8 }}>
            <ChartCard title="30 günlük tıklama" hint="Gösterim ve tıklama.">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={daily}>
                  <CartesianGrid stroke={T.line} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: T.muted, fontSize: 11 }} interval={4} />
                  <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                  <Tooltip labelFormatter={dayLabel} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="impressions" name="Gösterim" stroke={T.lavender} fill="rgba(162,144,183,0.2)" />
                  <Line type="monotone" dataKey="clicks" name="Tıklama" stroke={T.rose} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Yüzey" hint="Nereden tıklandı.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={surfaces}>
                  <CartesianGrid stroke={T.line} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="clicks" name="Tıklama" fill={T.navy} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Box>
          <Box sx={{ mb: 1.8 }}>
            <ReportTable
              columns={['Ürün', 'Mağaza', 'Gösterim', 'Tıklama', 'CTR']}
              rows={products.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.title}</TableCell>
                  <TableCell sx={bodyCell}>{row.shop || '—'}</TableCell>
                  <TableCell sx={bodyCell}>{row.impressions}</TableCell>
                  <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.clicks}</TableCell>
                  <TableCell sx={bodyCell}>%{row.ctr}</TableCell>
                </TableRow>
              ))}
            />
          </Box>
          <ReportTable
            columns={['Vitrin ürünü', 'Mağaza', 'Harcama', 'Satış', 'Tıklama', 'ROI']}
            rows={featured.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.title}</TableCell>
                <TableCell sx={bodyCell}>{row.shop || '—'}</TableCell>
                <TableCell sx={bodyCell}>{money(row.spent)}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
                <TableCell sx={bodyCell}>{row.clicks}</TableCell>
                <TableCell sx={bodyCell}>{row.roi == null ? '—' : `%${row.roi}`}</TableCell>
              </TableRow>
            ))}
          />
        </>
      )}
    </Box>
  );
}

function CatalogView({ data, q }) {
  const categories = (data?.categories || []).filter((row) => includesQ(q, row.label, row.category) && (row.qty > 0 || row.revenue > 0));
  const products = (data?.products || []).filter((row) => includesQ(q, row.title, row.shop, row.category));
  const totals = data?.totals || {};
  return (
    <Box>
      <StatCards items={[['Yayında', totals.live || 0], ['Onay bekleyen', totals.pending || 0], ['Kritik stok', totals.lowStock || 0], ['Satmayan', totals.unsold || 0]]} />
      {!categories.length ? <EmptyNote text="Satış geldikçe kategori grafiği dolar." /> : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 1.8, mb: 1.8 }}>
          <ChartCard title="Kategori cirosu">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} interval={0} angle={-18} textAnchor="end" height={56} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" name="Ciro" radius={[10, 10, 0, 0]}>
                  {categories.map((row, index) => <Cell key={row.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Kategori payı">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="qty" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {categories.map((row, index) => <Cell key={row.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} adet`, name]} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}
      <ReportTable
        columns={['Ürün', 'Mağaza', 'Kategori', 'Adet', 'Ciro']}
        rows={products.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.title}</TableCell>
            <TableCell sx={bodyCell}>{row.shop || '—'}</TableCell>
            <TableCell sx={bodyCell}>{row.category}</TableCell>
            <TableCell sx={bodyCell}>{row.qty}</TableCell>
            <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
          </TableRow>
        ))}
      />
    </Box>
  );
}

function PromosView({ data, q }) {
  const codes = (data?.codes || []).filter((row) => includesQ(q, row.code, row.seller));
  const mix = [
    { name: 'Kodlu', ...(data?.withPromo || { orders: 0, revenue: 0 }) },
    { name: 'Kodsuz', ...(data?.withoutPromo || { orders: 0, revenue: 0 }) }
  ];
  return (
    <Box>
      <StatCards items={[['Kodlu sipariş', data?.withPromo?.orders || 0], ['Kodlu ciro', money(data?.withPromo?.revenue)], ['Kodsuz ciro', money(data?.withoutPromo?.revenue)], ['Kod', codes.length]]} />
      <Box sx={{ mb: 1.8 }}>
        <ChartCard title="Kodlu vs kodsuz">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mix}>
              <CartesianGrid stroke={T.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
              <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
              <Bar dataKey="revenue" name="Ciro" radius={[10, 10, 0, 0]}>
                {mix.map((row, index) => <Cell key={row.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Box>
      <ReportTable
        columns={['Kod', 'Sahip', '%', 'Sipariş', 'Ciro', 'İndirim']}
        rows={codes.map((row) => (
          <TableRow key={row.id || row.code} hover>
            <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.code}</TableCell>
            <TableCell sx={bodyCell}>{row.seller}</TableCell>
            <TableCell sx={bodyCell}>{row.percent}</TableCell>
            <TableCell sx={bodyCell}>{row.orders}</TableCell>
            <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
            <TableCell sx={bodyCell}>{money(row.discount)}</TableCell>
          </TableRow>
        ))}
      />
    </Box>
  );
}

function QualityView({ data }) {
  const ratings = data?.ratings || [];
  const questions = data?.questions || {};
  return (
    <Box>
      <StatCards items={[['Ort. puan', data?.avgRating || 0], ['Yorum', data?.reviewCount || 0], ['Soru', questions.total || 0], ['Yanıtsız', questions.unanswered || 0]]} />
      {!data?.reviewCount && !questions.total ? <EmptyNote text="Yorum ve sorular gelince burası dolar." /> : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' }, gap: 1.8 }}>
          <ChartCard title="Puan dağılımı">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratings}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="star" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Yorum" fill={T.rose} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Soru durumu">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Yanıtlandı', value: Math.max(0, (questions.total || 0) - (questions.unanswered || 0)) },
                    { name: 'Açık', value: questions.unanswered || 0 }
                  ].filter((row) => row.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                >
                  <Cell fill={T.navy} />
                  <Cell fill={T.rose} />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}
    </Box>
  );
}

export default function AdminPlatformReport({ report, query = '' }) {
  const [tab, setTab] = useState('overview');
  const [sellerId, setSellerId] = useState('');
  const q = query.trim().toLowerCase();
  const current = REPORTS.find((item) => item.id === tab) || REPORTS[0];
  const openSeller = (id) => {
    setSellerId(id);
    setTab('sellerDetail');
  };
  const views = {
    overview: <OverviewView data={report?.overview} />,
    timeseries: <TimeView data={report?.timeseries} />,
    sellers: <SellersView data={report?.sellers} q={q} onOpenSeller={openSeller} />,
    sellerDetail: (
      <AdminSellerDetailReport
        sellers={report?.sellers?.list || report?.sellers?.top || []}
        sellerId={sellerId || report?.sellers?.list?.[0]?.sellerId || report?.sellers?.top?.[0]?.sellerId}
        onSelect={setSellerId}
        query={q}
      />
    ),
    buyers: <BuyersView data={report?.buyers} q={q} />,
    fulfillment: (
      <Box>
        <StatCards items={[
          ['Toplam', report?.fulfillment?.total || 0],
          ['Ort. kargoya çıkış', `${report?.fulfillment?.avgDaysToShip || 0} gün`],
          ['Geç kargo', `%${report?.fulfillment?.lateRate || 0}`],
          ['İptal', report?.fulfillment?.cancelled || 0]
        ]} />
        <Box sx={{ mb: 1.8 }}>
          <ChartCard title="Kaç günde kargoya verildi" hint="Tüm satıcıların kargoya çıkış süreleri.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.fulfillment?.shipBuckets || []}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="bucket" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Sipariş" fill={T.navy} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
        <StatusBars rows={report?.fulfillment?.byStatus || []} labelMap={ORDER_STATUS} />
      </Box>
    ),
    payments: (
      <Box>
        <StatCards items={[['Tahsil', money(report?.payments?.totals?.collected)], ['Bekleyen', money(report?.payments?.totals?.outstanding)], ['Ödendi', report?.payments?.totals?.completed || 0], ['Bekliyor', report?.payments?.totals?.pending || 0]]} />
        <StatusBars rows={report?.payments?.byStatus || []} labelMap={PAYMENT_STATUS} />
        {(report?.payments?.byMethod || []).length ? (
          <Box sx={{ mt: 1.8 }}>
            <ChartCard title="Ödeme yöntemi cirosu">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(report.payments.byMethod || []).map((row) => ({ ...row, label: PAYMENT_METHOD[row.method] || row.method }))}>
                  <CartesianGrid stroke={T.line} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                  <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" name="Ciro" fill={T.navy} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Box>
        ) : null}
      </Box>
    ),
    catalog: <CatalogView data={report?.catalog} q={q} />,
    ads: <AdsView data={report?.ads} q={q} />,
    promos: <PromosView data={report?.promos} q={q} />,
    quality: <QualityView data={report?.quality} />
  };

  return (
    <Box>
      <SectionTitle overline={`RAPOR ${current.n}`} title={current.title} subtitle={current.subtitle} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.2 }}>
        {REPORTS.map((item) => (
          <Chip
            key={item.id}
            label={`${item.n}. ${item.label}`}
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
