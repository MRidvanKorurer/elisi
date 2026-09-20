import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Typography
} from '@mui/material';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import { StatusChip, primaryButton } from './PanelShell';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, T, money } from '../utils/panel';
import { lineTotalOf, sellerShareDisplay } from '../utils/price';
import OrderMakerThread from './OrderMakerThread';

const whenFull = (value) =>
  value
    ? new Date(value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : '—';

const phoneHref = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const intl = digits.startsWith('90') ? digits : `90${digits.replace(/^0/, '')}`;
  return `tel:+${intl}`;
};

const waHref = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const intl = digits.startsWith('90') ? digits : `90${digits.replace(/^0/, '')}`;
  return `https://wa.me/${intl}`;
};

function CopyButton({ value, label, onCopied }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <Tooltip title={done ? 'Kopyalandı' : `${label} kopyala`}>
      <IconButton
        size="small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(String(value));
            setDone(true);
            onCopied?.(`${label} kopyalandı.`);
            window.setTimeout(() => setDone(false), 1600);
          } catch {
            onCopied?.('Kopyalanamadı.');
          }
        }}
        sx={{ color: T.rose }}
      >
        {done ? <CheckRounded fontSize="small" /> : <ContentCopyRounded fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

function Row({ label, value, strong, rose, hint }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.55, alignItems: 'baseline' }}>
      <Typography sx={{ color: rose ? T.rose : T.muted, fontWeight: strong ? 900 : 700, fontSize: strong ? '0.95rem' : '0.84rem' }}>
        {label}
      </Typography>
      <Box sx={{ textAlign: 'right' }}>
        <Typography sx={{ color: rose ? T.rose : T.navy, fontWeight: 900 }}>{value}</Typography>
        {hint ? <Typography sx={{ color: T.muted, fontSize: 11 }}>{hint}</Typography> : null}
      </Box>
    </Box>
  );
}

