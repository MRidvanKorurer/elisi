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
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import CampaignOutlined from '@mui/icons-material/CampaignOutlined';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import PendingActionsOutlined from '@mui/icons-material/PendingActionsOutlined';
import PanelShell, { PanelCard, SectionTitle, StatusChip, fieldSx, primaryButton } from '../components/PanelShell';
import { PageSpinner } from '../components/LoadingButton';
import AdminPlatformReport from '../components/AdminPlatformReport';
import ImageUploader from '../components/ImageUploader';
import { adminService } from '../api/adminService';
import { promoService } from '../api/promoService';
import { lookbookService } from '../api/lookbookService';
import AdminSiteContent from '../components/AdminSiteContent';
import AdminCategories from '../components/AdminCategories';
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
import { FEATURED_PACKAGES, FEATURED_SLOTS, FEATURED_STATUS, isLiveFeatured, isReceiptPdf } from '../utils/featured';
import { ATELIER_WEEK_SLOTS, ATELIER_WEEK_STATUS, isLiveWeek } from '../utils/atelierWeek';
import { lineTotalOf, orderChargeRows, platformShareOf } from '../utils/price';
import { isValidIbanTr } from '../utils/bank';
import BankTransferDetails from '../components/BankTransferDetails';
import AdminCommission from '../components/AdminCommission';
import AdminBankAccounts from '../components/AdminBankAccounts';
import AdminAdsBoard from '../components/AdminAdsBoard';

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
  const [bootLoading, setBootLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lookbook, setLookbook] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
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
  const [featuredSlots, setFeaturedSlots] = useState({ used: 0, total: FEATURED_SLOTS, free: FEATURED_SLOTS, nextFreeAt: null });
  const [featuredFilter, setFeaturedFilter] = useState('pending');
  const [featuredRejecting, setFeaturedRejecting] = useState(null);
  const [featuredRejectReason, setFeaturedRejectReason] = useState('');
  const [featuredReceiptView, setFeaturedReceiptView] = useState(null);
  const [featuredRemoving, setFeaturedRemoving] = useState(null);
  const [featuredRemoveReason, setFeaturedRemoveReason] = useState('');
  const [giftProductId, setGiftProductId] = useState('');
  const [giftDays, setGiftDays] = useState(3);
  const [giftNote, setGiftNote] = useState('');
  const [savingGift, setSavingGift] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [savingBank, setSavingBank] = useState(false);
  const [weekRequests, setWeekRequests] = useState([]);
  const [weekSlots, setWeekSlots] = useState({ used: 0, total: ATELIER_WEEK_SLOTS, free: ATELIER_WEEK_SLOTS, nextFreeAt: null });
  const [weekFilter, setWeekFilter] = useState('pending');
  const [weekRejecting, setWeekRejecting] = useState(null);
  const [weekRejectReason, setWeekRejectReason] = useState('');
  const [weekReceiptView, setWeekReceiptView] = useState(null);
  const [weekRemoving, setWeekRemoving] = useState(null);
  const [weekRemoveReason, setWeekRemoveReason] = useState('');
  const [giftSellerId, setGiftSellerId] = useState('');
  const [giftWeekNote, setGiftWeekNote] = useState('');
  const [savingWeekGift, setSavingWeekGift] = useState(false);
  const [report, setReport] = useState(null);
  const [catalogCategories, setCatalogCategories] = useState([]);

  const categoryOptions = useMemo(() => {
    const map = new Map(CATEGORY_OPTIONS.map((item) => [item.value, item.label]));
    catalogCategories.forEach((item) => {
      const value = String(item.categoryId || '').toLowerCase();
      if (!value) return;
      map.set(value, item.name || categoryLabel(value));
    });
    if (form.category && !map.has(form.category)) {
      map.set(form.category, categoryLabel(form.category));
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [catalogCategories, form.category]);

  const load = async () => {
    setBootLoading(true);
    try {
      const ov = await adminService.overview();
      setOverview(ov.overview);
      setBootLoading(false);

      const [us, se, pr, lb, or, pm, ft, wk, rp, cats] = await Promise.all([
        adminService.users(),
        adminService.sellers(),
        adminService.products(),
        lookbookService.list(true),
        adminService.orders(),
        promoService.list().catch(() => ({ promos: [] })),
        adminService.featured().catch(() => ({ requests: [] })),
        adminService.atelierWeek().catch(() => ({ requests: [] })),
        adminService.reports().catch(() => ({ report: null })),
        adminService.categories().catch(() => ({ categories: [] }))
      ]);
      setUsers(us.users || []);
      setSellers(se.sellers || []);
      setProducts(pr.products || []);
      setLookbook(lb.items || []);
      setOrders(or.orders || []);
      setPromos(pm.promos || []);
      setFeaturedRequests(ft.requests || []);
      if (ft.slots) setFeaturedSlots(ft.slots);
      if (ft.bank) {
        setBankName(ft.bank.name || '');
        setBankHolder(ft.bank.holder || '');
        setBankIban(ft.bank.iban || '');
      }
      setWeekRequests(wk.requests || []);
      if (wk.slots) setWeekSlots(wk.slots);
      setReport(rp.report || null);
      setCatalogCategories(cats.categories || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.mesaj || 'Admin verileri yüklenemedi.');
      setBootLoading(false);
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
          (orderFilter === 'pay_pending' && order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled') ||
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
    () => sellers.filter((s) => !q || `${s.magazaAdi} ${s.user?.email} ${s.user?.adSoyad} ${s.adSoyad} ${s.ibanHolder} ${s.iban} ${s.sehir}`.toLowerCase().includes(q)),
    [sellers, q]
  );

  if (!user) return <Navigate to="/giris" replace />;
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

  const giftFeatured = async () => {
    if (!giftProductId) return;
    setSavingGift(true);
    try {
      const data = await adminService.giftFeatured({ productId: giftProductId, days: giftDays, note: giftNote });
      flash(data?.mesaj || 'Ücretsiz vitrin verildi.');
      setGiftNote('');
      await load();
    } catch (err) {
      fail(err, 'Ücretsiz vitrin verilemedi.');
    } finally {
      setSavingGift(false);
    }
  };

  const giftFeaturedProduct = async ({ productId, days = 3 }) => {
    const data = await adminService.giftFeatured({ productId, days, note: 'Reklam panosundan hediye vitrin' });
    flash(data?.mesaj || 'Ücretsiz vitrin verildi.');
    await load();
  };

  const saveFeaturedBank = async () => {
    if (!isValidIbanTr(bankIban)) {
      setError('Geçerli bir TR IBAN yazın (TR + 24 hane).');
      return;
    }
    setSavingBank(true);
    try {
      const data = await adminService.saveFeaturedSettings({ name: bankName, holder: bankHolder, iban: bankIban });
      flash(data?.mesaj || 'Havale bilgisi kaydedildi.');
      if (data?.bank) {
        setBankName(data.bank.name);
        setBankHolder(data.bank.holder || '');
        setBankIban(data.bank.iban);
      }
    } catch (err) {
      fail(err, 'Havale bilgisi kaydedilemedi.');
    } finally {
      setSavingBank(false);
    }
  };

  const matchesFeaturedFilter = (item) => {
    if (featuredFilter === 'all') return true;
    if (featuredFilter === 'live') return isLiveFeatured(item);
    if (featuredFilter === 'ended') return item.status === 'ended' || item.status === 'removed';
    return item.status === featuredFilter;
  };

  const reviewWeek = async (id, status, rejectionReason = '') => {
    try {
      await adminService.reviewAtelierWeek(id, { status, rejectionReason });
      flash(status === 'approved' || status === 'live' ? 'Atölye haftanın vitrine alındı.' : 'Talep reddedildi.');
      setWeekRejecting(null);
      setWeekRejectReason('');
      await load();
    } catch (err) {
      fail(err, 'Talep güncellenemedi.');
    }
  };

  const removeWeek = async () => {
    if (!weekRemoving) return;
    try {
      await adminService.removeAtelierWeek(weekRemoving.id, { note: weekRemoveReason });
      flash('Atölye haftanın vitrinden alındı.');
      setWeekRemoving(null);
      setWeekRemoveReason('');
      await load();
    } catch (err) {
      fail(err, 'Atölye vitrinden alınamadı.');
    }
  };

  const giftWeek = async () => {
    if (!giftSellerId) return;
    setSavingWeekGift(true);
    try {
      const data = await adminService.giftAtelierWeek({ sellerId: giftSellerId, note: giftWeekNote });
      flash(data?.mesaj || 'Ücretsiz hafta verildi.');
      setGiftWeekNote('');
      await load();
    } catch (err) {
      fail(err, 'Ücretsiz hafta verilemedi.');
    } finally {
      setSavingWeekGift(false);
    }
  };

  const matchesWeekFilter = (item) => {
    if (weekFilter === 'all') return true;
    if (weekFilter === 'live') return isLiveWeek(item);
    if (weekFilter === 'ended') return item.status === 'ended';
    return item.status === weekFilter;
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
    { id: 'ads', label: 'Reklamlar', icon: CampaignOutlined },
    { id: 'week', label: 'Haftanın atölyeleri', icon: CelebrationOutlined, badge: overview?.pendingAtelierWeek || weekRequests.filter((item) => item.status === 'pending').length },
    { id: 'reports', label: 'Raporlar', icon: AssessmentOutlined },
    { id: 'commission', label: 'Satıcı ödemeleri', icon: AccountBalanceOutlined },
    { id: 'bank', label: 'IBAN hesapları', icon: PaymentsOutlined },
    { id: 'products', label: 'Ürünler', icon: Inventory2Outlined },
    { id: 'categories', label: 'Kategoriler', icon: CategoryOutlined },
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
    { label: 'Haftanın atölyesi', value: overview?.pendingAtelierWeek || weekRequests.filter((item) => item.status === 'pending').length, view: 'week' },
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
      searchPlaceholder={view === 'week' ? 'Atölye veya satıcı ara' : view === 'ads' ? 'Ürün, kategori veya satıcı ara' : view === 'reports' || view === 'commission' || view === 'bank' ? 'Mağaza, IBAN veya sipariş ara' : 'Sipariş, ürün, müşteri veya mağaza ara'}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
    >
      {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2, borderRadius: '14px' }} onClose={() => setMessage('')}>{message}</Alert> : null}

      {bootLoading ? <PageSpinner minHeight="50vh" /> : null}

      {view === 'dashboard' && overview && !bootLoading && (
        <Box>
          <SectionTitle
            overline="SÜPER ADMİN"
            title="Günlük durum"
            subtitle="Ödeme onayı, ürün incelemesi ve satıcı başvurularını buradan yönetin. Sipariş kargosunu satıcı ilerletir."
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, 1fr)' }, gap: 1.8, mb: 2 }}>
            <StatCard icon={ShoppingBagOutlined} title="Bugünkü sipariş" value={overview.todayOrders} hint="Adet" tone={T.navy} />
            <StatCard icon={PaymentsOutlined} title="Bugünkü ciro" value={money(overview.todayRevenue)} hint="Tahsil edilen" tone={T.rose} />
            <StatCard icon={TrendingUpRounded} title="Toplam ciro" value={money(overview.revenue)} hint={`${overview.paidOrders} ödenen sipariş`} tone={T.lavender} />
            <StatCard icon={AccountBalanceOutlined} title="Platform payı" value={money(overview.platformFee)} hint={`Bugün ${money(overview.todayPlatformFee)} · bekleyen ${money(overview.pendingPlatformFee)}`} tone={T.rose} />
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
            <PanelCard sx={{ p: 0, overflowX: 'auto' }}>
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
            subtitle="Tek yol: dekontu onayla, ücretsiz vitrin ver veya yayındakini kaldır. 12 yer; doluyken yalnızca uzatma onaylanır."
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8, mb: 2.2 }}>
            <PanelCard>
              <Typography sx={{ fontWeight: 900, color: T.navy }}>Kapasite</Typography>
              <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.4 }}>
                {featuredSlots.used}/{featuredSlots.total} ürün vitrinde
                {featuredSlots.nextFreeAt ? ` · sıradaki boşalma ${when(featuredSlots.nextFreeAt)}` : ''}
              </Typography>
              <Box sx={{ mt: 1.4, height: 8, borderRadius: 99, bgcolor: T.surfaceSoft, overflow: 'hidden' }}>
                <Box sx={{ width: `${Math.min(100, (Number(featuredSlots.used) / Number(featuredSlots.total || FEATURED_SLOTS)) * 100)}%`, height: '100%', bgcolor: featuredSlots.free <= 0 ? T.rose : T.navy }} />
              </Box>
            </PanelCard>
            <PanelCard>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Havale hesabı</Typography>
              <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.2 }}>
                Bu IBAN hem vitrin dekontlarında hem müşteri havale/EFT ödemesinde gösterilir.
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.2 }}>
                <TextField label="Alıcı ad soyad" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} sx={fieldSx} />
                <TextField label="Unvan / mağaza" value={bankName} onChange={(e) => setBankName(e.target.value)} sx={fieldSx} />
                <TextField label="IBAN" value={bankIban} onChange={(e) => setBankIban(e.target.value)} sx={fieldSx} />
                <Button onClick={saveFeaturedBank} disabled={savingBank || !(bankHolder.trim() || bankName.trim()) || !isValidIbanTr(bankIban)} sx={{ ...primaryButton, justifySelf: 'start' }}>
                  {savingBank ? 'Kaydediliyor...' : 'Havale bilgisini kaydet'}
                </Button>
              </Box>
            </PanelCard>
          </Box>
          <PanelCard sx={{ mb: 2.2 }}>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Ücretsiz vitrin</Typography>
            <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.4 }}>Yayındaki ürüne 3 / 5 / 7 gün hediye. Vitrin doluysa yalnızca zaten vitrindeki ürüne süre ekler.</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 2fr auto' }, gap: 1.2, alignItems: 'start' }}>
              <TextField
                select
                label="Ürün"
                value={giftProductId}
                onChange={(e) => setGiftProductId(e.target.value)}
                sx={fieldSx}
              >
                <MenuItem value="">Seçin</MenuItem>
                {products.filter((product) => product.approvalStatus === 'approved' && product.isActive).map((product) => (
                  <MenuItem key={product._id} value={product._id}>
                    {product.title}{product.isSponsored ? ' · vitrinde' : ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Süre" value={giftDays} onChange={(e) => setGiftDays(Number(e.target.value))} sx={fieldSx}>
                {FEATURED_PACKAGES.map((pack) => (
                  <MenuItem key={pack.days} value={pack.days}>{pack.label}</MenuItem>
                ))}
              </TextField>
              <TextField label="Not (isteğe bağlı)" value={giftNote} onChange={(e) => setGiftNote(e.target.value)} sx={fieldSx} />
              <Button onClick={giftFeatured} disabled={savingGift || !giftProductId} sx={primaryButton}>
                {savingGift ? 'Veriliyor...' : 'Hediye et'}
              </Button>
            </Box>
          </PanelCard>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2.2 }}>
            {[['pending', 'Sırada'], ['live', 'Vitrinde'], ['ended', 'Biten'], ['rejected', 'Reddedilen'], ['cancelled', 'İptal'], ['all', 'Tümü']].map(([id, label]) => (
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
          {featuredRequests.filter(matchesFeaturedFilter).length === 0 ? (
            <PanelCard><Typography sx={{ color: T.muted, fontWeight: 700 }}>Bu filtrede talep yok.</Typography></PanelCard>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
              {featuredRequests.filter(matchesFeaturedFilter).map((item) => (
                <PanelCard key={item.id}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box component="img" src={item.product?.image} alt="" sx={{ width: 108, height: 108, objectFit: 'cover', borderRadius: '16px', bgcolor: T.surfaceSoft }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                        <Typography sx={{ fontWeight: 900, color: T.navy }}>{item.product?.title || 'Ürün'}</Typography>
                        <StatusChip map={FEATURED_STATUS} value={item.status} />
                      </Box>
                      <Typography sx={{ color: T.muted, fontSize: '0.84rem', mb: 0.8 }}>
                        {item.seller?.magazaAdi || item.seller?.adSoyad || 'Satıcı'} · {item.days} gün · {Number(item.price) === 0 ? 'Ücretsiz' : money(item.price)}
                      </Typography>
                      {item.note ? <Typography sx={{ color: T.navy, fontSize: 13 }}>{item.note}</Typography> : null}
                      {item.endsAt ? <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.4 }}>Bitiş: {when(item.endsAt)}{item.remainingDays ? ` · ${item.remainingDays} gün` : ''}</Typography> : null}
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
                  ) : item.status === 'pending' ? (
                    <Typography sx={{ color: '#96393C', fontSize: 13, fontWeight: 700, mt: 1.4 }}>Dekont yüklenmemiş. Onay verilemez.</Typography>
                  ) : null}
                  {item.status === 'pending' ? (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1.8, flexWrap: 'wrap' }}>
                      <Button disabled={!item.receiptUrl} onClick={() => reviewFeatured(item.id, 'approved')} sx={primaryButton}>Onayla ve yayınla</Button>
                      <Button color="error" onClick={() => { setFeaturedRejecting(item); setFeaturedRejectReason(''); }} sx={{ fontWeight: 800 }}>Reddet</Button>
                    </Box>
                  ) : null}
                  {isLiveFeatured(item) ? (
                    <Button
                      color="error"
                      onClick={() => { setFeaturedRemoving(item); setFeaturedRemoveReason(''); }}
                      sx={{ fontWeight: 800, mt: 1.8 }}
                    >
                      Vitrinden kaldır
                    </Button>
                  ) : null}
                </PanelCard>
              ))}
            </Box>
          )}
        </Box>
      )}

      {view === 'week' && (
        <Box>
          <SectionTitle
            overline="VİTRİN"
            title="Haftanın atölyeleri"
            subtitle="3 mağaza, 7 gün. Dekontu onayla, ücretsiz ver veya yayındakini kaldır. Doluyken yalnızca uzatma onaylanır."
          />
          <PanelCard sx={{ mb: 2.2 }}>
            <Typography sx={{ fontWeight: 900, color: T.navy }}>Kapasite</Typography>
            <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.4 }}>
              {weekSlots.used}/{weekSlots.total} atölye vitrinde
              {weekSlots.nextFreeAt ? ` · sıradaki boşalma ${when(weekSlots.nextFreeAt)}` : ''}
            </Typography>
            <Box sx={{ mt: 1.4, height: 8, borderRadius: 99, bgcolor: T.surfaceSoft, overflow: 'hidden' }}>
              <Box sx={{ width: `${Math.min(100, (Number(weekSlots.used) / Number(weekSlots.total || ATELIER_WEEK_SLOTS)) * 100)}%`, height: '100%', bgcolor: weekSlots.free <= 0 ? T.rose : T.navy }} />
            </Box>
          </PanelCard>
          <PanelCard sx={{ mb: 2.2 }}>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Ücretsiz hafta</Typography>
            <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.4 }}>Onaylı atölyeye 7 gün hediye. Vitrin doluysa yalnızca zaten vitrindeki mağazaya süre ekler.</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 2fr auto' }, gap: 1.2, alignItems: 'start' }}>
              <TextField
                select
                label="Atölye"
                value={giftSellerId}
                onChange={(e) => setGiftSellerId(e.target.value)}
                sx={fieldSx}
              >
                <MenuItem value="">Seçin</MenuItem>
                {sellers.filter((shop) => shop.durum === 'approved').map((shop) => (
                  <MenuItem key={shop._id} value={shop._id}>
                    {shop.magazaAdi}{shop.isWeeklyAtelier ? ' · vitrinde' : ''}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Not (isteğe bağlı)" value={giftWeekNote} onChange={(e) => setGiftWeekNote(e.target.value)} sx={fieldSx} />
              <Button onClick={giftWeek} disabled={savingWeekGift || !giftSellerId} sx={primaryButton}>
                {savingWeekGift ? 'Veriliyor...' : 'Hediye et'}
              </Button>
            </Box>
          </PanelCard>
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2.2 }}>
            {[['pending', 'Sırada'], ['live', 'Vitrinde'], ['ended', 'Biten'], ['all', 'Tümü']].map(([id, label]) => (
              <Chip
                key={id}
                clickable
                label={label}
                onClick={() => setWeekFilter(id)}
                sx={{
                  fontWeight: 800,
                  bgcolor: weekFilter === id ? T.navy : '#fff',
                  color: weekFilter === id ? '#fff' : T.navy,
                  border: `1px solid ${weekFilter === id ? T.navy : T.line}`
                }}
              />
            ))}
          </Box>
          {weekRequests.filter((item) => matchesWeekFilter(item) && (!q || `${item.seller?.magazaAdi || ''} ${item.seller?.adSoyad || ''} ${item.seller?.email || ''}`.toLowerCase().includes(q))).length === 0 ? (
            <PanelCard><Typography sx={{ color: T.muted, fontWeight: 700 }}>Bu filtrede talep yok.</Typography></PanelCard>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
              {weekRequests.filter((item) => matchesWeekFilter(item) && (!q || `${item.seller?.magazaAdi || ''} ${item.seller?.adSoyad || ''} ${item.seller?.email || ''}`.toLowerCase().includes(q))).map((item) => (
                <PanelCard key={item.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ fontWeight: 900, color: T.navy }}>{item.seller?.magazaAdi || item.seller?.adSoyad || 'Atölye'}</Typography>
                    <StatusChip map={ATELIER_WEEK_STATUS} value={item.status} />
                  </Box>
                  <Typography sx={{ color: T.muted, fontSize: '0.84rem', mb: 0.8 }}>
                    {item.seller?.adSoyad || ''}{item.seller?.email ? ` · ${item.seller.email}` : ''} · {item.days} gün · {Number(item.price) === 0 ? 'Ücretsiz' : money(item.price)}
                  </Typography>
                  {item.note ? <Typography sx={{ color: T.navy, fontSize: 13 }}>{item.note}</Typography> : null}
                  {item.endsAt ? <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.4 }}>Bitiş: {when(item.endsAt)}{item.remainingDays ? ` · ${item.remainingDays} gün` : ''}</Typography> : null}
                  {item.rejectionReason ? <Typography sx={{ color: '#96393C', fontSize: 12, mt: 0.4 }}>{item.rejectionReason}</Typography> : null}
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
                          onClick={() => setWeekReceiptView(item)}
                          sx={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: '16px', bgcolor: T.surfaceSoft, cursor: 'zoom-in', border: `1px solid ${T.line}` }}
                        />
                      )}
                    </Box>
                  ) : item.status === 'pending' ? (
                    <Typography sx={{ color: '#96393C', fontSize: 13, fontWeight: 700, mt: 1.4 }}>Dekont yüklenmemiş. Onay verilemez.</Typography>
                  ) : null}
                  {item.status === 'pending' ? (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1.8, flexWrap: 'wrap' }}>
                      <Button disabled={!item.receiptUrl} onClick={() => reviewWeek(item.id, 'approved')} sx={primaryButton}>Onayla ve yayınla</Button>
                      <Button color="error" onClick={() => { setWeekRejecting(item); setWeekRejectReason(''); }} sx={{ fontWeight: 800 }}>Reddet</Button>
                    </Box>
                  ) : null}
                  {isLiveWeek(item) ? (
                    <Button
                      color="error"
                      onClick={() => { setWeekRemoving(item); setWeekRemoveReason(''); }}
                      sx={{ fontWeight: 800, mt: 1.8 }}
                    >
                      Vitrinden kaldır
                    </Button>
                  ) : null}
                </PanelCard>
              ))}
            </Box>
          )}
        </Box>
      )}

      {view === 'ads' && (
        <Box>
          <SectionTitle
            overline="REKLAM"
            title="Reklam ve vitrin panosu"
            subtitle="Hangi ürünün reklama çıkabileceğini, yapay zeka önerilerini ve diğer pazarlardaki talep eğilimlerini buradan izleyin. Vitrine alma işlemi ücretsiz hediye slot kullanır."
          />
          <AdminAdsBoard
            query={query}
            onOpenFeatured={() => goView('featured')}
            onGift={async (payload) => {
              try {
                await giftFeaturedProduct(payload);
              } catch (err) {
                fail(err, 'Vitrine alınamadı.');
                throw err;
              }
            }}
          />
        </Box>
      )}

      {view === 'reports' && (
        <AdminPlatformReport report={report} query={query} />
      )}

      {view === 'commission' && (
        <Box>
          <SectionTitle
            overline="SÜPER ADMİN HESABI"
            title="Satıcı ödemeleri"
            subtitle="Hangi atölyeden ne kadar satış geldiğini, sende kalan komisyonu ve satıcıya ödemen gereken tutarı görün."
          />
          <AdminCommission
            query={query}
            data={report?.commission}
            onChanged={load}
            onMessage={flash}
            onError={(text) => setError(text)}
          />
        </Box>
      )}

      {view === 'bank' && (
        <AdminBankAccounts
          query={query}
          sellers={sellers}
          bank={{ name: bankName, holder: bankHolder, iban: bankIban }}
          onMessage={flash}
          onError={(text) => setError(text)}
          onBankSaved={(bank) => {
            setBankName(bank.name || '');
            setBankHolder(bank.holder || '');
            setBankIban(bank.iban || '');
          }}
        />
      )}

      {view === 'orders' && (
        <Box>
          <SectionTitle
            overline="SİPARİŞ YÖNETİMİ"
            title="Siparişler"
            subtitle="Sipariş akışını satıcı yönetir. Havale / EFT ödemelerini buradan işaretleyebilirsiniz."
            action={
              <Select size="small" fullWidth value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} sx={{ minWidth: { sm: 190 }, width: { xs: '100%', sm: 190 }, bgcolor: '#fff', borderRadius: '12px' }}>
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
              <Select size="small" fullWidth value={productFilter} onChange={(e) => setProductFilter(e.target.value)} sx={{ minWidth: { sm: 190 }, width: { xs: '100%', sm: 190 }, bgcolor: '#fff', borderRadius: '12px' }}>
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
          <SectionTitle overline="MAĞAZALAR" title="Satıcılar" subtitle="Başvuruları onaylayın. Oranı yazınca kilitlenir; boş bırakırsanız 90 günde 50.000 ₺ ciroda %8, altında %10 uygulanır." />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
            {filteredSellers.map((seller) => (
              <PanelCard key={seller._id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, color: T.navy }}>{seller.magazaAdi}</Typography>
                    <Typography sx={{ color: T.muted, fontSize: '0.85rem' }}>{seller.user?.adSoyad || seller.adSoyad || seller.ibanHolder} · {seller.user?.email}</Typography>
                    <Typography sx={{ color: T.muted, fontSize: '0.85rem' }}>
                      {seller.sehir}/{seller.ilce} · {(Array.isArray(seller.magazaTuru) ? seller.magazaTuru : [seller.magazaTuru]).filter(Boolean).map(categoryLabel).join(' · ') || seller.magazaTuru} · {seller.telefon}
                    </Typography>
                    <Typography sx={{ color: T.navy, fontSize: '0.82rem', fontWeight: 800, mt: 0.7, letterSpacing: 0.2, wordBreak: 'break-all' }}>
                      {seller.ibanHolder ? `${seller.ibanHolder} · ` : ''}{seller.iban || 'IBAN yok'}
                    </Typography>
                    <Typography sx={{ color: T.muted, fontSize: '0.8rem', mt: 0.6 }}>
                      {seller.komisyonManuel
                        ? `Manuel kilit · %${seller.komisyonOrani}`
                        : seller.komisyonHacim?.qualifies
                          ? `Otomatik hacim · son ${seller.komisyonHacim.windowDays} günde ${money(seller.komisyonHacim.gmv)} · %${seller.komisyonHacim.volumeRate}`
                          : `Otomatik %${seller.komisyonHacim?.defaultRate ?? 10} · %${seller.komisyonHacim?.volumeRate ?? 8} için ${money(seller.komisyonHacim?.remaining ?? 50000)} kaldı`}
                    </Typography>
                  </Box>
                  <StatusChip map={SELLER_STATUS} value={seller.durum} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1.8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Komisyon %"
                    defaultValue={seller.komisyonOrani != null ? seller.komisyonOrani : 10}
                    key={`${seller._id}-${seller.komisyonOrani}-${seller.komisyonManuel}`}
                    inputProps={{ min: 0, max: 80, step: 0.5 }}
                    sx={{ ...fieldSx, width: 140 }}
                    onBlur={async (event) => {
                      if (event.target.value === '') return;
                      const next = Number(event.target.value);
                      const current = seller.komisyonOrani != null ? seller.komisyonOrani : 10;
                      if (!Number.isFinite(next) || next === current) return;
                      try {
                        await adminService.setSellerCommission(seller._id, { komisyonOrani: next });
                        flash(`${seller.magazaAdi} komisyonu %${next} kilitlendi. Yeni satışlara uygulanır.`);
                        await load();
                      } catch (err) {
                        fail(err, 'Komisyon kaydedilemedi.');
                      }
                    }}
                  />
                  {seller.komisyonManuel ? (
                    <Button
                      onClick={async () => {
                        try {
                          await adminService.setSellerCommission(seller._id, { otomatik: true });
                          flash(`${seller.magazaAdi} otomatik hacim kuralına alındı.`);
                          await load();
                        } catch (err) {
                          fail(err, 'Komisyon kaydedilemedi.');
                        }
                      }}
                      sx={{ fontWeight: 800 }}
                    >
                      Otomatiğe dön
                    </Button>
                  ) : null}
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
        <AdminSiteContent
          items={lookbook}
          products={products}
          onChanged={load}
          onMessage={flash}
          onError={(text) => setError(text)}
        />
      )}

      {view === 'categories' && (
        <AdminCategories
          onMessage={flash}
          onError={(text) => setError(text)}
          onChanged={async () => {
            try {
              const cats = await adminService.categories();
              setCatalogCategories(cats.categories || []);
            } catch {
              /* liste AdminCategories içinde yenilenir */
            }
          }}
        />
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
                {categoryOptions.map((item) => (
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
              <Typography sx={{ color: T.muted, fontSize: 12, px: 1 }}>
                Vitrin yalnızca Öne çıkanlar sekmesinden (onay, ücretsiz hediye veya kaldırma) yönetilir.
              </Typography>
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

      <Dialog open={Boolean(weekReceiptView)} onClose={() => setWeekReceiptView(null)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>
          {weekReceiptView?.seller?.magazaAdi || 'Dekont'} · {weekReceiptView ? (Number(weekReceiptView.price) === 0 ? 'Ücretsiz' : money(weekReceiptView.price)) : ''}
        </DialogTitle>
        <DialogContent>
          {weekReceiptView?.receiptUrl ? (
            <Box component="img" src={weekReceiptView.receiptUrl} alt="Dekont" sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '16px', bgcolor: T.surfaceSoft }} />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button href={weekReceiptView?.receiptUrl || '#'} target="_blank" rel="noreferrer" sx={{ fontWeight: 800, color: T.navy }}>Yeni sekmede aç</Button>
          <Button onClick={() => setWeekReceiptView(null)} sx={{ fontWeight: 800, color: T.muted }}>Kapat</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(weekRemoving)} onClose={() => setWeekRemoving(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '22px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>Haftanın vitrinden kaldır</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.muted, mb: 2 }}>
            <b>{weekRemoving?.seller?.magazaAdi}</b> süresi bitmeden ana sayfa şeridinden çıkarılacak.
          </Typography>
          <TextField
            fullWidth
            label="Not (isteğe bağlı)"
            value={weekRemoveReason}
            onChange={(e) => setWeekRemoveReason(e.target.value)}
            multiline
            minRows={3}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setWeekRemoving(null)} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button color="error" onClick={removeWeek} sx={{ fontWeight: 800 }}>Kaldır</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(weekRejecting)} onClose={() => setWeekRejecting(null)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '22px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>Talebi reddet</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.muted, mb: 2 }}>{weekRejecting?.seller?.magazaAdi}</Typography>
          <TextField
            fullWidth
            label="Ret nedeni (isteğe bağlı)"
            value={weekRejectReason}
            onChange={(e) => setWeekRejectReason(e.target.value)}
            multiline
            minRows={3}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setWeekRejecting(null)} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button
            color="error"
            onClick={() => reviewWeek(weekRejecting.id, 'rejected', weekRejectReason)}
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
              {(() => {
                const share = platformShareOf(openOrder);
                if (!share.fee) return null;
                return (
                  <Box sx={{ mt: 1.2, pt: 1.2, borderTop: `1px dashed ${T.line}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                      <Typography sx={{ color: T.rose, fontWeight: 800 }}>Platform payı (%{share.percent})</Typography>
                      <Typography sx={{ fontWeight: 900, color: T.rose }}>{money(share.fee)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                      <Typography sx={{ color: T.muted, fontWeight: 700 }}>Satıcılara kalan</Typography>
                      <Typography sx={{ fontWeight: 800, color: T.navy }}>{money(share.net)}</Typography>
                    </Box>
                  </Box>
                );
              })()}
              {openOrder.paymentMethod === 'transfer' ? (
                <Box sx={{ mt: 1.6, mb: 1.2, p: 1.6, borderRadius: '16px', border: `1px dashed ${T.line}`, bgcolor: T.surfaceSoft }}>
                  <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.6 }}>Müşteriye gösterilen havale</Typography>
                  <BankTransferDetails
                    bank={openOrder.bankAccount?.iban ? openOrder.bankAccount : { name: bankName, holder: bankHolder, iban: bankIban }}
                    amount={openOrder.totalPrice}
                    note={openOrder._id ? `Açıklama: ${openOrder._id}` : ''}
                  />
                </Box>
              ) : null}
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
