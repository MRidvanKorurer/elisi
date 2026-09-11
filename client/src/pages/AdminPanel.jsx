import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import MovieFilterOutlined from '@mui/icons-material/MovieFilterOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import PendingActionsOutlined from '@mui/icons-material/PendingActionsOutlined';
import PanelShell, { PanelCard, SectionTitle, StatusChip, fieldSx, primaryButton } from '../components/PanelShell';
import ImageUploader from '../components/ImageUploader';
import { adminService } from '../api/adminService';
import { promoService } from '../api/promoService';
import { lookbookService, mediaUrl } from '../api/lookbookService';
import { isSuperAdmin } from '../utils/roles';
import { toRelativeUpload } from '../utils/media';
import {
  APPROVAL_STATUS,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  SELLER_STATUS,
  T,
  money,
  when
} from '../utils/panel';
import { CATEGORY_OPTIONS, categoryLabel } from '../utils/categories';
import { FEATURED_STATUS, isReceiptPdf } from '../utils/featured';
import { lineTotalOf, orderChargeRows } from '../utils/price';

const emptyForm = {
  title: '',
  description: '',
  category: '',
  price: '',
  stock: '',
  discountPercentage: 0,
  colors: '',
  sizes: '',
  isActive: true,
  isSponsored: false,
  measureNote: '',
  customProductionTime: '1-3 İş Günü',
  video: ''
};

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

function StatCard({ icon: Icon, title, value, hint, tone = T.rose }) {
  return (
    <PanelCard sx={{ display: 'flex', gap: 1.6, alignItems: 'flex-start' }}>
      <Box sx={{ width: 44, height: 44, borderRadius: '14px', display: 'grid', placeItems: 'center', bgcolor: `${tone}22`, color: tone, flexShrink: 0 }}>
        <Icon />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: T.muted, fontWeight: 800, fontSize: '0.78rem' }}>{title}</Typography>
        <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: T.navy, lineHeight: 1.25 }}>{value}</Typography>
        <Typography sx={{ color: 'rgba(110,82,82,0.7)', fontSize: '0.75rem' }}>{hint}</Typography>
      </Box>
    </PanelCard>
  );
}

