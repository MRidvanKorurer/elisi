import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { PanelCard, SectionTitle, StatusChip } from './PanelShell';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, T, money, when } from '../utils/panel';
import { sellerShareDisplay } from '../utils/price';
import { matchesCustomerName, matchesHaystack } from '../utils/search';

const STATUS_FILTERS = [
  ['all', 'Tümü'],
  ['processing', 'Hazırlanıyor'],
  ['late', 'Geciken'],
  ['shipped', 'Kargoda'],
  ['delivered', 'Teslim'],
  ['cancelled', 'İptal']
];

const PAYMENT_FILTERS = [
  ['all', 'Tüm ödemeler'],
  ['pending', 'Ödeme bekliyor'],
  ['completed', 'Ödendi'],
  ['failed', 'Başarısız']
];

const chipSx = (active, tone = 'navy') => ({
  fontWeight: 800,
  height: 34,
  bgcolor: active ? (tone === 'rose' ? T.rose : T.navy) : '#fff',
  color: active ? '#fff' : T.navy,
  border: `1px solid ${active ? (tone === 'rose' ? T.rose : T.navy) : T.line}`,
  '&:hover': {
    bgcolor: active ? (tone === 'rose' ? T.rose : T.navy) : T.surfaceSoft
  }
});

function Thumb({ src, size = 40 }) {
  return (
    <Box
      component={src ? 'img' : 'div'}
      src={src || undefined}
      alt=""
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        objectFit: 'cover',
        borderRadius: '10px',
        bgcolor: T.surfaceSoft,
        border: `1px solid ${T.line}`
      }}
    />
  );
}

