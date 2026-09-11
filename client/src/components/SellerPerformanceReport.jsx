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
import { FEATURED_STATUS } from '../utils/featured';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, T, money } from '../utils/panel';

const CHART_COLORS = ['#2E3B55', '#946D6D', '#A290B7', '#B0CDE6', '#C08A4A', '#3F6B47', '#6E5252', '#5B4B72'];

const REPORTS = [
  { id: 'performance', n: 1, label: 'Kategori & ürün', title: 'Kategori ve ürün performansı', subtitle: 'İptal edilmeyen siparişlere göre ciro ve adet. Tahsil bekleyen satışlar dahildir.' },
  { id: 'timeseries', n: 2, label: 'Zaman', title: 'Ciro ve sipariş zaman serisi', subtitle: 'Son 30 gün günlük, son 12 ay aylık satış ritmi.' },
  { id: 'fulfillment', n: 3, label: 'Kargo', title: 'Sipariş ve kargo durumu', subtitle: 'Hazırlık, kargo, teslim ve iptal dağılımı. Süre, teslim/kargo güncellemesine göredir.' },
  { id: 'payments', n: 4, label: 'Tahsilat', title: 'Tahsilat ve ödeme yöntemi', subtitle: 'Bekleyen, tamamlanan ve başarısız ödemeler; kart, havale ve WhatsApp kırılımı.' },
  { id: 'stock', n: 5, label: 'Stok', title: 'Stok ve satış hızı', subtitle: 'Son 30 günlük satışa göre stok ömrü, kritik stok ve hiç satmayan ürünler.' },
  { id: 'variants', n: 6, label: 'Varyasyon', title: 'Renk ve beden performansı', subtitle: 'Sipariş satırlarındaki renk ve beden seçimleri.' },
  { id: 'customers', n: 7, label: 'Müşteri', title: 'Müşteri ve şehir kırılımı', subtitle: 'İlk sipariş ile tekrar alım, teslimat şehrine göre ciro.' },
  { id: 'promos', n: 8, label: 'Kampanya', title: 'Kampanya kodu performansı', subtitle: 'Kendi kodlarınızın kullanım, ciro ve indirim etkisi.' },
  { id: 'featured', n: 9, label: 'Öne çıkanlar', title: 'Öne çıkan vitrin getirisi', subtitle: 'Paket bedeli ile vitrin süresindeki ürün satışının karşılaştırması.' },
  { id: 'quality', n: 10, label: 'Puan & soru', title: 'Puan, yorum ve soru yanıtı', subtitle: 'Ürün puan dağılımı, yorum hacmi ve ortalama yanıt süresi.' }
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

const includesQ = (q, ...values) => {
  if (!q) return true;
  return values.join(' ').toLowerCase().includes(q);
};

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

function ProductCell({ row }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
      {row.image ? (
        <Box component="img" src={row.image} alt="" sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '10px', bgcolor: T.surfaceSoft }} />
      ) : null}
      <Typography sx={{ fontWeight: 800 }}>{row.title}</Typography>
    </Box>
  );
}

function ReportTable({ columns, rows, empty = 'Kayıt yok.' }) {
  return (
    <PanelCard sx={{ p: 0, overflow: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column} sx={headCell}>{column}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => row)}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={columns.length} sx={{ ...bodyCell, color: T.muted }}>{empty}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </PanelCard>
  );
}