export default function AdminPanel({ user, handleLogout }) {
  const [view, setView] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lookbook, setLookbook] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [label, setLabel] = useState('');
  const [video, setVideo] = useState(null);
  const [poster, setPoster] = useState(null);
  const [saving, setSaving] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [mainImage, setMainImage] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [keptImages, setKeptImages] = useState([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const [openOrder, setOpenOrder] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [promos, setPromos] = useState([]);
  const [promoForm, setPromoForm] = useState({ code: '', percent: 5, minSubtotal: 5000, note: '', isActive: true });
  const [savingPromo, setSavingPromo] = useState(false);
  const [featuredRequests, setFeaturedRequests] = useState([]);
  const [featuredFilter, setFeaturedFilter] = useState('pending');
  const [featuredRejecting, setFeaturedRejecting] = useState(null);
  const [featuredRejectReason, setFeaturedRejectReason] = useState('');
  const [featuredReceiptView, setFeaturedReceiptView] = useState(null);
  const [featuredRemoving, setFeaturedRemoving] = useState(null);
  const [featuredRemoveReason, setFeaturedRemoveReason] = useState('');

  const load = async () => {
    try {
      const [ov, us, se, pr, lb, or, pm, ft] = await Promise.all([
        adminService.overview(),
        adminService.users(),
        adminService.sellers(),
        adminService.products(),
        lookbookService.list(true),
        adminService.orders(),
        promoService.list().catch(() => ({ promos: [] })),
        adminService.featured().catch(() => ({ requests: [] }))
      ]);
      setOverview(ov.overview);
      setUsers(us.users || []);
      setSellers(se.sellers || []);
      setProducts(pr.products || []);
      setLookbook(lb.items || []);
      setOrders(or.orders || []);
      setPromos(pm.promos || []);
      setFeaturedRequests(ft.requests || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.mesaj || 'Admin verileri yüklenemedi.');
    }
  };

  useEffect(() => {
    if (isSuperAdmin(user?.rol)) load();
  }, [user]);

  const q = query.trim().toLowerCase();
  const pendingProducts = useMemo(() => products.filter((p) => p.approvalStatus === 'pending'), [products]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchFilter =
          orderFilter === 'all' ||
          (orderFilter === 'pay_pending' && order.paymentStatus === 'pending') ||
          order.orderStatus === orderFilter;
        const hay = `${order.customerInfo?.firstName} ${order.customerInfo?.lastName} ${order.customerInfo?.email} ${order._id}`.toLowerCase();
        return matchFilter && (!q || hay.includes(q));
      }),
    [orders, orderFilter, q]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        const matchFilter =
          productFilter === 'all' ||
          (productFilter === 'live' && p.isActive) ||
          (productFilter === 'hidden' && !p.isActive) ||
          (productFilter === 'low' && p.stock <= 5) ||
          p.approvalStatus === productFilter;
        return matchFilter && (!q || `${p.title} ${p.category} ${p.productCode}`.toLowerCase().includes(q));
      }),
    [products, productFilter, q]
  );

  const filteredUsers = useMemo(
    () => users.filter((u) => !q || `${u.adSoyad} ${u.email}`.toLowerCase().includes(q)),
    [users, q]
  );
  const filteredSellers = useMemo(
    () => sellers.filter((s) => !q || `${s.magazaAdi} ${s.user?.email} ${s.sehir}`.toLowerCase().includes(q)),
    [sellers, q]
  );

  if (!user) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin(user.rol)) return <Navigate to="/" replace />;

  const flash = (text) => {
    setMessage(text);
    setError('');
  };
  const fail = (err, fallback) => setError(err.response?.data?.mesaj || fallback);

  const handleStatus = async (id, durum) => {
    try {
      await adminService.setSellerStatus(id, { durum });
      flash('Mağaza durumu güncellendi.');
      await load();
    } catch (err) {
      fail(err, 'Güncellenemedi.');
    }
  };

  const handleRole = async (id, rol) => {
    try {
      await adminService.setUserRole(id, rol);
      flash('Kullanıcı rolü güncellendi.');
      await load();
    } catch (err) {
      fail(err, 'Rol güncellenemedi.');
    }
  };

  const savePromo = async (event) => {
    event.preventDefault();
    try {
      setSavingPromo(true);
      await promoService.create({
        code: promoForm.code,
        percent: Number(promoForm.percent),
        minSubtotal: Number(promoForm.minSubtotal) || 0,
        note: promoForm.note,
        isActive: promoForm.isActive
      });
      setPromoForm({ code: '', percent: 5, minSubtotal: 5000, note: '', isActive: true });
      flash('Kampanya kodu eklendi.');
      await load();
    } catch (err) {
      fail(err, 'Kampanya eklenemedi.');
    } finally {
      setSavingPromo(false);
    }
  };

  const togglePromo = async (promo) => {
    try {
      await promoService.update(promo.id, { isActive: !promo.isActive });
      flash(promo.isActive ? 'Kampanya durduruldu.' : 'Kampanya açıldı.');
      await load();
    } catch (err) {
      fail(err, 'Kampanya güncellenemedi.');
    }
  };

  const removePromo = async (promo) => {
    try {
      await promoService.remove(promo.id);
      flash('Kampanya kodu silindi.');
      await load();
    } catch (err) {
      fail(err, 'Kampanya silinemedi.');
    }
  };

  const setApproval = async (id, approvalStatus, rejectionReason = '') => {
    try {
      await adminService.setProductApproval(id, { approvalStatus, rejectionReason });
      flash(approvalStatus === 'approved' ? 'Ürün yayına alındı.' : 'Ürün reddedildi.');
      await load();
    } catch (err) {
      fail(err, 'Ürün onaylanamadı.');
    }
  };

  const reviewFeatured = async (id, status, rejectionReason = '') => {
    try {
      await adminService.reviewFeatured(id, { status, rejectionReason });
      flash(status === 'approved' ? 'Ürün önerilenlere alındı.' : 'Talep reddedildi.');
      setFeaturedRejecting(null);
      setFeaturedRejectReason('');
      await load();
    } catch (err) {
      fail(err, 'Talep güncellenemedi.');
    }
  };

  const removeFeatured = async () => {
    if (!featuredRemoving) return;
    try {
      await adminService.removeFeatured(featuredRemoving.id, { note: featuredRemoveReason });
      flash('Ürün önerilenlerden kaldırıldı.');
      setFeaturedRemoving(null);
      setFeaturedRemoveReason('');
      await load();
    } catch (err) {
      fail(err, 'Ürün vitrinden alınamadı.');
    }
  };

  const openProduct = (product) => {
    setEditing(product);
    setForm({
      title: product.title || '',
      description: product.description || '',
      category: product.category || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      discountPercentage: product.discountPercentage || 0,
      colors: (product.colors || []).join(', '),
      sizes: (product.sizes || []).join(', '),
      isActive: Boolean(product.isActive),
      isSponsored: Boolean(product.isSponsored),
      measureNote: product.measureNote || '',
      customProductionTime: product.customProductionTime || '1-3 İş Günü',
      video: product.video || ''
    });
    setMainImage(null);
    setGallery([]);
    setKeptImages(product.additionalImages || []);
  };

  const closeProduct = () => {
    setEditing(null);
    setMainImage(null);
    setGallery([]);
  };

  const saveProduct = async () => {
    if (!editing) return;
    setSavingProduct(true);
    try {
      const body = new FormData();
      body.append('title', form.title);
      body.append('description', form.description);
      body.append('category', form.category);
      body.append('price', form.price);
      body.append('stock', form.stock);
      body.append('discountPercentage', form.discountPercentage || 0);
      body.append('colors', form.colors);
      body.append('sizes', form.sizes);
      body.append('measureNote', form.measureNote);
      body.append('customProductionTime', form.customProductionTime);
      body.append('video', form.video);
      body.append('isActive', String(form.isActive));
      body.append('isSponsored', String(form.isSponsored));

      const removed = (editing.additionalImages || []).filter((url) => !keptImages.includes(url));
      if (removed.length) body.append('removeImages', removed.map(toRelativeUpload).join(','));
      if (mainImage?.file) body.append('image', mainImage.file);
      gallery.forEach((item) => body.append('gallery', item.file));

      await adminService.updateProduct(editing._id, body);
      flash('Ürün güncellendi.');
      closeProduct();
      await load();
    } catch (err) {
      fail(err, 'Ürün güncellenemedi.');
    } finally {
      setSavingProduct(false);
    }
  };

  const updateOrder = async (id, payload) => {
    try {
      await adminService.updateOrder(id, payload);
      flash('Sipariş güncellendi.');
      await load();
      if (openOrder?._id === id) setOpenOrder((prev) => (prev ? { ...prev, ...payload } : prev));
    } catch (err) {
      fail(err, 'Sipariş güncellenemedi.');
    }
  };

  const handleLookbook = async (event) => {
    event.preventDefault();
    if (!video) {
      setError('Video seçin.');
      return;
    }
    setSaving(true);
    try {
      const body = new FormData();
      body.append('label', label || 'Lookbook');
      body.append('video', video);
      if (poster) body.append('poster', poster);
      await lookbookService.create(body);
      setLabel('');
      setVideo(null);
      setPoster(null);
      event.target.reset();
      flash('Video eklendi.');
      await load();
    } catch (err) {
      fail(err, 'Video yüklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const goView = (id) => {
    setView(id);
    setQuery('');
    setMobileOpen(false);
  };

  const nav = [
    { id: 'dashboard', label: 'Ana sayfa', icon: DashboardOutlined },
    { id: 'orders', label: 'Siparişler', icon: ReceiptLongOutlined, badge: overview?.processing || 0 },
    { id: 'approvals', label: 'Onay kuyruğu', icon: FactCheckOutlined, badge: pendingProducts.length },
    { id: 'featured', label: 'Öne çıkanlar', icon: AutoAwesomeOutlined, badge: overview?.pendingFeatured || featuredRequests.filter((item) => item.status === 'pending').length },
    { id: 'products', label: 'Ürünler', icon: Inventory2Outlined },
    { id: 'sellers', label: 'Satıcılar', icon: StorefrontOutlined, badge: overview?.pendingSellers || 0 },
    { id: 'customers', label: 'Müşteriler', icon: PeopleAltOutlined },
    { id: 'lookbook', label: 'İçerik', icon: MovieFilterOutlined },
    { id: 'promos', label: 'Kampanyalar', icon: LocalOfferOutlined },
    { id: 'settings', label: 'Ayarlar', icon: SettingsOutlined }
  ];

  const maxSale = Math.max(1, ...(overview?.salesByDay || []).map((d) => d.total));
  const pendingActions = [
    { label: 'Ödeme bekleyen sipariş', value: overview?.pendingPayment || 0, view: 'orders' },
    { label: 'Hazırlanacak sipariş', value: overview?.processing || 0, view: 'orders' },
    { label: 'Onay bekleyen ürün', value: pendingProducts.length, view: 'approvals' },
    { label: 'Öne çıkan talebi', value: overview?.pendingFeatured || featuredRequests.filter((item) => item.status === 'pending').length, view: 'featured' },
    { label: 'Satıcı başvurusu', value: overview?.pendingSellers || 0, view: 'sellers' },
    { label: 'Kritik stok', value: overview?.lowStock || 0, view: 'products' }
  ];

  return (
    <PanelShell
      nav={nav}
      view={view}
      onView={goView}
      user={user}
      roleLabel="Yönetim paneli"
      handleLogout={handleLogout}
      query={query}
      setQuery={setQuery}
      searchPlaceholder="Sipariş, ürün, müşteri veya mağaza ara"
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
    >
      {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2, borderRadius: '14px' }} onClose={() => setMessage('')}>{message}</Alert> : null}

      {view === 'dashboard' && overview && (
        <Box>
          <SectionTitle
            overline="SÜPER ADMİN"
            title="Günlük durum"
            subtitle="Ödeme onayı, ürün incelemesi ve satıcı başvurularını buradan yönetin. Sipariş kargosunu satıcı ilerletir."
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.8, mb: 2 }}>
            <StatCard icon={ShoppingBagOutlined} title="Bugünkü sipariş" value={overview.todayOrders} hint="Adet" tone={T.navy} />
            <StatCard icon={PaymentsOutlined} title="Bugünkü ciro" value={money(overview.todayRevenue)} hint="Tahsil edilen" tone={T.rose} />
            <StatCard icon={TrendingUpRounded} title="Toplam ciro" value={money(overview.revenue)} hint={`${overview.paidOrders} ödenen sipariş`} tone={T.lavender} />
            <StatCard icon={PendingActionsOutlined} title="Onay bekleyen ürün" value={pendingProducts.length} hint="Satıcı gönderimi" tone="#C08A4A" />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 1.8, mb: 1.8 }}>
            <PanelCard>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 2 }}>Son 7 gün satış</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.2, height: 190 }}>
                {(overview.salesByDay || []).map((day) => (
                  <Box key={day.date} sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: T.muted, mb: 0.6, height: 16 }}>
                      {day.total ? money(day.total) : ''}
                    </Typography>
                    <Box sx={{ height: 120, display: 'flex', alignItems: 'flex-end' }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: `${Math.max(6, (day.total / maxSale) * 100)}%`,
                          background: day.total
                            ? `linear-gradient(180deg, ${T.lavender} 0%, ${T.rose} 100%)`
                            : 'rgba(148,109,109,0.16)',
                          borderRadius: '12px 12px 6px 6px'
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 800, mt: 1, color: T.muted }}>{day.label}</Typography>
                  </Box>
                ))}
              </Box>
            </PanelCard>

            <PanelCard>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1.4 }}>Bekleyen aksiyonlar</Typography>
              {pendingActions.map((item) => (
                <Box
                  key={item.label}
                  onClick={() => goView(item.view)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.15,
                    px: 1,
                    mx: -1,
                    borderRadius: '12px',
                    borderBottom: `1px solid ${T.line}`,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: T.surfaceSoft }
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: T.navy }}>{item.label}</Typography>
                  <Chip
                    size="small"
                    label={item.value}
                    sx={{ fontWeight: 900, bgcolor: item.value ? 'rgba(148,109,109,0.16)' : 'rgba(46,59,85,0.06)', color: item.value ? T.rose : T.muted }}
                  />
                </Box>
              ))}
            </PanelCard>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 1.8 }}>
            <PanelCard sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ px: 2.6, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 900, color: T.navy }}>Son siparişler</Typography>
                <Button onClick={() => goView('orders')} sx={{ fontWeight: 800, color: T.rose }}>Tümü</Button>
              </Box>
              <Table size="small">
                <TableBody>
                  {(overview.recentOrders || []).map((order) => (
                    <TableRow key={order._id} hover sx={{ cursor: 'pointer' }} onClick={() => { setOpenOrder(order); goView('orders'); }}>
                      <TableCell sx={bodyCell}>
                        <Typography sx={{ fontWeight: 800 }}>{order.customerInfo?.firstName} {order.customerInfo?.lastName}</Typography>
                        <Typography sx={{ fontSize: 12, color: T.muted }}>{when(order.createdAt)}</Typography>
                      </TableCell>
                      <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(order.totalPrice)}</TableCell>
                      <TableCell sx={bodyCell}><StatusChip map={ORDER_STATUS} value={order.orderStatus} /></TableCell>
                    </TableRow>
                  ))}
                  {(overview.recentOrders || []).length === 0 && (
                    <TableRow><TableCell sx={{ ...bodyCell, color: T.muted }}>Henüz sipariş yok.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </PanelCard>

            <PanelCard>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1.4 }}>Çok satanlar</Typography>
              {(overview.topProducts || []).length === 0 && <Typography sx={{ color: T.muted }}>Henüz satış verisi yok.</Typography>}
              {(overview.topProducts || []).map((item) => (
                <Box key={item._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.95, borderBottom: `1px solid ${T.line}` }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: T.navy }}>{item._id}</Typography>
                    <Typography sx={{ fontSize: 12, color: T.muted }}>{item.qty} adet</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: T.navy }}>{money(item.revenue)}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1.8, borderColor: T.line }} />
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Ödeme tipi</Typography>
              {(overview.paymentMix || []).map((row) => (
                <Box key={row._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                  <Typography sx={{ color: T.muted, fontSize: '0.86rem', fontWeight: 700 }}>{PAYMENT_METHOD[row._id] || row._id}</Typography>
                  <Typography sx={{ color: T.navy, fontSize: '0.86rem', fontWeight: 800 }}>{row.count} · {money(row.total)}</Typography>
                </Box>
              ))}
            </PanelCard>
          </Box>
        </Box>
      )}

      {view === 'approvals' && (
        <Box>
          <SectionTitle
            overline="ONAY KUYRUĞU"
            title="Onay bekleyen ürünler"
            subtitle="Satıcı gönderimleri onaylanana kadar vitrinde görünmez. Görselleri ve metinleri düzenleyip yayına alabilirsiniz."
          />
          {pendingProducts.length === 0 && (
            <PanelCard><Typography sx={{ color: T.muted, fontWeight: 700 }}>Onay bekleyen ürün yok.</Typography></PanelCard>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
            {pendingProducts.map((product) => (
              <PanelCard key={product._id}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box component="img" src={product.image} alt="" sx={{ width: 108, height: 108, objectFit: 'cover', borderRadius: '16px', bgcolor: T.surfaceSoft }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, color: T.navy }}>{product.title}</Typography>
                    <Typography sx={{ color: T.muted, fontSize: '0.84rem', mb: 0.8 }}>
                      {product.seller?.adSoyad || 'Satıcı'} · {product.category}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                      <Chip size="small" label={money(product.price)} sx={{ fontWeight: 800, bgcolor: 'rgba(176,205,230,0.4)' }} />
                      <Chip size="small" label={`Stok ${product.stock}`} sx={{ fontWeight: 800, bgcolor: T.roseSoft }} />
                      {(product.additionalImages || []).length ? (
                        <Chip size="small" label={`${product.additionalImages.length} ek görsel`} sx={{ fontWeight: 800, bgcolor: 'rgba(162,144,183,0.2)' }} />
                      ) : null}
                    </Box>
                  </Box>
                </Box>
                <Typography sx={{ color: T.muted, fontSize: '0.85rem', mt: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1.8, flexWrap: 'wrap' }}>
                  <Button onClick={() => setApproval(product._id, 'approved')} sx={{ ...primaryButton }}>Onayla ve yayınla</Button>
                  <Button onClick={() => openProduct(product)} sx={{ fontWeight: 800, color: T.navy, border: `1px solid ${T.line}`, borderRadius: '12px' }}>Düzenle</Button>
                  <Button color="error" onClick={() => { setRejecting(product); setRejectReason(''); }} sx={{ fontWeight: 800 }}>Reddet</Button>
                </Box>
              </PanelCard>
            ))}
          </Box>
        </Box>
      )}

      {view === 'featured' && (
        <Box>
          <SectionTitle
            overline="VİTRİN"
            title="Öne çıkan ürün talepleri"
            subtitle="Dekontu kontrol edip onaylayın. Süre bitmeden de önerilenlerden kaldırabilirsiniz."
          />
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2.2 }}>
            {[['pending', 'Bekleyen'], ['approved', 'Onaylı'], ['removed', 'Vitrinden alınan'], ['rejected', 'Reddedilen'], ['all', 'Tümü']].map(([id, label]) => (
              <Chip
                key={id}
                clickable
                label={label}
                onClick={() => setFeaturedFilter(id)}
                sx={{
                  fontWeight: 800,
                  bgcolor: featuredFilter === id ? T.navy : '#fff',
                  color: featuredFilter === id ? '#fff' : T.navy,
                  border: `1px solid ${featuredFilter === id ? T.navy : T.line}`
                }}
              />
            ))}
          </Box>
          {featuredRequests.filter((item) => featuredFilter === 'all' || item.status === featuredFilter).length === 0 ? (
            <PanelCard><Typography sx={{ color: T.muted, fontWeight: 700 }}>Bu filtrede talep yok.</Typography></PanelCard>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
              {featuredRequests.filter((item) => featuredFilter === 'all' || item.status === featuredFilter).map((item) => (
                <PanelCard key={item.id}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box component="img" src={item.product?.image} alt="" sx={{ width: 108, height: 108, objectFit: 'cover', borderRadius: '16px', bgcolor: T.surfaceSoft }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                        <Typography sx={{ fontWeight: 900, color: T.navy }}>{item.product?.title || 'Ürün'}</Typography>
                        <StatusChip map={FEATURED_STATUS} value={item.status} />
                      </Box>
                      <Typography sx={{ color: T.muted, fontSize: '0.84rem', mb: 0.8 }}>
                        {item.seller?.magazaAdi || item.seller?.adSoyad || 'Satıcı'} · {item.days} gün · {money(item.price)}
                      </Typography>
                      {item.note ? <Typography sx={{ color: T.navy, fontSize: 13 }}>{item.note}</Typography> : null}
                      {item.endsAt ? <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.4 }}>Bitiş: {when(item.endsAt)}</Typography> : null}
                      {item.rejectionReason ? <Typography sx={{ color: '#96393C', fontSize: 12, mt: 0.4 }}>{item.rejectionReason}</Typography> : null}
                    </Box>
                  </Box>
                  {item.receiptUrl ? (
                    <Box sx={{ mt: 1.6 }}>
                      <Typography sx={{ fontWeight: 800, color: T.navy, fontSize: 13, mb: 0.8 }}>Ödeme dekontu</Typography>
                      {isReceiptPdf(item.receiptUrl) ? (
                        <Button href={item.receiptUrl} target="_blank" rel="noreferrer" sx={{ fontWeight: 800, color: T.navy, border: `1px solid ${T.line}`, borderRadius: '12px' }}>
                          {item.receiptName || 'PDF dekontu aç'}
                        </Button>
                      ) : (
                        <Box
                          component="img"
                          src={item.receiptUrl}
                          alt="Dekont"
                          onClick={() => setFeaturedReceiptView(item)}
                          sx={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: '16px', bgcolor: T.surfaceSoft, cursor: 'zoom-in', border: `1px solid ${T.line}` }}
                        />
                      )}
                    </Box>
                  ) : (
                    <Typography sx={{ color: '#96393C', fontSize: 13, fontWeight: 700, mt: 1.4 }}>Dekont yüklenmemiş. Onay verilemez.</Typography>
                  )}
                  {item.status === 'pending' ? (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1.8, flexWrap: 'wrap' }}>
                      <Button disabled={!item.receiptUrl} onClick={() => reviewFeatured(item.id, 'approved')} sx={primaryButton}>Onayla ve yayınla</Button>
                      <Button color="error" onClick={() => { setFeaturedRejecting(item); setFeaturedRejectReason(''); }} sx={{ fontWeight: 800 }}>Reddet</Button>
                    </Box>
                  ) : null}
                  {item.status === 'approved' && (item.product?.isSponsored || (item.endsAt && new Date(item.endsAt) > Date.now())) ? (
                    <Button
                      color="error"
                      onClick={() => { setFeaturedRemoving(item); setFeaturedRemoveReason(''); }}
                      sx={{ fontWeight: 800, mt: 1.8 }}
                    >
                      Önerilenlerden kaldır
                    </Button>
                  ) : null}
                </PanelCard>
              ))}
            </Box>
          )}
        </Box>
      )}

      {view === 'orders' && (
        <Box>
          <SectionTitle
            overline="SİPARİŞ YÖNETİMİ"
            title="Siparişler"
            subtitle="Sipariş akışını satıcı yönetir. Havale / EFT ödemelerini buradan işaretleyebilirsiniz."
            action={
              <Select size="small" value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} sx={{ minWidth: 190, bgcolor: '#fff', borderRadius: '12px' }}>
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="pay_pending">Ödeme bekleyen</MenuItem>
                <MenuItem value="processing">Hazırlanıyor</MenuItem>
                <MenuItem value="shipped">Kargoda</MenuItem>
                <MenuItem value="delivered">Teslim edildi</MenuItem>
                <MenuItem value="cancelled">İptal</MenuItem>
              </Select>
            }
          />
          <PanelCard sx={{ p: 0, overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Müşteri', 'Tutar', 'Ödeme', 'Durum', 'Tarih', ''].map((h) => (
                    <TableCell key={h} sx={headCell}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell sx={bodyCell}>
                      <Typography sx={{ fontWeight: 800 }}>{order.customerInfo?.firstName} {order.customerInfo?.lastName}</Typography>
                      <Typography sx={{ fontSize: 12, color: T.muted }}>{order.customerInfo?.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(order.totalPrice)}</TableCell>
                    <TableCell sx={bodyCell}>
                      <StatusChip map={PAYMENT_STATUS} value={order.paymentStatus} />
                      <Typography sx={{ fontSize: 12, color: T.muted, mt: 0.4 }}>{PAYMENT_METHOD[order.paymentMethod]}</Typography>
                    </TableCell>
                    <TableCell sx={bodyCell}>
                      <StatusChip map={ORDER_STATUS} value={order.orderStatus} />
                    </TableCell>
                    <TableCell sx={{ ...bodyCell, color: T.muted }}>{when(order.createdAt)}</TableCell>
                    <TableCell sx={bodyCell}>
                      <Button onClick={() => setOpenOrder(order)} sx={{ fontWeight: 800, color: T.rose }}>Detay</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow><TableCell colSpan={6} sx={{ ...bodyCell, color: T.muted }}>Sipariş bulunamadı.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </PanelCard>
        </Box>
      )}

      {view === 'products' && (
        <Box>
          <SectionTitle
            overline="KATALOG"
            title="Ürünler"
            subtitle="Görselleri dosya olarak yükleyin, fiyat ve stokları düzenleyin."
            action={
              <Select size="small" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} sx={{ minWidth: 190, bgcolor: '#fff', borderRadius: '12px' }}>
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="live">Yayında</MenuItem>
                <MenuItem value="hidden">Gizli</MenuItem>
                <MenuItem value="pending">Onay bekleyen</MenuItem>
                <MenuItem value="rejected">Reddedilen</MenuItem>
                <MenuItem value="low">Kritik stok</MenuItem>
              </Select>
            }
          />
          <PanelCard sx={{ p: 0, overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Ürün', 'Satıcı', 'Fiyat', 'Stok', 'Onay', 'Yayın', ''].map((h) => (
                    <TableCell key={h} sx={headCell}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id} hover>
                    <TableCell sx={bodyCell}>
                      <Box sx={{ display: 'flex', gap: 1.4, alignItems: 'center' }}>
                        <Box component="img" src={product.image} alt="" sx={{ width: 52, height: 52, objectFit: 'cover', borderRadius: '12px', bgcolor: T.surfaceSoft }} />
                        <Box>
                          <Typography sx={{ fontWeight: 800 }}>{product.title}</Typography>
                          <Typography sx={{ fontSize: 12, color: T.muted }}>{product.category} · {product.productCode}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ ...bodyCell, fontSize: 13 }}>{product.seller?.adSoyad || 'NikBag'}</TableCell>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(product.price)}</TableCell>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800, color: product.stock <= 5 ? '#96393C' : T.navy }}>{product.stock}</TableCell>
                    <TableCell sx={bodyCell}><StatusChip map={APPROVAL_STATUS} value={product.approvalStatus || 'approved'} /></TableCell>
                    <TableCell sx={bodyCell}>
                      <Chip
                        size="small"
                        label={product.isActive ? 'Yayında' : 'Gizli'}
                        sx={{ fontWeight: 800, bgcolor: product.isActive ? 'rgba(150,190,150,0.24)' : 'rgba(46,59,85,0.07)', color: product.isActive ? '#3F6B47' : T.muted }}
                      />
                    </TableCell>
                    <TableCell sx={bodyCell}>
                      <Button onClick={() => openProduct(product)} sx={{ fontWeight: 800, color: T.rose }}>Düzenle</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow><TableCell colSpan={7} sx={{ ...bodyCell, color: T.muted }}>Ürün bulunamadı.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </PanelCard>
        </Box>
      )}

      {view === 'sellers' && (
        <Box>
          <SectionTitle overline="MAĞAZALAR" title="Satıcılar" subtitle="Başvuruları onaylayın, mağazaları askıya alın." />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
            {filteredSellers.map((seller) => (
              <PanelCard key={seller._id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, color: T.navy }}>{seller.magazaAdi}</Typography>
                    <Typography sx={{ color: T.muted, fontSize: '0.85rem' }}>{seller.user?.email}</Typography>
                    <Typography sx={{ color: T.muted, fontSize: '0.85rem' }}>
                      {seller.sehir}/{seller.ilce} · {(Array.isArray(seller.magazaTuru) ? seller.magazaTuru : [seller.magazaTuru]).filter(Boolean).map(categoryLabel).join(' · ') || seller.magazaTuru} · {seller.telefon}
                    </Typography>
                  </Box>
                  <StatusChip map={SELLER_STATUS} value={seller.durum} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1.8, flexWrap: 'wrap' }}>
                  {seller.durum !== 'approved' && <Button onClick={() => handleStatus(seller._id, 'approved')} sx={primaryButton}>Onayla</Button>}
                  {seller.durum !== 'rejected' && <Button color="error" onClick={() => handleStatus(seller._id, 'rejected')} sx={{ fontWeight: 800 }}>Reddet</Button>}
                  {seller.durum === 'approved' && <Button color="warning" onClick={() => handleStatus(seller._id, 'suspended')} sx={{ fontWeight: 800 }}>Askıya al</Button>}
                </Box>
              </PanelCard>
            ))}
          </Box>
        </Box>
      )}

      {view === 'customers' && (
        <Box>
          <SectionTitle overline="ÜYELER" title="Müşteriler" subtitle="Rol değişimi ile bir üyeyi satıcı yapabilirsiniz." />
          <PanelCard sx={{ p: 0, overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Ad soyad', 'E-posta', 'Telefon', 'Rol', 'Kayıt'].map((h) => (
                    <TableCell key={h} sx={headCell}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{item.adSoyad}</TableCell>
                    <TableCell sx={bodyCell}>{item.email}</TableCell>
                    <TableCell sx={bodyCell}>{item.telefon || '—'}</TableCell>
                    <TableCell sx={bodyCell}>
                      {item.rol === 'superadmin' ? (
                        <Chip size="small" label="süper admin" sx={{ fontWeight: 800, bgcolor: 'rgba(162,144,183,0.22)' }} />
                      ) : (
                        <Select
                          size="small"
                          value={item.rol === 'seller' ? 'seller' : 'user'}
                          onChange={(e) => handleRole(item.id, e.target.value)}
                          sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                        >
                          <MenuItem value="user">Müşteri</MenuItem>
                          <MenuItem value="seller">Satıcı</MenuItem>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell sx={{ ...bodyCell, color: T.muted }}>{when(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </PanelCard>
        </Box>
      )}

      {view === 'lookbook' && (
        <Box>
          <SectionTitle overline="İÇERİK" title="Lookbook videoları" subtitle="Ana sayfadaki atölye şeridini buradan yönetin." />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 1.8 }}>
            <PanelCard>
              <Box component="form" onSubmit={handleLookbook}>
                <TextField fullWidth label="Etiket" value={label} onChange={(e) => setLabel(e.target.value)} sx={{ ...fieldSx, mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Button variant="outlined" component="label" sx={{ fontWeight: 800, borderRadius: '12px', borderColor: T.line, color: T.navy }}>
                    Video seç<input hidden type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
                  </Button>
                  <Button variant="outlined" component="label" sx={{ fontWeight: 800, borderRadius: '12px', borderColor: T.line, color: T.navy }}>
                    Poster seç<input hidden type="file" accept="image/*" onChange={(e) => setPoster(e.target.files?.[0] || null)} />
                  </Button>
                </Box>
                <Typography sx={{ mb: 2, color: T.muted, fontSize: '0.85rem' }}>{video ? video.name : 'Video seçilmedi'}</Typography>
                <Button type="submit" disabled={saving} sx={primaryButton}>{saving ? 'Yükleniyor...' : 'Video ekle'}</Button>
              </Box>
            </PanelCard>
            <Box>
              {lookbook.map((item) => (
                <PanelCard key={item._id} sx={{ mb: 1.4, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box component="video" src={mediaUrl(item.videoUrl)} muted preload="metadata" sx={{ width: 150, height: 88, objectFit: 'cover', borderRadius: '14px' }} />
                  <Typography sx={{ flex: 1, fontWeight: 800, color: T.navy }}>{item.label}</Typography>
                  <Button color="error" onClick={async () => { await lookbookService.remove(item._id); await load(); }} sx={{ fontWeight: 800 }}>Sil</Button>
                </PanelCard>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {view === 'promos' && (
        <Box>
          <SectionTitle
            overline="KAMPANYALAR"
            title="İndirim kodları"
            subtitle="Site kodları tüm sepette geçerlidir. Satıcıların kendi ürünlerine açtığı kodlar da burada görünür."
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.3fr' }, gap: 1.8 }}>
            <PanelCard>
              <Box component="form" onSubmit={savePromo}>
                <TextField
                  fullWidth
                  label="Kod"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="BAHAR5"
                  sx={{ ...fieldSx, mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="İndirim %"
                  value={promoForm.percent}
                  onChange={(e) => setPromoForm((p) => ({ ...p, percent: e.target.value }))}
                  sx={{ ...fieldSx, mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum sepet (₺)"
                  value={promoForm.minSubtotal}
                  onChange={(e) => setPromoForm((p) => ({ ...p, minSubtotal: e.target.value }))}
                  helperText="0 yazarsan eşik olmaz"
                  sx={{ ...fieldSx, mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Not (opsiyonel)"
                  value={promoForm.note}
                  onChange={(e) => setPromoForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="5.000 ₺ üzeri bahar indirimi"
                  sx={{ ...fieldSx, mb: 2 }}
                />
                <Button type="submit" disabled={savingPromo} sx={primaryButton}>
                  {savingPromo ? 'Kaydediliyor...' : 'Kod ekle'}
                </Button>
              </Box>
            </PanelCard>
            <PanelCard sx={{ p: 0, overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {['Kod', 'Kapsam', 'İndirim', 'Eşik', 'Kullanım', 'Durum', ''].map((h) => (
                      <TableCell key={h} sx={headCell}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {promos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ ...bodyCell, color: T.muted, py: 3 }}>Henüz kampanya kodu yok.</TableCell>
                    </TableRow>
                  ) : promos.map((promo) => (
                    <TableRow key={promo.id} hover>
                      <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{promo.code}</TableCell>
                      <TableCell sx={bodyCell}>{promo.scope === 'seller' ? (promo.sellerName || 'Atölye') : 'Site'}</TableCell>
                      <TableCell sx={bodyCell}>%{promo.percent}</TableCell>
                      <TableCell sx={bodyCell}>{promo.minSubtotal > 0 ? money(promo.minSubtotal) : 'Eşik yok'}</TableCell>
                      <TableCell sx={bodyCell}>{promo.usedCount || 0}</TableCell>
                      <TableCell sx={bodyCell}>
                        <Chip
                          size="small"
                          label={promo.isActive ? 'Açık' : 'Kapalı'}
                          sx={{ fontWeight: 800, bgcolor: promo.isActive ? 'rgba(129,178,154,0.28)' : 'rgba(148,109,109,0.16)' }}
                        />
                      </TableCell>
                      <TableCell sx={bodyCell}>
                        <Button onClick={() => togglePromo(promo)} sx={{ fontWeight: 800, color: T.navy, mr: 1 }}>
                          {promo.isActive ? 'Durdur' : 'Aç'}
                        </Button>
                        <Button color="error" onClick={() => removePromo(promo)} sx={{ fontWeight: 800 }}>Sil</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PanelCard>
          </Box>
        </Box>
      )}

      {view === 'settings' && (
        <Box>
          <SectionTitle overline="AYARLAR" title="Mağaza ayarları" subtitle="Genel bilgiler ve özet istatistikler." />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.8 }}>
            <PanelCard>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Yetkili</Typography>
              <Typography sx={{ color: T.muted, mb: 1.5 }}>Vitrin, satıcı onayları ve sipariş akışı bu panelden yönetilir.</Typography>
              <Typography sx={{ fontWeight: 800, color: T.navy }}>{user.adSoyad}</Typography>
              <Typography sx={{ color: T.muted }}>{user.email}</Typography>
            </PanelCard>
            <PanelCard>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Özet</Typography>
              <Typography sx={{ color: T.muted }}>
                {overview?.users || 0} müşteri · {overview?.sellers || 0} mağaza · {overview?.products || 0} ürün · {overview?.orders || 0} sipariş
              </Typography>
            </PanelCard>
          </Box>
        </Box>
      )}

      <Dialog open={Boolean(editing)} onClose={closeProduct} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>Ürünü düzenle</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField label="Başlık" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} sx={fieldSx} />
              <TextField
                select
                label="Kategori"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                sx={fieldSx}
              >
                {form.category && !CATEGORY_OPTIONS.some((item) => item.value === form.category) ? (
                  <MenuItem value={form.category}>{categoryLabel(form.category)}</MenuItem>
                ) : null}
                {CATEGORY_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                ))}
              </TextField>
              <TextField label="Açıklama" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} multiline minRows={4} sx={fieldSx} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.4 }}>
                <TextField label="Fiyat" type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} sx={fieldSx} />
                <TextField label="Stok" type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} sx={fieldSx} />
                <TextField label="İndirim %" type="number" value={form.discountPercentage} onChange={(e) => setForm((p) => ({ ...p, discountPercentage: e.target.value }))} sx={fieldSx} />
              </Box>
              <TextField label="Renkler (virgülle)" value={form.colors} onChange={(e) => setForm((p) => ({ ...p, colors: e.target.value }))} sx={fieldSx} />
              <TextField label="Bedenler (virgülle)" value={form.sizes} onChange={(e) => setForm((p) => ({ ...p, sizes: e.target.value }))} sx={fieldSx} />
              <TextField label="Üretim süresi" value={form.customProductionTime} onChange={(e) => setForm((p) => ({ ...p, customProductionTime: e.target.value }))} sx={fieldSx} />
              <TextField label="Ölçü / kullanım notu" value={form.measureNote} onChange={(e) => setForm((p) => ({ ...p, measureNote: e.target.value }))} placeholder="Örn. 28×18 cm, telefon ve cüzdan sığar" sx={fieldSx} />
              <TextField label="Ürün videosu (isteğe bağlı)" value={form.video} onChange={(e) => setForm((p) => ({ ...p, video: e.target.value }))} placeholder="mp4 bağlantısı — tıklanınca yüklenir" sx={fieldSx} />
            </Box>

            <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
              <Box>
                <Typography sx={{ fontWeight: 800, color: T.navy, mb: 0.8, fontSize: '0.9rem' }}>Ana görsel</Typography>
                {!mainImage && editing?.image ? (
                  <Box component="img" src={editing.image} alt="" sx={{ width: '100%', height: 190, objectFit: 'cover', borderRadius: '18px', mb: 1.2, border: `1px solid ${T.line}` }} />
                ) : null}
                <ImageUploader value={mainImage} onChange={setMainImage} hint="Yeni dosya seçerseniz mevcut görselin yerini alır" height={120} />
              </Box>
              <ImageUploader
                label="Galeri görselleri"
                multiple
                value={gallery}
                onChange={setGallery}
                existing={keptImages}
                onRemoveExisting={(url) => setKeptImages((prev) => prev.filter((item) => item !== url))}
                height={110}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                <Typography sx={{ fontWeight: 800, color: T.navy }}>Yayında</Typography>
                <Switch checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                <Typography sx={{ fontWeight: 800, color: T.navy }}>Öne çıkar (sponsor)</Typography>
                <Switch checked={form.isSponsored} onChange={(e) => setForm((p) => ({ ...p, isSponsored: e.target.checked }))} />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          {editing?.approvalStatus === 'pending' && (
            <Button onClick={() => { setApproval(editing._id, 'approved'); closeProduct(); }} sx={{ fontWeight: 800, color: '#3F6B47' }}>
              Onayla ve yayınla
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closeProduct} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button onClick={saveProduct} disabled={savingProduct} sx={primaryButton}>{savingProduct ? 'Kaydediliyor...' : 'Kaydet'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rejecting)} onClose={() => setRejecting(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '22px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>Ürünü reddet</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.muted, mb: 2 }}>{rejecting?.title}</Typography>
          <TextField
            fullWidth
            label="Ret nedeni"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            minRows={3}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejecting(null)} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button
            color="error"
            onClick={() => { setApproval(rejecting._id, 'rejected', rejectReason); setRejecting(null); }}
            sx={{ fontWeight: 800 }}
          >
            Reddet
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(featuredReceiptView)} onClose={() => setFeaturedReceiptView(null)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>
          {featuredReceiptView?.product?.title || 'Dekont'} · {featuredReceiptView ? money(featuredReceiptView.price) : ''}
        </DialogTitle>
        <DialogContent>
          {featuredReceiptView?.receiptUrl ? (
            <Box component="img" src={featuredReceiptView.receiptUrl} alt="Dekont" sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '16px', bgcolor: T.surfaceSoft }} />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button href={featuredReceiptView?.receiptUrl || '#'} target="_blank" rel="noreferrer" sx={{ fontWeight: 800, color: T.navy }}>Yeni sekmede aç</Button>
          <Button onClick={() => setFeaturedReceiptView(null)} sx={{ fontWeight: 800, color: T.muted }}>Kapat</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(featuredRemoving)} onClose={() => setFeaturedRemoving(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '22px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>Önerilenlerden kaldır</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.muted, mb: 2 }}>
            <b>{featuredRemoving?.product?.title}</b> süresi bitmeden ana sayfadaki önerilenlerden çıkarılacak.
          </Typography>
          <TextField
            fullWidth
            label="Not (isteğe bağlı)"
            value={featuredRemoveReason}
            onChange={(e) => setFeaturedRemoveReason(e.target.value)}
            multiline
            minRows={3}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFeaturedRemoving(null)} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button color="error" onClick={removeFeatured} sx={{ fontWeight: 800 }}>Kaldır</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(featuredRejecting)} onClose={() => setFeaturedRejecting(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '22px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>Talebi reddet</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.muted, mb: 2 }}>{featuredRejecting?.product?.title}</Typography>
          <TextField
            fullWidth
            label="Ret nedeni (isteğe bağlı)"
            value={featuredRejectReason}
            onChange={(e) => setFeaturedRejectReason(e.target.value)}
            multiline
            minRows={3}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFeaturedRejecting(null)} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button
            color="error"
            onClick={() => reviewFeatured(featuredRejecting.id, 'rejected', featuredRejectReason)}
            sx={{ fontWeight: 800 }}
          >
            Reddet
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(openOrder)} onClose={() => setOpenOrder(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>Sipariş detayı</DialogTitle>
        <DialogContent>
          {openOrder && (
            <Box>
              <Typography sx={{ fontWeight: 800, color: T.navy }}>
                {openOrder.customerInfo?.firstName} {openOrder.customerInfo?.lastName}
              </Typography>
              <Typography sx={{ color: T.muted, mb: 1 }}>{openOrder.customerInfo?.email} · {openOrder.customerInfo?.phone}</Typography>
              <Typography sx={{ mb: 2, color: T.navy }}>
                {openOrder.shippingAddress?.address}, {openOrder.shippingAddress?.district}/{openOrder.shippingAddress?.city}
              </Typography>
              {(openOrder.orderItems || []).map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.7, borderBottom: `1px solid ${T.line}` }}>
                  <Typography sx={{ color: T.navy }}>
                    {item.name} × {item.quantity}
                    {Number(item.quantity) > 1 ? ` · ${money(item.price)}` : ''}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: T.navy }}>{money(lineTotalOf(item))}</Typography>
                </Box>
              ))}
              {orderChargeRows(openOrder).map((row) => (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, mt: row.total ? 1 : 0 }}>
                  <Typography sx={{ color: T.muted, fontWeight: row.total ? 900 : 700 }}>{row.label}</Typography>
                  <Typography sx={{ fontWeight: 900, color: T.navy }}>
                    {row.free ? 'Ücretsiz' : money(row.value)}
                  </Typography>
                </Box>
              ))}
              <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.2, mt: 1.2 }}>
                Kargo durumunu satıcı yönetir. Buradan yalnızca ödemeyi işaretleyebilirsiniz.
              </Typography>
              <Select
                fullWidth
                size="small"
                value={openOrder.paymentStatus}
                onChange={(e) => updateOrder(openOrder._id, { paymentStatus: e.target.value })}
                sx={{ borderRadius: '12px', bgcolor: '#fff' }}
              >
                {Object.entries(PAYMENT_STATUS).map(([key, text]) => (
                  <MenuItem key={key} value={key}>{text}</MenuItem>
                ))}
              </Select>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenOrder(null)} sx={{ fontWeight: 800, color: T.muted }}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </PanelShell>
  );
}