function OrderCard({ order, updating, onOpen, onStatus }) {
  const name = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Müşteri';
  return (
    <PanelCard
      onClick={() => onOpen(order)}
      sx={{ p: 1.8, cursor: 'pointer', '&:hover': { borderColor: 'rgba(148,109,109,0.35)' } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1.2 }}>
        <Box>
          <Typography sx={{ fontWeight: 900, color: T.navy }}>#{order.code || String(order._id).slice(-6).toUpperCase()}</Typography>
          <Typography sx={{ color: T.muted, fontSize: 12 }}>{when(order.createdAt)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <StatusChip map={ORDER_STATUS} value={order.orderStatus} />
          <StatusChip map={PAYMENT_STATUS} value={order.paymentStatus} />
        </Box>
      </Box>
      <Typography sx={{ fontWeight: 800, color: T.navy }}>{name}</Typography>
      <Typography sx={{ color: T.muted, fontSize: 12, mb: 1.2 }}>
        {[order.customerInfo?.phone, `${order.shippingAddress?.district || ''}/${order.shippingAddress?.city || ''}`.replace(/^\/|\/$/g, '')].filter(Boolean).join(' · ')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', mb: 1.4 }}>
        {(order.orderItems || []).slice(0, 3).map((item, idx) => (
          <Thumb key={`${item.product || item.name}-${idx}`} src={item.image} />
        ))}
        <Typography sx={{ color: T.navy, fontWeight: 700, fontSize: 13 }}>
          {(order.orderItems || []).map((item) => `${item.name} × ${item.quantity}`).join(', ')}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
        <Box>
          <Typography sx={{ fontWeight: 900, color: T.navy }}>{money(sellerShareDisplay(order).net)}</Typography>
          <Typography sx={{ color: T.muted, fontSize: 11 }}>
            {PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod || '—'}
          </Typography>
        </Box>
        <Select
          size="small"
          value={order.orderStatus || 'processing'}
          disabled={updating}
          onClick={(event) => event.stopPropagation()}
          onChange={(e) => onStatus(order._id, e.target.value)}
          sx={{ minWidth: 148, borderRadius: '12px', bgcolor: '#fff' }}
        >
          {Object.entries(ORDER_STATUS).map(([key, text]) => (
            <MenuItem key={key} value={key}>{text}</MenuItem>
          ))}
        </Select>
      </Box>
    </PanelCard>
  );
}

export default function SellerOrders({
  orders = [],
  query = '',
  updatingOrder = '',
  onOpen,
  onStatus
}) {
  const [orderFilter, setOrderFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const stats = useMemo(() => {
    const paid = orders.filter((order) => order.paymentStatus === 'completed' && order.orderStatus !== 'cancelled');
    return {
      total: orders.length,
      processing: orders.filter((order) => order.orderStatus === 'processing').length,
      shipped: orders.filter((order) => order.orderStatus === 'shipped').length,
      late: orders.filter((order) => order.timing?.late && order.orderStatus === 'processing').length,
      pendingPay: orders.filter((order) => order.paymentStatus === 'pending').length,
      net: paid.reduce((sum, order) => sum + Number(sellerShareDisplay(order).net || 0), 0)
    };
  }, [orders]);

  const filtered = useMemo(() => orders.filter((order) => {
    if (orderFilter === 'late' && !(order.timing?.late && order.orderStatus === 'processing')) return false;
    if (orderFilter !== 'all' && orderFilter !== 'late' && order.orderStatus !== orderFilter) return false;
    if (paymentFilter !== 'all' && order.paymentStatus !== paymentFilter) return false;
    if (!query.trim()) return true;
    const items = (order.orderItems || []).map((item) => item.name).join(' ');
    return (
      matchesCustomerName(order.customerInfo, query)
      || matchesHaystack(`${order.customerInfo?.phone || ''} ${order.customerInfo?.email || ''}`, query)
      || matchesHaystack(`${order.shippingAddress?.city || ''} ${order.shippingAddress?.district || ''}`, query)
      || matchesHaystack(`${order.code || ''} ${order._id || ''} ${items}`, query)
    );
  }), [orders, orderFilter, paymentFilter, query]);

  const emptyHint = query.trim()
    ? 'Aramaya uygun sipariş yok.'
    : 'Bu filtrede sipariş yok.';

  return (
    <Box>
      <SectionTitle
        overline="SATIŞLAR"
        title="Siparişlerim"
        subtitle="Adresi ve tahsilatı gör, sipariş durumunu buradan güncelle."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(5, minmax(0, 1fr))' }, gap: 1.2, mb: 2 }}>
        {[
          ['all', 'Toplam', stats.total, `${stats.total} kayıt`, 'navy'],
          ['processing', 'Hazırlanan', stats.processing, stats.late ? `${stats.late} gecikmiş` : 'açık iş', 'navy'],
          ['shipped', 'Kargoda', stats.shipped, 'yolda', 'navy'],
          ['pendingPay', 'Ödeme bekleyen', stats.pendingPay, 'tahsilat', 'rose'],
          ['net', 'Net tahsilat', money(stats.net), 'ödenenler', 'navy']
        ].map(([id, title, value, hint, tone]) => (
          <PanelCard
            key={id}
            onClick={() => {
              if (id === 'pendingPay') {
                setPaymentFilter('pending');
                setOrderFilter('all');
                return;
              }
              if (id === 'net') return;
              setOrderFilter(id);
            }}
            sx={{
              py: 1.5,
              px: 1.7,
              minWidth: 0,
              cursor: id === 'net' ? 'default' : 'pointer',
              outline: (id === 'pendingPay' ? paymentFilter === 'pending' : orderFilter === id) ? `2px solid ${tone === 'rose' ? T.rose : T.navy}` : 'none'
            }}
          >
            <Typography sx={{ color: T.muted, fontWeight: 800, fontSize: 12 }}>{title}</Typography>
            <Typography noWrap sx={{ fontWeight: 900, color: T.navy, fontSize: { xs: '1.05rem', md: '1.2rem' }, mt: 0.3 }}>
              {value}
            </Typography>
            <Typography sx={{ color: T.muted, fontSize: 11 }}>{hint}</Typography>
          </PanelCard>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 1.2 }}>
        {STATUS_FILTERS.map(([id, label]) => (
          <Chip
            key={id}
            clickable
            label={id === 'late' && stats.late ? `${label} (${stats.late})` : label}
            onClick={() => setOrderFilter(id)}
            sx={chipSx(orderFilter === id)}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2 }}>
        {PAYMENT_FILTERS.map(([id, label]) => (
          <Chip
            key={id}
            clickable
            label={label}
            onClick={() => setPaymentFilter(id)}
            sx={chipSx(paymentFilter === id, 'rose')}
          />
        ))}
        <Typography sx={{ ml: { md: 'auto' }, color: T.muted, fontWeight: 700, fontSize: 13, alignSelf: 'center' }}>
          {filtered.length} / {orders.length} sipariş
        </Typography>
      </Box>

      <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.2 }}>
        {filtered.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            updating={updatingOrder === order._id}
            onOpen={onOpen}
            onStatus={onStatus}
          />
        ))}
        {filtered.length === 0 ? (
          <PanelCard>
            <Typography sx={{ color: T.muted, fontWeight: 700 }}>{emptyHint}</Typography>
          </PanelCard>
        ) : null}
      </Box>

      <PanelCard sx={{ p: 0, overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
        <Table sx={{ minWidth: 860, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              {[
                ['Sipariş', '15%'],
                ['Müşteri', '20%'],
                ['Ürünler', '27%'],
                ['Tahsilat', '16%'],
                ['Durum', '14%'],
                ['', '8%']
              ].map(([h, width]) => (
                <TableCell
                  key={h || 'act'}
                  sx={{
                    fontWeight: 800,
                    color: T.muted,
                    fontSize: '0.78rem',
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    borderBottom: `1px solid ${T.line}`,
                    bgcolor: T.surfaceSoft,
                    width
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((order) => {
              const name = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Müşteri';
              return (
                <TableRow key={order._id} hover sx={{ cursor: 'pointer' }} onClick={() => onOpen(order)}>
                  <TableCell sx={{ borderBottom: `1px solid ${T.line}`, color: T.navy, verticalAlign: 'top' }}>
                    <Typography sx={{ fontWeight: 900 }}>#{order.code || String(order._id).slice(-6).toUpperCase()}</Typography>
                    <Typography sx={{ fontSize: 12, color: T.muted }}>{when(order.createdAt)}</Typography>
                    {order.timing?.late && order.orderStatus === 'processing' ? (
                      <Typography sx={{ fontSize: 11, color: '#8A5A21', fontWeight: 800 }}>Gecikmiş</Typography>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${T.line}`, color: T.navy, verticalAlign: 'top' }}>
                    <Typography sx={{ fontWeight: 800 }}>{name}</Typography>
                    <Typography sx={{ fontSize: 12, color: T.muted }}>{order.customerInfo?.phone || '—'}</Typography>
                    <Typography noWrap sx={{ fontSize: 12, color: T.muted }}>
                      {[order.shippingAddress?.district, order.shippingAddress?.city].filter(Boolean).join(' / ') || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${T.line}`, color: T.navy, verticalAlign: 'top' }}>
                    <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start', minWidth: 0 }}>
                      {(order.orderItems || []).slice(0, 2).map((item, idx) => (
                        <Thumb key={`${item.product || item.name}-${idx}`} src={item.image} size={36} />
                      ))}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        {(order.orderItems || []).slice(0, 2).map((item, idx) => (
                          <Typography key={`${item.name}-${idx}`} noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                            {item.name} × {item.quantity}
                          </Typography>
                        ))}
                        {(order.orderItems || []).length > 2 ? (
                          <Typography sx={{ fontSize: 11, color: T.muted }}>+{(order.orderItems || []).length - 2} kalem</Typography>
                        ) : null}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${T.line}`, color: T.navy, verticalAlign: 'top' }}>
                    <Typography sx={{ fontWeight: 900 }}>{money(sellerShareDisplay(order).net)}</Typography>
                    <Typography sx={{ fontSize: 11, color: T.muted }}>satış {money(order.sellerTotal)}</Typography>
                    <Box sx={{ mt: 0.6 }}>
                      <StatusChip map={PAYMENT_STATUS} value={order.paymentStatus} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${T.line}`, color: T.navy, verticalAlign: 'top' }} onClick={(event) => event.stopPropagation()}>
                    <Select
                      size="small"
                      fullWidth
                      value={order.orderStatus || 'processing'}
                      disabled={updatingOrder === order._id}
                      onChange={(e) => onStatus(order._id, e.target.value)}
                      sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                    >
                      {Object.entries(ORDER_STATUS).map(([key, text]) => (
                        <MenuItem key={key} value={key}>{text}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ borderBottom: `1px solid ${T.line}` }}>
                    <Button onClick={(event) => { event.stopPropagation(); onOpen(order); }} sx={{ fontWeight: 800, color: T.rose, minWidth: 0, px: 1 }}>
                      Detay
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ borderBottom: 'none', color: T.muted, fontWeight: 700, py: 3 }}>
                  {emptyHint}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </PanelCard>
    </Box>
  );
}