function PerformanceView({ data, q }) {
  const categories = (data?.categories || []).filter((row) => includesQ(q, row.label, row.category));
  const products = (data?.products || []).filter((row) => includesQ(q, row.title, row.category, row.label));
  const categoryChart = categories.filter((row) => row.qty > 0 || row.revenue > 0);
  const productChart = products.filter((row) => row.qty > 0).slice(0, 8);
  const totals = data?.totals || { revenue: 0, qty: 0, products: 0, categories: 0 };

  return (
    <Box>
      <StatCards items={[['Ciro', money(totals.revenue)], ['Satılan adet', totals.qty], ['Satan ürün', totals.products], ['Kategori', totals.categories]]} />
      {!categoryChart.length ? (
        <EmptyNote text="Sipariş geldiğinde kategori ve ürün grafikleri burada dolar." />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 1.8, mb: 1.8 }}>
          <ChartCard title="Kategori cirosu" hint="Hangi üretim alanında ne kadar satış yaptığınız.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChart} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} interval={0} angle={-18} textAnchor="end" height={56} />
                <YAxis tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" name="Ciro" radius={[10, 10, 0, 0]}>
                  {categoryChart.map((row, index) => <Cell key={row.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Kategori payı" hint="Satılan adetlere göre dağılım.">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryChart} dataKey="qty" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {categoryChart.map((row, index) => <Cell key={row.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} adet`, name]} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}
      <PanelCard sx={{ mb: 1.8 }}>
        <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Ürün cirosu</Typography>
        <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.6 }}>En çok kazandıran 8 ürün.</Typography>
        {!productChart.length ? (
          <Typography sx={{ color: T.muted }}>Satışı olan ürün henüz yok.</Typography>
        ) : (
          <Box sx={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productChart} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke={T.line} horizontal={false} />
                <XAxis type="number" tick={{ fill: T.muted, fontSize: 11 }} />
                <YAxis type="category" dataKey="title" width={120} tickFormatter={(value) => shortLabel(value, 14)} tick={{ fill: T.navy, fontSize: 12, fontWeight: 700 }} />
                <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" name="Ciro" radius={[0, 10, 10, 0]} fill={T.rose} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </PanelCard>
      <ReportTable
        columns={['Ürün', 'Kategori', 'Adet', 'Ciro', 'Sipariş', 'Stok']}
        rows={products.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell sx={bodyCell}><ProductCell row={row} /></TableCell>
            <TableCell sx={bodyCell}>{row.label || row.category}</TableCell>
            <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.qty}</TableCell>
            <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
            <TableCell sx={bodyCell}>{row.orders}</TableCell>
            <TableCell sx={bodyCell}>{row.stock}</TableCell>
          </TableRow>
        ))}
      />
    </Box>
  );
}