function Timeline({ order }) {
  const timing = order.timing || {};
  const steps = [
    { key: 'created', label: 'Sipariş alındı', at: order.createdAt, done: true },
    { key: 'processing', label: 'Hazırlanıyor', at: timing.processingAt, done: Boolean(timing.processingAt || order.orderStatus) },
    { key: 'shipped', label: 'Kargoya verildi', at: timing.shippedAt, done: Boolean(timing.shippedAt) },
    { key: 'delivered', label: 'Teslim edildi', at: timing.deliveredAt, done: Boolean(timing.deliveredAt) }
  ];
  if (order.orderStatus === 'cancelled') {
    steps.push({ key: 'cancelled', label: 'İptal', at: timing.cancelledAt, done: true });
  }
  return (
    <Box sx={{ display: 'grid', gap: 0, mb: 2.2, pl: 0.4 }}>
      {steps.map((step, index) => (
        <Box key={step.key} sx={{ display: 'flex', gap: 1.2, alignItems: 'stretch' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                mt: 0.45,
                bgcolor: step.done ? (step.key === 'cancelled' ? '#96393C' : T.rose) : T.line
              }}
            />
            {index < steps.length - 1 ? (
              <Box sx={{ width: 2, flex: 1, minHeight: 18, bgcolor: T.line, my: 0.4 }} />
            ) : null}
          </Box>
          <Box sx={{ pb: index < steps.length - 1 ? 1.2 : 0 }}>
            <Typography sx={{ fontWeight: 800, color: step.done ? T.navy : T.muted, fontSize: 13 }}>{step.label}</Typography>
            <Typography sx={{ color: T.muted, fontSize: 12 }}>{step.at ? whenFull(step.at) : 'Bekleniyor'}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function SellerOrderDetail({
  order,
  onClose,
  onStatus,
  updating,
  onFlash,
  onReply
}) {
  if (!order) return null;
  const name = `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Müşteri';
  const address = [
    order.shippingAddress?.address,
    [order.shippingAddress?.district, order.shippingAddress?.city].filter(Boolean).join(' / ')
  ].filter(Boolean).join(', ');
  const share = sellerShareDisplay(order);
  const net = share.net;
  const call = phoneHref(order.customerInfo?.phone);
  const wa = waHref(order.customerInfo?.phone);
  const late = Boolean(order.timing?.late && order.orderStatus === 'processing');

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" slotProps={{ paper: { sx: { borderRadius: '24px' } } }}>
      <DialogTitle sx={{ fontWeight: 900, color: T.navy, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Box>
            Sipariş #{order.code || String(order._id).slice(-6).toUpperCase()}
            <Typography sx={{ color: T.muted, fontWeight: 700, fontSize: 13, mt: 0.4 }}>
              {whenFull(order.createdAt)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
            <StatusChip map={ORDER_STATUS} value={order.orderStatus} />
            <StatusChip map={PAYMENT_STATUS} value={order.paymentStatus} />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {late ? (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '14px' }}>
            Bu sipariş 3 günden uzun süredir hazırlanıyor
            {order.timing?.daysWaiting != null ? ` (${order.timing.daysWaiting} gün).` : '.'} Kargoya vermeyi unutma.
          </Alert>
        ) : null}
        {order.paymentStatus === 'failed' ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>
            Ödeme başarısız. Bu sipariş kargoya verilemez.
          </Alert>
        ) : null}
        {order.paymentStatus === 'pending' ? (
          <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
            Ödeme henüz tamamlanmadı ({PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod}). Üretime başlamadan önce ödemeyi kontrol et.
          </Alert>
        ) : null}
        {order.mixedCart ? (
          <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
            Bu sepette başka atölyelerin ürünü de var. Sen yalnızca kendi kalemlerini hazırlarsın.
          </Alert>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.92fr 1.08fr' }, gap: 2.2 }}>
          <Box>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Süreç</Typography>
            <Timeline order={order} />

            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Müşteri</Typography>
            <Box sx={{ p: 1.6, borderRadius: '16px', bgcolor: T.surfaceSoft, border: `1px solid ${T.line}`, mb: 1.8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 900, color: T.navy }}>{name}</Typography>
                <CopyButton value={name} label="Ad" onCopied={onFlash} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.6 }}>
                <PhoneOutlined sx={{ fontSize: 16, color: T.muted }} />
                <Typography sx={{ color: T.navy, fontWeight: 700, flex: 1 }}>{order.customerInfo?.phone || '—'}</Typography>
                <CopyButton value={order.customerInfo?.phone} label="Telefon" onCopied={onFlash} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4 }}>
                <EmailOutlined sx={{ fontSize: 16, color: T.muted }} />
                <Typography sx={{ color: T.navy, fontWeight: 700, flex: 1, wordBreak: 'break-all' }}>{order.customerInfo?.email || '—'}</Typography>
                <CopyButton value={order.customerInfo?.email} label="E-posta" onCopied={onFlash} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1.4, flexWrap: 'wrap' }}>
                {call ? (
                  <Button href={call} sx={{ ...primaryButton, px: 1.6 }}>Ara</Button>
                ) : null}
                {wa ? (
                  <Button href={wa} target="_blank" rel="noreferrer" sx={{ fontWeight: 800, color: T.rose }}>
                    WhatsApp
                  </Button>
                ) : null}
                {order.customerInfo?.email ? (
                  <Button href={`mailto:${order.customerInfo.email}`} sx={{ fontWeight: 800, color: T.navy }}>
                    E-posta yaz
                  </Button>
                ) : null}
              </Box>
            </Box>

            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Teslimat</Typography>
            <Box sx={{ p: 1.6, borderRadius: '16px', bgcolor: T.surfaceSoft, border: `1px solid ${T.line}` }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <PlaceOutlined sx={{ color: T.rose, mt: 0.2 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, color: T.navy }}>{address || 'Adres yok'}</Typography>
                  <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.4 }}>
                    {order.shippingAddress?.district}/{order.shippingAddress?.city}
                    {order.shippingCost > 0 ? ` · müşteri kargo ${money(order.shippingCost)} ödedi` : ' · kargo müşteriye ücretsiz'}
                  </Typography>
                </Box>
                <CopyButton value={address} label="Adres" onCopied={onFlash} />
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Ürünlerin</Typography>
            {(order.orderItems || []).map((item, idx) => (
              <Box key={`${item.product || item.name}-${idx}`} sx={{ display: 'flex', gap: 1.2, alignItems: 'center', py: 1, borderBottom: `1px solid ${T.line}` }}>
                {item.image ? (
                  <Box component="img" src={item.image} alt="" sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '14px', bgcolor: T.surfaceSoft }} />
                ) : (
                  <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: T.surfaceSoft }} />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: T.navy, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: T.muted }}>
                    {[item.color, item.size, `${item.quantity} adet`, money(item.price)].filter(Boolean).join(' · ')}
                  </Typography>
                  {item.immediateDelivery === false || item.customProductionTime ? (
                    <Typography sx={{ fontSize: 12, color: T.rose, fontWeight: 700, mt: 0.2 }}>
                      {item.immediateDelivery === false
                        ? `Sipariş üzerine · ${item.customProductionTime || 'süre üründe'}`
                        : 'Hemen kargoda'}
                    </Typography>
                  ) : item.immediateDelivery ? (
                    <Typography sx={{ fontSize: 12, color: '#3F6B47', fontWeight: 700, mt: 0.2 }}>Hemen kargoda</Typography>
                  ) : null}
                </Box>
                <Typography sx={{ fontWeight: 900, color: T.navy }}>{money(lineTotalOf(item))}</Typography>
              </Box>
            ))}

            <Box sx={{ mt: 1.6, p: 1.6, borderRadius: '16px', bgcolor: T.surfaceSoft, border: `1px solid ${T.line}` }}>
              <Row label="Ürün tutarı" value={money(share.goods)} />
              {order.sellerPromoDiscount > 0 ? (
                <Row
                  label={`Senin kampanyan${order.promoCode ? ` (${order.promoCode})` : ''}`}
                  value={`−${money(order.sellerPromoDiscount)}`}
                  rose
                  hint="Bu indirim senin tahsilatından düşer"
                />
              ) : null}
              {order.platformPromoDiscount > 0 ? (
                <Row
                  label="Site / hoş geldin indirimi"
                  value={money(order.platformPromoDiscount)}
                  hint="Bunu platform karşılar, senin payın düşmez"
                />
              ) : null}
              <Row
                label="Alıcı kargosu"
                value={share.shipping > 0 ? money(share.shipping) : 'Ücretsiz'}
                hint={share.shipping > 0 ? 'Komisyona dahil' : 'Komisyon yalnızca üründen'}
              />
              <Row
                label={`Platform payı (%${share.percent})`}
                value={money(share.fee)}
                rose
                hint={
                  share.shipping > 0
                    ? `Kargo dahil ${money(share.gross)} üzerinden`
                    : `${money(share.gross)} ürün tutarı üzerinden`
                }
              />
              <Row label="Sana kalan" value={money(share.net)} strong />
            </Box>

            <Typography sx={{ color: T.muted, fontSize: 13, mt: 1.6, mb: 1 }}>
              Ödeme: {PAYMENT_STATUS[order.paymentStatus] || order.paymentStatus}
              {order.paymentMethod ? ` · ${PAYMENT_METHOD[order.paymentMethod] || order.paymentMethod}` : ''}
              {order.qty ? ` · ${order.qty} ürün` : ''}
            </Typography>

            {order.timing?.daysToShip != null ? (
              <Typography sx={{ color: T.muted, fontSize: 12, mb: 1.2 }}>
                Kargoya {order.timing.daysToShip} günde çıktı
                {order.timing.daysToDeliver != null ? ` · teslim ${order.timing.daysToDeliver} gün` : ''}
              </Typography>
            ) : order.timing?.daysWaiting != null ? (
              <Typography sx={{ color: T.muted, fontSize: 12, mb: 1.2 }}>
                {order.timing.daysWaiting} gündür hazırlanıyor
              </Typography>
            ) : null}

            <Select
              fullWidth
              size="small"
              value={order.orderStatus || 'processing'}
              disabled={updating}
              onChange={(e) => onStatus?.(order._id, e.target.value)}
              sx={{ borderRadius: '12px', bgcolor: '#fff' }}
            >
              {Object.entries(ORDER_STATUS).map(([key, text]) => (
                <MenuItem key={key} value={key}>{text}</MenuItem>
              ))}
            </Select>
            <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.8 }}>
              Hazırlanıyor → kargoda → teslim. İptal yalnızca gönderemeyeceksen.
            </Typography>
            <OrderMakerThread
              items={order.orderItems}
              notes={order.makerNotes}
              viewer="seller"
              canReply={order.orderStatus !== 'cancelled'}
              onSend={onReply}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.2, gap: 1, flexWrap: 'wrap' }}>
        <Button
          onClick={async () => {
            const summary = [
              `Sipariş #${order.code || ''}`,
              name,
              order.customerInfo?.phone,
              address,
              (order.orderItems || []).map((item) => `${item.name} × ${item.quantity}`).join(', '),
              `Net ${money(net)}`
            ].filter(Boolean).join('\n');
            try {
              await navigator.clipboard.writeText(summary);
              onFlash?.('Sipariş özeti kopyalandı.');
            } catch {
              onFlash?.('Kopyalanamadı.');
            }
          }}
          sx={{ fontWeight: 800, color: T.navy }}
        >
          Özeti kopyala
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={{ fontWeight: 800, color: T.muted }}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
}