function TimeView({ data, q }) {
  const daily = (data?.daily || []).filter((row) => includesQ(q, row.date, dayLabel(row.date)));
  const monthly = (data?.monthly || []).filter((row) => includesQ(q, row.month, monthLabel(row.month)));
  const hasSales = daily.some((row) => row.orders > 0 || row.revenue > 0) || monthly.some((row) => row.orders > 0);
  const today = daily[daily.length - 1] || { revenue: 0, orders: 0 };
  const month = monthly[monthly.length - 1] || { revenue: 0, orders: 0 };

  return (
    <Box>
      <StatCards items={[['Bugün ciro', money(today.revenue)], ['Bugün sipariş', today.orders], ['Bu ay ciro', money(month.revenue)], ['Bu ay sipariş', month.orders]]} />
      {!hasSales ? (
        <EmptyNote text="Satış geldikçe günlük ve aylık çizgiler burada oluşur." />
      ) : (
        <Box sx={{ display: 'grid', gap: 1.8 }}>
          <ChartCard title="Son 30 gün" hint="Ciro ve sipariş adedi." height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={daily} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: T.muted, fontSize: 11 }} interval={4} />
                <YAxis yAxisId="left" tick={{ fill: T.muted, fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip labelFormatter={dayLabel} formatter={(value, name) => [name === 'Ciro' ? money(value) : value, name]} contentStyle={tooltipStyle} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Ciro" stroke={T.navy} fill="rgba(46,59,85,0.16)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Sipariş" stroke={T.rose} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Son 12 ay" hint="Aylık ciro." height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
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

function FulfillmentView({ data }) {
  const rows = data?.byStatus || [];
  const pie = rows.filter((row) => row.count > 0).map((row) => ({ ...row, label: ORDER_STATUS[row.status] || row.status }));
  return (
    <Box>
      <StatCards items={[['Toplam', data?.total || 0], ['Açık', data?.open || 0], ['Teslim', data?.delivered || 0], ['Ort. süre (gün)', data?.avgDays || 0]]} />
      {!rows.some((row) => row.count) ? (
        <EmptyNote text="Sipariş durumu grafikleri ilk satıştan sonra dolar." />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' }, gap: 1.8, mb: 1.8 }}>
          <ChartCard title="Durum dağılımı" hint="Sizin kargo adımlarınız.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.map((row) => ({ ...row, label: ORDER_STATUS[row.status] || row.status }))}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Sipariş" radius={[10, 10, 0, 0]}>
                  {rows.map((row, index) => <Cell key={row.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Pay" hint="İptal dahil tüm siparişler.">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="count" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {pie.map((row, index) => <Cell key={row.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} sipariş`, name]} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
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
      <StatCards items={[['Tahsil edilen', money(totals.collected)], ['Bekleyen ciro', money(totals.outstanding)], ['Ödendi', totals.completed || 0], ['Bekliyor', totals.pending || 0]]} />
      {!statuses.some((row) => row.count) ? (
        <EmptyNote text="Ödeme kayıtları oluşunca tahsilat kırılımı burada görünür." />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
          <ChartCard title="Ödeme durumu" hint="Bekleyen / ödenen / başarısız.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statuses}>
                <CartesianGrid stroke={T.line} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip formatter={(value, name) => [name === 'Ciro' ? money(value) : value, name]} contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Adet" fill={T.navy} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Yöntem cirosu" hint="Kart, havale ve WhatsApp.">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={methods.filter((row) => row.revenue > 0 || row.count > 0)} dataKey="revenue" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {methods.map((row, index) => <Cell key={row.method} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [money(value), name]} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}
    </Box>
  );
}

function StockView({ data, q }) {
  const items = (data?.items || []).filter((row) => includesQ(q, row.title, row.category));
  const moving = items.filter((row) => row.qty30 > 0).slice(0, 8);
  return (
    <Box>
      <StatCards items={[['Kritik stok', data?.lowStock || 0], ['Satmayan', data?.unsold || 0], ['Hareketli (30g)', data?.moving || 0], ['Ürün', items.length]]} />
      {moving.length ? (
        <Box sx={{ mb: 1.8 }}>
          <ChartCard title="30 günlük satış hızı" hint="Günlük ortalama adet.">
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
      <ReportTable
        columns={['Ürün', 'Kategori', 'Stok', '30g adet', 'Günlük', 'Kalan gün']}
        rows={items.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell sx={bodyCell}><ProductCell row={row} /></TableCell>
            <TableCell sx={bodyCell}>{row.category}</TableCell>
            <TableCell sx={{ ...bodyCell, fontWeight: 800, color: row.stock <= 5 ? '#96393C' : T.navy }}>{row.stock}</TableCell>
            <TableCell sx={bodyCell}>{row.qty30}</TableCell>
            <TableCell sx={bodyCell}>{row.dailyRate}</TableCell>
            <TableCell sx={bodyCell}>{row.daysLeft == null ? '—' : row.daysLeft}</TableCell>
          </TableRow>
        ))}
      />
    </Box>
  );
}

function VariantsView({ data, q }) {
  const colors = (data?.colors || []).filter((row) => includesQ(q, row.name));
  const sizes = (data?.sizes || []).filter((row) => includesQ(q, row.name));
  if (!colors.length && !sizes.length) {
    return <EmptyNote text="Siparişlerde renk veya beden seçilince kırılım burada görünür." />;
  }
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
      <ChartCard title="Renk" hint="Satılan adet.">
        {colors.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={colors}>
              <CartesianGrid stroke={T.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
              <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
              <Tooltip formatter={(value, name) => [name === 'Ciro' ? money(value) : value, name]} contentStyle={tooltipStyle} />
              <Bar dataKey="qty" name="Adet" fill={T.rose} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <Typography sx={{ color: T.muted }}>Renk kaydı yok.</Typography>}
      </ChartCard>
      <ChartCard title="Beden" hint="Satılan adet.">
        {sizes.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sizes}>
              <CartesianGrid stroke={T.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: T.muted, fontSize: 11, fontWeight: 700 }} />
              <YAxis allowDecimals={false} tick={{ fill: T.muted, fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="qty" name="Adet" fill={T.lavender} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <Typography sx={{ color: T.muted }}>Beden kaydı yok.</Typography>}
      </ChartCard>
    </Box>
  );
}

function CustomersView({ data, q }) {
  const totals = data?.totals || {};
  const cities = (data?.cities || []).filter((row) => includesQ(q, row.city));
  const list = (data?.list || []).filter((row) => includesQ(q, row.name, row.email, row.city));
  const pie = [
    { name: 'İlk sipariş', value: totals.firstRevenue || 0 },
    { name: 'Tekrar alım', value: totals.repeatRevenue || 0 }
  ].filter((row) => row.value > 0);
  return (
    <Box>
      <StatCards items={[['Müşteri', totals.all || 0], ['İlk sipariş', totals.first || 0], ['Tekrar eden', totals.repeat || 0], ['Tekrar ciro', money(totals.repeatRevenue)]]} />
      {!totals.all ? (
        <EmptyNote text="Sipariş veren müşteriler e-posta veya telefona göre burada gruplanır." />
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8, mb: 1.8 }}>
            <ChartCard title="Şehir cirosu" hint="Teslimat şehri.">
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
            <ChartCard title="İlk vs tekrar" hint="Ciro payı.">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
                    {pie.map((row, index) => <Cell key={row.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [money(value), name]} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Box>
          <ReportTable
            columns={['Müşteri', 'Şehir', 'Sipariş', 'Ciro', 'Tür']}
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

function PromosView({ data, q }) {
  const codes = (data?.codes || []).filter((row) => includesQ(q, row.code));
  const mix = [
    { name: 'Kodlu', ...((data?.withPromo) || { orders: 0, revenue: 0 }) },
    { name: 'Kodsuz', ...((data?.withoutPromo) || { orders: 0, revenue: 0 }) }
  ];
  return (
    <Box>
      <StatCards items={[['Kodlu sipariş', data?.withPromo?.orders || 0], ['Kodlu ciro', money(data?.withPromo?.revenue)], ['Kodsuz ciro', money(data?.withoutPromo?.revenue)], ['Kod', codes.length]]} />
      {!codes.length && !(data?.withPromo?.orders || data?.withoutPromo?.orders) ? (
        <EmptyNote text="Kampanya kodu tanımlayıp siparişte kullanıldığında burası dolar." />
      ) : (
        <>
          <Box sx={{ mb: 1.8 }}>
            <ChartCard title="Kodlu vs kodsuz" hint="Ciro karşılaştırması.">
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
            columns={['Kod', '%', 'Sipariş', 'Ciro', 'İndirim', 'Durum']}
            rows={codes.map((row) => (
              <TableRow key={row.id || row.code} hover>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.code}</TableCell>
                <TableCell sx={bodyCell}>{row.percent}</TableCell>
                <TableCell sx={bodyCell}>{row.orders}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
                <TableCell sx={bodyCell}>{money(row.discount)}</TableCell>
                <TableCell sx={bodyCell}>{row.isActive ? 'Aktif' : 'Kapalı'}</TableCell>
              </TableRow>
            ))}
          />
        </>
      )}
    </Box>
  );
}

function FeaturedView({ data, q }) {
  const items = (data?.items || []).filter((row) => includesQ(q, row.title, FEATURED_STATUS[row.status], row.status));
  const totals = data?.totals || {};
  const chart = items.filter((row) => row.spent > 0 || row.revenue > 0).slice(0, 8);
  return (
    <Box>
      <StatCards items={[['Harcama', money(totals.spent)], ['Vitrin cirosu', money(totals.revenue)], ['Yayında', totals.live || 0], ['Talep', items.length]]} />
      {!items.length ? (
        <EmptyNote text="Öne çıkan talebi onaylanınca paket bedeli ile ürün satışı burada kıyaslanır." />
      ) : (
        <>
          {chart.length ? (
            <Box sx={{ mb: 1.8 }}>
              <ChartCard title="Harcama vs satış" hint="Vitrin penceresindeki ürün cirosu." height={320}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid stroke={T.line} horizontal={false} />
                    <XAxis type="number" tick={{ fill: T.muted, fontSize: 11 }} />
                    <YAxis type="category" dataKey="title" width={120} tickFormatter={(value) => shortLabel(value, 14)} tick={{ fill: T.navy, fontSize: 12, fontWeight: 700 }} />
                    <Tooltip formatter={(value) => money(value)} contentStyle={tooltipStyle} />
                    <Bar dataKey="spent" name="Harcama" fill={T.lavender} radius={[0, 10, 10, 0]} />
                    <Bar dataKey="revenue" name="Satış" fill={T.navy} radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Box>
          ) : null}
          <ReportTable
            columns={['Ürün', 'Paket', 'Durum', 'Harcama', 'Satış', 'ROI']}
            rows={items.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={bodyCell}><ProductCell row={row} /></TableCell>
                <TableCell sx={bodyCell}>{row.days} gün</TableCell>
                <TableCell sx={bodyCell}>{FEATURED_STATUS[row.status] || row.status}</TableCell>
                <TableCell sx={bodyCell}>{money(row.spent)}</TableCell>
                <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(row.revenue)}</TableCell>
                <TableCell sx={bodyCell}>{row.roi == null ? '—' : `%${row.roi}`}</TableCell>
              </TableRow>
            ))}
          />
        </>
      )}
    </Box>
  );
}

function QualityView({ data, q }) {
  const ratings = data?.ratings || [];
  const questions = data?.questions || {};
  const products = (data?.products || []).filter((row) => includesQ(q, row.title));
  return (
    <Box>
      <StatCards items={[['Ort. puan', data?.avgRating || 0], ['Yorum', data?.reviewCount || 0], ['Yanıtsız soru', questions.unanswered || 0], ['Ort. yanıt (saat)', questions.avgHours || 0]]} />
      {!data?.reviewCount && !questions.total ? (
        <EmptyNote text="Yorum ve ürün soruları gelince puan dağılımı burada görünür." />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 1fr' }, gap: 1.8, mb: 1.8 }}>
          <ChartCard title="Puan dağılımı" hint="1–5 yıldız.">
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
          <ChartCard title="Soru durumu" hint="Yanıtlanan / açık.">
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
      <ReportTable
        columns={['Ürün', 'Puan', 'Yorum', 'Satış']}
        rows={products.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell sx={bodyCell}><ProductCell row={row} /></TableCell>
            <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{row.rating}</TableCell>
            <TableCell sx={bodyCell}>{row.numReviews}</TableCell>
            <TableCell sx={bodyCell}>{row.qty}</TableCell>
          </TableRow>
        ))}
      />
    </Box>
  );
}

export default function SellerPerformanceReport({ report, query = '' }) {
  const [tab, setTab] = useState('performance');
  const q = query.trim().toLowerCase();
  const current = REPORTS.find((item) => item.id === tab) || REPORTS[0];
  const views = {
    performance: <PerformanceView data={report?.performance} q={q} />,
    timeseries: <TimeView data={report?.timeseries} q={q} />,
    fulfillment: <FulfillmentView data={report?.fulfillment} />,
    payments: <PaymentsView data={report?.payments} />,
    stock: <StockView data={report?.stock} q={q} />,
    variants: <VariantsView data={report?.variants} q={q} />,
    customers: <CustomersView data={report?.customers} q={q} />,
    promos: <PromosView data={report?.promos} q={q} />,
    featured: <FeaturedView data={report?.featured} q={q} />,
    quality: <QualityView data={report?.quality} q={q} />
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
