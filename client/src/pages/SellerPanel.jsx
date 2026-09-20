import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Select
} from '@mui/material';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import QuestionAnswerOutlined from '@mui/icons-material/QuestionAnswerOutlined';
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import CelebrationOutlined from '@mui/icons-material/CelebrationOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import PanelShell, { PanelCard, SectionTitle, StatusChip, fieldSx, primaryButton, panelButton } from '../components/PanelShell';
import { PageSpinner } from '../components/LoadingButton';
import SellerProductEditor, { emptyProductForm, formFromProduct } from '../components/SellerProductEditor';
import ProductMarginCalculator from '../components/ProductMarginCalculator';
import SellerPerformanceReport from '../components/SellerPerformanceReport';
import SellerAdsBoard from '../components/SellerAdsBoard';
import SellerOrderDetail from '../components/SellerOrderDetail';
import SellerOrders from '../components/SellerOrders';
import { sellerService } from '../api/sellerService';
import { questionService } from '../api/questionService';
import { isSellerRole } from '../utils/roles';
import { asMagazaTurleri, formatIban, sanitizeIban } from '../utils/sellerValidation';
import { APPROVAL_STATUS, ORDER_STATUS, T, money, when } from '../utils/panel';
import { salePriceOf } from '../utils/price';
import { CATEGORY_OPTIONS, categoryLabel } from '../utils/categories';
import { categoryService } from '../api/categoryService';
import { FEATURED_PACKAGES, FEATURED_STATUS, FEATURED_BANK, FEATURED_SLOTS, isLiveFeatured, isReceiptPdf } from '../utils/featured';
import { ATELIER_WEEK_PACKAGE, ATELIER_WEEK_SLOTS, ATELIER_WEEK_STATUS, isLiveWeek } from '../utils/atelierWeek';

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

export default function SellerPanel({ user, handleLogout }) {
  const [view, setView] = useState('dashboard');
  const [growTab, setGrowTab] = useState('featured');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionFilter, setQuestionFilter] = useState('all');
  const [answerOpen, setAnswerOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProductForm);
  const [mainImage, setMainImage] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productFilter, setProductFilter] = useState('all');
  const [store, setStore] = useState(null);
  const [savingStore, setSavingStore] = useState(false);
  const [magazaTurleri, setMagazaTurleri] = useState(CATEGORY_OPTIONS);
  const [removing, setRemoving] = useState(null);
  const [promos, setPromos] = useState([]);
  const [promoForm, setPromoForm] = useState({ code: '', percent: 10, minSubtotal: 0, note: '', isActive: true });
  const [savingPromo, setSavingPromo] = useState(false);
  const [featuredRequests, setFeaturedRequests] = useState([]);
  const [featuredSlots, setFeaturedSlots] = useState({ used: 0, total: FEATURED_SLOTS, free: FEATURED_SLOTS, nextFreeAt: null });
  const [featuredBank, setFeaturedBank] = useState(FEATURED_BANK);
  const [featuredPackages, setFeaturedPackages] = useState(FEATURED_PACKAGES);
  const [featureOpen, setFeatureOpen] = useState(false);
  const [featureTarget, setFeatureTarget] = useState(null);
  const [featureDays, setFeatureDays] = useState(3);
  const [featureNote, setFeatureNote] = useState('');
  const [featureReceipt, setFeatureReceipt] = useState(null);
  const [savingFeature, setSavingFeature] = useState(false);
  const [weekRequests, setWeekRequests] = useState([]);
  const [weekSlots, setWeekSlots] = useState({ used: 0, total: ATELIER_WEEK_SLOTS, free: ATELIER_WEEK_SLOTS, nextFreeAt: null });
  const [weekBank, setWeekBank] = useState(FEATURED_BANK);
  const [weekPack, setWeekPack] = useState(ATELIER_WEEK_PACKAGE);
  const [weekLive, setWeekLive] = useState(false);
  const [weekOpen, setWeekOpen] = useState(false);
  const [weekNote, setWeekNote] = useState('');
  const [weekReceipt, setWeekReceipt] = useState(null);
  const [savingWeek, setSavingWeek] = useState(false);
  const [report, setReport] = useState(null);

  const fail = (err, fallback) => setError(err.response?.data?.mesaj || fallback);
  const flash = (text) => {
    setMessage(text);
    setError('');
  };

  const loadStore = async () => {
    const data = await sellerService.getMe();
    setSeller(data.satici);
    setStore({
      magazaAdi: data.satici.magazaAdi || '',
      magazaTuru: asMagazaTurleri(data.satici.magazaTuru),
      aciklama: data.satici.aciklama || '',
      telefon: data.satici.telefon || '',
      sehir: data.satici.sehir || '',
      ilce: data.satici.ilce || '',
      adres: data.satici.adres || '',
      iban: formatIban(data.satici.iban || ''),
      ibanHolder: data.satici.ibanHolder || data.satici.kullanici?.adSoyad || '',
      instagram: data.satici.instagram || '',
      website: data.satici.website || ''
    });
    return data.satici;
  };

  const loadPanel = async () => {
    const ov = await sellerService.getOverview();
    setOverview(ov.overview);

    const [pr, or, qs, pm, ft, wk, rp] = await Promise.all([
      sellerService.getMyProducts(),
      sellerService.getMyOrders(),
      questionService.getSellerInbox('all'),
      sellerService.getMyPromos(),
      sellerService.getMyFeatured().catch(() => ({ requests: [] })),
      sellerService.getMyAtelierWeek().catch(() => ({ requests: [] })),
      sellerService.getMyReports().catch(() => ({ report: null }))
    ]);
    setProducts(pr.products || []);
    setOrders(or.orders || []);
    setQuestions(qs.questions || []);
    setPromos(pm.promos || []);
    setFeaturedRequests(ft.requests || []);
    if (ft.slots) setFeaturedSlots(ft.slots);
    if (ft.bank?.name) setFeaturedBank(ft.bank);
    if (ft.packages?.length) setFeaturedPackages(ft.packages);
    setWeekRequests(wk.requests || []);
    if (wk.slots) setWeekSlots(wk.slots);
    if (wk.bank?.name) setWeekBank(wk.bank);
    if (wk.packages?.[0]) setWeekPack(wk.packages[0]);
    setWeekLive(Boolean(wk.live));
    setReport(rp.report || null);
  };

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        const current = await loadStore();
        if (!active || current?.durum !== 'approved') return;
        await loadPanel();
      } catch (err) {
        if (active) fail(err, 'Mağaza verileri yüklenemedi.');
      } finally {
        if (active) setLoading(false);
      }
    };
    boot();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    categoryService.getAllCategories()
      .then((data) => {
        if (!alive) return;
        const fromApi = (data.categories || [])
          .filter((item) => item?.categoryId)
          .map((item) => ({
            value: String(item.categoryId).toLowerCase(),
            label: item.name || categoryLabel(item.categoryId)
          }));
        if (!fromApi.length) return;
        const map = new Map(CATEGORY_OPTIONS.map((item) => [item.value, item.label]));
        fromApi.forEach((item) => map.set(item.value, item.label));
        setMagazaTurleri([...map.entries()].map(([value, label]) => ({ value, label })));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const q = query.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productFilter === 'live' && !(p.isActive && p.approvalStatus === 'approved')) return false;
      if (productFilter === 'hidden' && p.isActive) return false;
      if (productFilter === 'pending' && p.approvalStatus !== 'pending') return false;
      if (productFilter === 'rejected' && p.approvalStatus !== 'rejected') return false;
      if (productFilter === 'low' && p.stock > 5) return false;
      if (!q) return true;
      return `${p.title} ${p.category} ${p.productCode} ${p.description}`.toLowerCase().includes(q);
    });
  }, [products, q, productFilter]);
  const filteredQuestions = useMemo(() => {
    return questions.filter((item) => {
      const open = !String(item.answer || '').trim();
      if (questionFilter === 'unanswered' && !open) return false;
      if (questionFilter === 'answered' && open) return false;
      if (questionFilter === 'overdue' && !item.overdue) return false;
      if (!q) return true;
      return `${item.question} ${item.answer} ${item.user?.adSoyad} ${item.product?.title}`.toLowerCase().includes(q);
    });
  }, [questions, q, questionFilter]);
  const filteredPromos = useMemo(
    () => promos.filter((promo) => {
      if (!q) return true;
      return `${promo.code} ${promo.note} ${promo.percent}`.toLowerCase().includes(q);
    }),
    [promos, q]
  );
  const filteredFeatured = useMemo(
    () => featuredRequests.filter((item) => {
      if (!q) return true;
      return `${item.product?.title || ''} ${item.status} ${item.days}`.toLowerCase().includes(q);
    }),
    [featuredRequests, q]
  );
  const pendingFeaturedProductIds = useMemo(
    () => new Set(featuredRequests.filter((item) => item.status === 'pending').map((item) => String(item.product?.id || ''))),
    [featuredRequests]
  );
  const liveFeaturedProductIds = useMemo(
    () => new Set(featuredRequests.filter(isLiveFeatured).map((item) => String(item.product?.id || ''))),
    [featuredRequests]
  );
  const filteredWeek = useMemo(
    () => weekRequests.filter((item) => {
      if (!q) return true;
      return `${item.status} ${item.days} ${item.note || ''}`.toLowerCase().includes(q);
    }),
    [weekRequests, q]
  );
  const hasPendingWeek = weekRequests.some((item) => item.status === 'pending');
  const shopIsWeekly = weekLive || Boolean(seller?.isWeeklyAtelier) || weekRequests.some(isLiveWeek);
  const weekFull = Number(weekSlots.free || 0) <= 0;
  const weekLocked = weekFull && !shopIsWeekly;
  const vitrinFull = Number(featuredSlots.free || 0) <= 0;
  const liveFeatureProducts = useMemo(
    () => products.filter((p) => p.approvalStatus === 'approved' && p.isActive),
    [products]
  );

  if (!user) return <Navigate to="/giris" replace />;
  if (!isSellerRole(user.rol)) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: `linear-gradient(180deg, ${T.cream} 0%, ${T.creamDeep} 100%)` }}>
        <PageSpinner minHeight="auto" />
      </Box>
    );
  }

  if (!seller || seller.durum !== 'approved') return <Navigate to="/satici-ol" replace />;

  const refresh = async () => {
    try {
      await loadPanel();
    } catch (err) {
      fail(err, 'Veriler yenilenemedi.');
    }
  };

  const updateOrderStatus = async (id, orderStatus) => {
    setUpdatingOrder(id);
    try {
      const data = await sellerService.updateMyOrder(id, { orderStatus });
      await loadPanel();
      if (openOrder?._id === id) setOpenOrder(data.order || { ...openOrder, orderStatus });
      flash('Sipariş durumu güncellendi.');
    } catch (err) {
      fail(err, 'Sipariş güncellenemedi.');
    } finally {
      setUpdatingOrder('');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProductForm);
    setMainImage(null);
    setGallery([]);
    setRemovedImages([]);
    setView('editor');
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm(formFromProduct(product));
    setMainImage(null);
    setGallery([]);
    setRemovedImages([]);
    setView('editor');
  };

  const closeEditor = () => {
    setView('products');
    setEditing(null);
    setMainImage(null);
    setGallery([]);
    setRemovedImages([]);
  };

  const saveProduct = async () => {
    if (!form.title.trim() || !form.description.trim() || form.price === '' || form.stock === '') {
      setError('Başlık, açıklama, fiyat ve stok zorunludur.');
      return;
    }
    if (!editing && !mainImage?.file) {
      setError('Kapak görseli yüklemelisiniz.');
      return;
    }
    setSavingProduct(true);
    setError('');
    try {
      const body = new FormData();
      body.append('title', form.title.trim());
      body.append('description', form.description.trim());
      body.append('category', form.category);
      body.append('price', form.price);
      body.append('costPrice', form.costPrice || 0);
      body.append('shippingCostCover', form.shippingCost || 0);
      body.append('extraCost', form.extraCost || 0);
      body.append('stock', form.stock);
      body.append('discountPercentage', form.discountPercentage || 0);
      body.append('colors', (form.colors || []).join(', '));
      body.append('sizes', (form.sizes || []).join(', '));
      body.append('features', (form.features || []).join(', '));
      body.append('careInstructions', form.careInstructions || '');
      body.append('immediateDelivery', String(form.immediateDelivery));
      body.append('customProductionTime', form.customProductionTime);
      body.append('measureNote', form.measureNote || '');
      body.append('video', form.video || '');
      body.append('widthCm', form.widthCm);
      body.append('heightCm', form.heightCm);
      body.append('depthCm', form.depthCm);
      body.append('strapCm', form.strapCm);
      body.append('weightG', form.weightG);
      body.append('fits', form.fits || '');
      if (mainImage?.file) body.append('image', mainImage.file);
      gallery.forEach((item) => body.append('gallery', item.file));
      if (removedImages.length) body.append('removeImages', removedImages.join(','));

      const data = editing
        ? await sellerService.updateProduct(editing._id, body)
        : await sellerService.createProduct(body);
      flash(data.mesaj || (editing ? 'Ürün güncellendi.' : 'Ürün onaya gönderildi.'));
      closeEditor();
      await refresh();
    } catch (err) {
      fail(err, 'Ürün kaydedilemedi.');
    } finally {
      setSavingProduct(false);
    }
  };

  const removeProduct = async () => {
    try {
      await sellerService.deleteProduct(removing._id);
      setRemoving(null);
      flash('Ürün silindi.');
      await refresh();
    } catch (err) {
      fail(err, 'Ürün silinemedi.');
    }
  };

  const toggleActive = async (product) => {
    try {
      await sellerService.updateProduct(product._id, { isActive: !product.isActive });
      await refresh();
    } catch (err) {
      fail(err, 'Durum değiştirilemedi.');
    }
  };

  const saveStore = async (event) => {
    event.preventDefault();
    setSavingStore(true);
    setError('');
    try {
      const data = await sellerService.updateMe({
        ...store,
        iban: sanitizeIban(store.iban),
        ibanHolder: String(store.ibanHolder || '').trim(),
        adSoyad: String(store.ibanHolder || '').trim()
      });
      setSeller(data.satici);
      setStore((s) => ({
        ...s,
        iban: formatIban(data.satici.iban || s.iban),
        ibanHolder: data.satici.ibanHolder || s.ibanHolder
      }));
      flash(data.mesaj || 'Mağaza güncellendi.');
    } catch (err) {
      fail(err, 'Güncelleme başarısız.');
    } finally {
      setSavingStore(false);
    }
  };

  const savePromo = async (event) => {
    event.preventDefault();
    try {
      setSavingPromo(true);
      await sellerService.createPromo({
        code: promoForm.code,
        percent: Number(promoForm.percent),
        minSubtotal: Number(promoForm.minSubtotal) || 0,
        note: promoForm.note,
        isActive: promoForm.isActive
      });
      setPromoForm({ code: '', percent: 10, minSubtotal: 0, note: '', isActive: true });
      flash('Kampanya kodu eklendi. Yalnızca senin ürünlerinde geçerli.');
      await refresh();
    } catch (err) {
      fail(err, 'Kampanya eklenemedi.');
    } finally {
      setSavingPromo(false);
    }
  };

  const togglePromo = async (promo) => {
    try {
      await sellerService.updatePromo(promo.id, { isActive: !promo.isActive });
      flash(promo.isActive ? 'Kampanya durduruldu.' : 'Kampanya açıldı.');
      await refresh();
    } catch (err) {
      fail(err, 'Kampanya güncellenemedi.');
    }
  };

  const removePromo = async (promo) => {
    try {
      await sellerService.deletePromo(promo.id);
      flash('Kampanya kodu silindi.');
      await refresh();
    } catch (err) {
      fail(err, 'Kampanya silinemedi.');
    }
  };

  const openFeature = (product = null) => {
    setFeatureTarget(product);
    setFeatureDays(3);
    setFeatureNote('');
    setFeatureReceipt(null);
    setFeatureOpen(true);
  };

  const closeFeature = () => {
    if (featureReceipt?.preview) URL.revokeObjectURL(featureReceipt.preview);
    setFeatureOpen(false);
    setFeatureTarget(null);
    setFeatureReceipt(null);
  };

  const pickFeatureReceipt = (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;
    const ok = file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!ok) {
      setError('Dekont için görsel veya PDF yükleyin.');
      return;
    }
    if (featureReceipt?.preview) URL.revokeObjectURL(featureReceipt.preview);
    setFeatureReceipt({
      file,
      preview: URL.createObjectURL(file),
      isPdf: file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    });
    setError('');
  };

  const submitFeature = async () => {
    if (!featureTarget || !featureReceipt?.file) return;
    setSavingFeature(true);
    try {
      const body = new FormData();
      body.append('productId', featureTarget._id);
      body.append('days', featureDays);
      body.append('note', featureNote);
      body.append('receipt', featureReceipt.file);
      await sellerService.createFeatured(body);
      flash(featureTarget?.isSponsored || liveFeaturedProductIds.has(String(featureTarget?._id))
        ? 'Uzatma dekontu gönderildi. Onaylanınca mevcut vitrin süren uzar.'
        : 'Dekont gönderildi. Onaylanırsa ürün 12 kişilik vitrine çıkar.');
      closeFeature();
      await refresh();
    } catch (err) {
      fail(err, 'Talep gönderilemedi.');
    } finally {
      setSavingFeature(false);
    }
  };

  const cancelFeature = async (item) => {
    try {
      await sellerService.cancelFeatured(item.id);
      flash('Talep iptal edildi.');
      await refresh();
    } catch (err) {
      fail(err, 'Talep iptal edilemedi.');
    }
  };

  const openWeek = () => {
    setWeekNote('');
    setWeekReceipt(null);
    setWeekOpen(true);
  };

  const closeWeek = () => {
    if (weekReceipt?.preview) URL.revokeObjectURL(weekReceipt.preview);
    setWeekOpen(false);
    setWeekReceipt(null);
  };

  const pickWeekReceipt = (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;
    const ok = file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!ok) {
      setError('Dekont için görsel veya PDF yükleyin.');
      return;
    }
    if (weekReceipt?.preview) URL.revokeObjectURL(weekReceipt.preview);
    setWeekReceipt({
      file,
      preview: URL.createObjectURL(file),
      isPdf: file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    });
    setError('');
  };

  const submitWeek = async () => {
    if (!weekReceipt?.file) return;
    setSavingWeek(true);
    try {
      const body = new FormData();
      body.append('days', weekPack.days || 7);
      body.append('note', weekNote);
      body.append('receipt', weekReceipt.file);
      await sellerService.createAtelierWeek(body);
      flash(shopIsWeekly
        ? 'Uzatma dekontu gönderildi. Onaylanınca mevcut hafta süren uzar.'
        : 'Dekont gönderildi. Onaylanırsa atölyen 3 kişilik haftalık vitrine çıkar.');
      closeWeek();
      await refresh();
    } catch (err) {
      fail(err, 'Talep gönderilemedi.');
    } finally {
      setSavingWeek(false);
    }
  };

  const cancelWeek = async (item) => {
    try {
      await sellerService.cancelAtelierWeek(item.id);
      flash('Talep iptal edildi.');
      await refresh();
    } catch (err) {
      fail(err, 'Talep iptal edilemedi.');
    }
  };

  const goView = (id) => {
    const growIds = ['featured', 'week', 'promos', 'ads', 'margin'];
    if (growIds.includes(id)) {
      setGrowTab(id);
      setView('grow');
      setQuery('');
      setMobileOpen(false);
      if (id !== 'editor') {
        setEditing(null);
        setMainImage(null);
        setGallery([]);
        setRemovedImages([]);
      }
      return;
    }
    setView(id);
    setQuery('');
    setQuestionFilter('all');
    setProductFilter('all');
    setMobileOpen(false);
    if (id !== 'editor') {
      setEditing(null);
      setMainImage(null);
      setGallery([]);
      setRemovedImages([]);
    }
  };

  const nav = [
    { id: 'dashboard', label: 'Ana sayfa', icon: DashboardOutlined },
    { id: 'orders', label: 'Siparişler', icon: ReceiptLongOutlined, badge: overview?.openOrders || 0 },
    { id: 'questions', label: 'Sorular', icon: QuestionAnswerOutlined, badge: overview?.unansweredQuestions || 0 },
    { id: 'products', label: 'Ürünlerim', icon: Inventory2Outlined, badge: overview?.pendingApproval || 0 },
    {
      id: 'grow',
      label: 'Vitrin',
      icon: AutoAwesomeOutlined,
      badge: (overview?.pendingFeatured || 0) + (overview?.pendingAtelierWeek || 0)
    },
    { id: 'reports', label: 'Raporlar', icon: AssessmentOutlined },
    { id: 'store', label: 'Mağaza', icon: StorefrontOutlined }
  ];

  const growTabs = [
    { id: 'featured', label: 'Öne çıkanlar' },
    { id: 'week', label: 'Haftanın atölyesi' },
    { id: 'promos', label: 'Kampanyalar' },
    { id: 'ads', label: 'Reklam' },
    { id: 'margin', label: 'Kar marjı' }
  ];

  const shellView = view === 'editor' ? 'products' : view === 'grow' ? 'grow' : view;
  const searchPlaceholder =
    view === 'orders' ? 'Müşteri, sipariş no veya ürün ara'
      : view === 'questions' ? 'Soru, ürün veya müşteri ara'
        : view === 'products' || view === 'editor' ? 'Ürün, kategori veya kod ara'
          : view === 'grow' && growTab === 'ads' ? 'Ürün veya kategori ara'
            : view === 'grow' && growTab === 'featured' ? 'Öne çıkan taleplerde ara'
              : view === 'grow' && growTab === 'week' ? 'Haftanın atölyesi taleplerinde ara'
                : view === 'grow' && growTab === 'promos' ? 'Kampanya kodu ara'
                  : view === 'reports' ? 'Raporlarda ara'
                    : 'Kendi ürün ve siparişlerinde ara';

  const openAnswer = (item) => {
    setActiveQuestion(item);
    setAnswerText(item.answer || '');
    setAnswerOpen(true);
  };

  const saveAnswer = async () => {
    if (!activeQuestion) return;
    setSavingAnswer(true);
    try {
      await questionService.answerQuestion(activeQuestion.id, answerText);
      flash('Yanıt kaydedildi.');
      setAnswerOpen(false);
      setActiveQuestion(null);
      await refresh();
    } catch (err) {
      fail(err, 'Yanıt kaydedilemedi.');
    } finally {
      setSavingAnswer(false);
    }
  };

  const removeQuestion = async (item) => {
    try {
      await questionService.deleteQuestion(item.id);
      flash('Soru silindi.');
      await refresh();
    } catch (err) {
      fail(err, 'Soru silinemedi.');
    }
  };

  return (
    <PanelShell
      nav={nav}
      view={shellView}
      onView={goView}
      user={user}
      roleLabel="Satıcı paneli"
      handleLogout={handleLogout}
      query={query}
      setQuery={setQuery}
      searchPlaceholder={searchPlaceholder}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      siteHref={seller.slug ? `/atolye/${seller.slug}` : '/'}
    >
      {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2, borderRadius: '14px' }} onClose={() => setMessage('')}>{message}</Alert> : null}
      {overview?.overdueQuestions > 0 ? (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: '14px', alignItems: 'center' }}
          action={<Button color="inherit" size="small" onClick={() => { setQuestionFilter('overdue'); goView('questions'); }} sx={{ fontWeight: 800 }}>Yanıtla</Button>}
        >
          {overview.overdueQuestions} müşteri sorusu 3 gündür yanıtsız. Bu bir uyarıdır — süre dolmuş soruları hemen yanıtlayın.
        </Alert>
      ) : overview?.unansweredQuestions > 0 ? (
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: '14px', alignItems: 'center' }}
          action={<Button color="inherit" size="small" onClick={() => { setQuestionFilter('unanswered'); goView('questions'); }} sx={{ fontWeight: 800 }}>Sorular</Button>}
        >
          {overview.unansweredQuestions} müşteri sorunuz var. 3 gün içinde yanıtlayın; süre dolunca uyarı düşer.
        </Alert>
      ) : null}

      {view === 'editor' && (
        <SellerProductEditor
          editing={editing}
          form={form}
          setForm={setForm}
          mainImage={mainImage}
          setMainImage={setMainImage}
          gallery={gallery}
          setGallery={setGallery}
          removedImages={removedImages}
          setRemovedImages={setRemovedImages}
          saving={savingProduct}
          onCancel={closeEditor}
          onSave={saveProduct}
          commissionPercent={seller?.komisyonOrani ?? 10}
        />
      )}

      {view === 'dashboard' && overview && (
        <Box>
          <SectionTitle
            overline="MAĞAZAM"
            title={seller.magazaAdi}
            subtitle="Sipariş, soru ve ürünlerinizi buradan yönetin."
            action={
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {seller.slug ? (
                  <Button
                    startIcon={<OpenInNewRounded />}
                    onClick={() => window.open(`/atolye/${seller.slug}`, '_blank')}
                    sx={{ ...panelButton, color: T.navy, border: `1px solid ${T.line}`, bgcolor: '#fff', px: 2 }}
                  >
                    Atölyeyi gör
                  </Button>
                ) : null}
                <Button startIcon={<AddRounded />} onClick={openCreate} sx={primaryButton}>Yeni ürün</Button>
              </Box>
            }
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.8, mb: 2 }}>
            <Box onClick={() => goView('orders')} sx={{ cursor: 'pointer' }}>
              <StatCard icon={ShoppingBagOutlined} title="Açık sipariş" value={overview.openOrders} hint={`${overview.orders} toplam`} tone={T.lavender} />
            </Box>
            <Box onClick={() => goView('questions')} sx={{ cursor: 'pointer' }}>
              <StatCard icon={QuestionAnswerOutlined} title="Yanıtsız soru" value={overview.unansweredQuestions || 0} hint={overview.overdueQuestions ? `${overview.overdueQuestions} süre aşımı` : '3 gün içinde yanıtlayın'} tone={overview.overdueQuestions ? '#C08A4A' : T.blue} />
            </Box>
            <Box onClick={() => goView('products')} sx={{ cursor: 'pointer' }}>
              <StatCard icon={Inventory2Rounded} title="Yayında" value={overview.published} hint={overview.pendingApproval ? `${overview.pendingApproval} onayda` : `${overview.products} toplam`} tone={T.navy} />
            </Box>
            <Box onClick={() => goView('reports')} sx={{ cursor: 'pointer' }}>
              <StatCard icon={PaymentsOutlined} title="Tahsilat" value={money(overview.revenue)} hint={`Pay %${seller?.komisyonOrani ?? 10}`} tone={T.rose} />
            </Box>
          </Box>

          {overview.pendingApproval > 0 && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
              {overview.pendingApproval} ürününüz onayda. Onaylanınca yayına alınır.
            </Alert>
          )}

          <PanelCard sx={{ p: 0, overflowX: 'auto' }}>
            <Box sx={{ px: 2.6, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 900, color: T.navy }}>Son siparişler</Typography>
              <Button onClick={() => goView('orders')} sx={{ fontWeight: 800, color: T.rose }}>Tümü</Button>
            </Box>
            <Table size="small">
              <TableBody>
                {(overview.recentOrders || []).slice(0, 5).map((order) => (
                  <TableRow key={order._id} hover sx={{ cursor: 'pointer' }} onClick={() => { setOpenOrder(order); goView('orders'); }}>
                    <TableCell sx={bodyCell}>
                      <Typography sx={{ fontWeight: 800 }}>{order.customerInfo?.firstName} {order.customerInfo?.lastName}</Typography>
                      <Typography sx={{ fontSize: 12, color: T.muted }}>
                        #{order.code || String(order._id).slice(-6).toUpperCase()} · {when(order.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>
                      {money(order.sellerNet != null ? order.sellerNet : order.sellerTotal)}
                    </TableCell>
                    <TableCell sx={bodyCell}>
                      <StatusChip map={ORDER_STATUS} value={order.orderStatus} />
                    </TableCell>
                  </TableRow>
                ))}
                {(overview.recentOrders || []).length === 0 && (
                  <TableRow><TableCell sx={{ ...bodyCell, color: T.muted }}>Henüz sipariş yok.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </PanelCard>
        </Box>
      )}

      {view === 'grow' && (
        <Box>
          <SectionTitle
            overline="VİTRİN"
            title="Büyüme araçları"
            subtitle="Öne çıkarma, kampanya, reklam ve fiyatlandırma."
          />
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2.2 }}>
            {growTabs.map((tab) => (
              <Chip
                key={tab.id}
                clickable
                label={tab.label}
                onClick={() => { setGrowTab(tab.id); setQuery(''); }}
                sx={{
                  fontWeight: 800,
                  bgcolor: growTab === tab.id ? T.navy : 'rgba(46,59,85,0.06)',
                  color: growTab === tab.id ? '#fff' : T.navy
                }}
              />
            ))}
          </Box>

          {growTab === 'margin' && (
            <Box>
              <SectionTitle
                overline="FİYATLAMA"
                title="Kar marjı hesapla"
                subtitle="Maliyet ve kargo masrafını yazın; site payı kart ücretini içerir."
                action={
                  <Button
                    startIcon={<AddRounded />}
                    onClick={() => {
                      setEditing(null);
                      setForm({
                        ...emptyProductForm,
                        costPrice: form.costPrice,
                        shippingCost: form.shippingCost,
                        extraCost: form.extraCost,
                        price: form.price
                      });
                      setMainImage(null);
                      setGallery([]);
                      setRemovedImages([]);
                      setView('editor');
                    }}
                    sx={primaryButton}
                  >
                    Bu fiyatla ürün ekle
                  </Button>
                }
              />
              <PanelCard>
                <ProductMarginCalculator
                  commissionPercent={seller?.komisyonOrani ?? 10}
                  costPrice={form.costPrice}
                  shippingCost={form.shippingCost}
                  extraCost={form.extraCost}
                  price={form.price}
                  onChange={setForm}
                />
              </PanelCard>
            </Box>
          )}
        </Box>
      )}

      {view === 'reports' && (
        <SellerPerformanceReport report={report} />
      )}

      {view === 'orders' && (
        <SellerOrders
          orders={orders}
          query={query}
          updatingOrder={updatingOrder}
          onOpen={setOpenOrder}
          onStatus={updateOrderStatus}
        />
      )}

      {view === 'questions' && (
        <Box>
          <SectionTitle
            overline="DESTEK"
            title="Müşteri soruları"
            subtitle="Yeni soru satıcıya düşer. 3 gün içinde yanıtlanmayan sorular uyarı olur."
            action={
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                {[
                  ['all', 'Tümü'],
                  ['unanswered', 'Yanıtsız'],
                  ['overdue', 'Uyarı'],
                  ['answered', 'Yanıtlanan']
                ].map(([id, label]) => (
                  <Chip
                    key={id}
                    clickable
                    label={label}
                    onClick={() => setQuestionFilter(id)}
                    sx={{
                      fontWeight: 800,
                      bgcolor: questionFilter === id ? T.rose : 'rgba(148,109,109,0.1)',
                      color: questionFilter === id ? '#FFFFFF' : T.navy
                    }}
                  />
                ))}
              </Box>
            }
          />
          <PanelCard sx={{ p: 0, overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Ürün', 'Soru', 'Durum', 'Tarih', ''].map((h) => (
                    <TableCell key={h} sx={headCell}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions.map((item) => {
                  const open = !String(item.answer || '').trim();
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell sx={bodyCell}>
                        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', minWidth: 0, flex: 1 }}>
                          {item.product?.image ? (
                            <Box component="img" src={item.product.image} alt="" sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '10px', bgcolor: T.surfaceSoft }} />
                          ) : null}
                          <Typography sx={{ fontWeight: 800 }}>{item.product?.title || 'Ürün'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ ...bodyCell, maxWidth: 420 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{item.user?.adSoyad || 'Misafir'}</Typography>
                        <Typography sx={{ fontSize: 13, color: T.navy }}>{item.question}</Typography>
                        {!open ? (
                          <Typography sx={{ fontSize: 12, color: T.muted, mt: 0.6 }}>Yanıt: {item.answer}</Typography>
                        ) : null}
                      </TableCell>
                      <TableCell sx={bodyCell}>
                        <Chip
                          size="small"
                          label={item.overdue ? 'Süre doldu — uyarı' : open ? 'Yanıt bekleniyor' : 'Yanıtlandı'}
                          sx={{ fontWeight: 800, bgcolor: item.overdue ? 'rgba(183,28,28,0.12)' : open ? 'rgba(192,138,74,0.2)' : 'rgba(150,190,150,0.24)', color: item.overdue ? '#8B1E1E' : open ? '#8A5A24' : '#3F6B47' }}
                        />
                        {open && item.dueAt ? (
                          <Typography sx={{ fontSize: 12, color: item.overdue ? '#8B1E1E' : T.muted, mt: 0.6, fontWeight: item.overdue ? 800 : 600 }}>
                            {item.overdue ? '3 gün geçti' : `Son tarih ${when(item.dueAt)}`}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell sx={{ ...bodyCell, color: T.muted, whiteSpace: 'nowrap' }}>{when(item.createdAt)}</TableCell>
                      <TableCell sx={{ ...bodyCell, whiteSpace: 'nowrap' }}>
                        <Button onClick={() => openAnswer(item)} sx={{ fontWeight: 800, color: T.rose }}>
                          {open ? 'Yanıtla' : 'Düzenle'}
                        </Button>
                        <Button color="error" onClick={() => removeQuestion(item)} sx={{ fontWeight: 800 }}>Sil</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredQuestions.length === 0 && (
                  <TableRow><TableCell colSpan={5} sx={{ ...bodyCell, color: T.muted }}>Gösterilecek soru yok.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </PanelCard>
        </Box>
      )}

      {view === 'products' && (
        <Box>
          <SectionTitle
            overline="KATALOĞUM"
            title="Ürünlerim"
            subtitle="Karttan tüm detaya girin. Görsel, ölçü, fiyat ve stok dahil her alanı siz güncellersiniz."
            action={<Button startIcon={<AddRounded />} onClick={openCreate} sx={primaryButton}>Yeni ürün</Button>}
          />
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2.2 }}>
            {[
              ['all', 'Tümü'],
              ['live', 'Yayında'],
              ['pending', 'Onayda'],
              ['hidden', 'Gizli'],
              ['rejected', 'Reddedilen'],
              ['low', 'Kritik stok']
            ].map(([id, label]) => (
              <Chip
                key={id}
                clickable
                label={label}
                onClick={() => setProductFilter(id)}
                sx={{
                  fontWeight: 800,
                  bgcolor: productFilter === id ? T.navy : '#fff',
                  color: productFilter === id ? '#fff' : T.navy,
                  border: `1px solid ${productFilter === id ? T.navy : T.line}`
                }}
              />
            ))}
          </Box>
          {filteredProducts.length === 0 ? (
            <PanelCard sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.8 }}>Henüz ürün yok</Typography>
              <Typography sx={{ color: T.muted, mb: 2 }}>Atölyenizin ilk parçasını ekleyin; onay sonrası vitrine düşer.</Typography>
              <Button onClick={openCreate} sx={primaryButton}>Ürün ekle</Button>
            </PanelCard>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.8 }}>
              {filteredProducts.map((product) => {
                const discount = Number(product.discountPercentage) || 0;
                const sale = salePriceOf(product);
                return (
                  <PanelCard key={product._id} sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ position: 'relative', height: 240, bgcolor: T.surfaceSoft }}>
                      <Box component="img" src={product.image} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
                        <StatusChip map={APPROVAL_STATUS} value={product.approvalStatus || 'approved'} />
                        <Chip
                          size="small"
                          label={product.isActive ? 'Yayında' : 'Gizli'}
                          sx={{ fontWeight: 800, bgcolor: '#fff', color: product.isActive ? '#3F6B47' : T.muted }}
                        />
                        {product.isSponsored ? (
                          <Chip size="small" label="Öne çıkan" sx={{ fontWeight: 800, bgcolor: T.navy, color: '#fff' }} />
                        ) : null}
                      </Box>
                    </Box>
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.6, flex: 1 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: T.lavender }}>
                        {categoryLabel(product.category).toUpperCase()}
                      </Typography>
                      <Typography sx={{ fontWeight: 900, color: T.navy, lineHeight: 1.3 }}>{product.title}</Typography>
                      <Typography sx={{ fontSize: 12, color: T.muted }}>
                        {product.productCode || 'Kod yok'} · Stok {product.stock}
                        {product.stock <= 5 ? ' · kritik' : ''}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mt: 0.4 }}>
                        <Typography sx={{ fontWeight: 900, color: T.navy }}>{money(sale)}</Typography>
                        {discount > 0 ? (
                          <Typography sx={{ fontSize: 12, color: T.muted, textDecoration: 'line-through' }}>{money(product.price)}</Typography>
                        ) : null}
                      </Box>
                      {product.approvalStatus === 'rejected' && product.rejectionReason ? (
                        <Typography sx={{ fontSize: 12, color: '#96393C' }}>{product.rejectionReason}</Typography>
                      ) : null}
                      <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mt: 'auto', pt: 1.4 }}>
                        <Button onClick={() => openEdit(product)} sx={{ ...panelButton, color: '#fff', bgcolor: T.navy, px: 1.6, '&:hover': { bgcolor: T.navyDeep } }}>
                          Detay / düzenle
                        </Button>
                        {product.approvalStatus === 'approved' && (
                          <Button onClick={() => toggleActive(product)} sx={{ ...panelButton, color: T.navy, border: `1px solid ${T.line}` }}>
                            {product.isActive ? 'Gizle' : 'Yayınla'}
                          </Button>
                        )}
                        {product.approvalStatus === 'approved' && product.isActive && (
                          <Button
                            disabled={pendingFeaturedProductIds.has(String(product._id)) || (vitrinFull && !product.isSponsored && !liveFeaturedProductIds.has(String(product._id)))}
                            onClick={() => openFeature(product)}
                            sx={{ ...panelButton, color: T.rose, border: `1px solid ${T.line}` }}
                          >
                            {pendingFeaturedProductIds.has(String(product._id))
                              ? 'Talepte'
                              : (product.isSponsored || liveFeaturedProductIds.has(String(product._id)))
                                ? 'Uzat'
                                : vitrinFull
                                  ? 'Vitrin dolu'
                                  : 'Öne çıkar'}
                          </Button>
                        )}
                        <Button onClick={() => window.open(`/urun/${product._id}`, '_blank')} sx={{ ...panelButton, color: T.rose, minWidth: 0, px: 1.2 }}>
                          <OpenInNewRounded sx={{ fontSize: 18 }} />
                        </Button>
                        <Button color="error" onClick={() => setRemoving(product)} sx={{ ...panelButton, ml: 'auto' }}>Sil</Button>
                      </Box>
                    </Box>
                  </PanelCard>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {view === 'grow' && growTab === 'promos' && (
        <Box>
          <SectionTitle
            overline="KAMPANYALAR"
            title="Atölye indirim kodları"
            subtitle="Kodlar yalnızca senin ürünlerinde geçerlidir."
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.3fr' }, gap: 1.8 }}>
            <PanelCard>
              <Box component="form" onSubmit={savePromo}>
                <TextField
                  fullWidth
                  label="Kod"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="ATOLYE10"
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
                  label="Minimum tutar (₺)"
                  value={promoForm.minSubtotal}
                  onChange={(e) => setPromoForm((p) => ({ ...p, minSubtotal: e.target.value }))}
                  helperText="Yalnızca senin ürünlerinin tutarına bakılır. 0 yazarsan eşik olmaz."
                  sx={{ ...fieldSx, mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Not (opsiyonel)"
                  value={promoForm.note}
                  onChange={(e) => setPromoForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Kendi ürünlerimde %10"
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
                    {['Kod', 'İndirim', 'Eşik', 'Kullanım', 'Durum', ''].map((h) => (
                      <TableCell key={h} sx={headCell}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPromos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ ...bodyCell, color: T.muted, py: 3 }}>
                        {promos.length === 0 ? 'Henüz kampanya kodun yok.' : 'Aramaya uyan kod yok.'}
                      </TableCell>
                    </TableRow>
                  ) : filteredPromos.map((promo) => (
                    <TableRow key={promo.id} hover>
                      <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{promo.code}</TableCell>
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

      {view === 'grow' && growTab === 'ads' && (
        <Box>
          <SectionTitle
            overline="REKLAM"
            title="Reklam asistanı"
            subtitle="Öne çıkarılacak ürünü satış verisiyle seçin."
          />
          <SellerAdsBoard
            query={query}
            products={products}
            onPromote={(product) => openFeature(product)}
            onOpenFeatured={() => goView('featured')}
          />
        </Box>
      )}

      {view === 'grow' && growTab === 'featured' && (
        <Box>
          <SectionTitle
            overline="VİTRİN"
            title="Öne çıkan ürün talepleri"
            subtitle="12 ürünlük vitrin. Havale + dekont; kart yok."
            action={liveFeatureProducts.length ? (
              <Button startIcon={<AutoAwesomeOutlined />} onClick={() => openFeature()} sx={primaryButton}>
                Yeni talep
              </Button>
            ) : null}
          />
          <PanelCard sx={{ mb: 2.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 900, color: T.navy }}>Vitrin kapasitesi</Typography>
                <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.3 }}>
                  {featuredSlots.used}/{featuredSlots.total} dolu
                  {vitrinFull && featuredSlots.nextFreeAt ? ` · sıradaki boşalma ${when(featuredSlots.nextFreeAt)}` : ''}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 900, color: vitrinFull ? T.rose : T.navy }}>
                {vitrinFull ? 'Dolu — yalnızca uzatma' : `${featuredSlots.free} yer boş`}
              </Typography>
            </Box>
            <Box sx={{ mt: 1.4, height: 8, borderRadius: 99, bgcolor: T.surfaceSoft, overflow: 'hidden' }}>
              <Box sx={{ width: `${Math.min(100, (Number(featuredSlots.used) / Number(featuredSlots.total || FEATURED_SLOTS)) * 100)}%`, height: '100%', bgcolor: vitrinFull ? T.rose : T.navy }} />
            </Box>
          </PanelCard>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.4, mb: 2.4 }}>
            {featuredPackages.map((pack) => (
              <PanelCard key={pack.days}>
                <Typography sx={{ fontWeight: 800, color: T.lavender, fontSize: 12, letterSpacing: 1 }}>{pack.label.toUpperCase()}</Typography>
                <Typography sx={{ fontWeight: 900, color: T.navy, fontSize: '1.6rem', mt: 0.4 }}>{money(pack.price)}</Typography>
                <Typography sx={{ color: T.muted, fontSize: 13 }}>{pack.hint} · 1 ürün</Typography>
              </PanelCard>
            ))}
          </Box>
          {filteredFeatured.length === 0 ? (
            <PanelCard sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.8 }}>Henüz talep yok</Typography>
              <Typography sx={{ color: T.muted }}>Yeni talep ile ürün ve paket seçin, veya yayındaki bir üründen “Öne çıkar”a basın.</Typography>
            </PanelCard>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
              {filteredFeatured.map((item) => (
                <PanelCard key={item.id}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box component="img" src={item.product?.image} alt="" sx={{ width: 88, height: 88, objectFit: 'cover', borderRadius: '16px', bgcolor: T.surfaceSoft }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                        <Typography sx={{ fontWeight: 900, color: T.navy }}>{item.product?.title || 'Ürün'}</Typography>
                        <StatusChip map={FEATURED_STATUS} value={item.status} />
                      </Box>
                      <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.4 }}>
                        {item.days} gün · {Number(item.price) === 0 ? 'Ücretsiz' : money(item.price)}
                        {item.remainingDays ? ` · ${item.remainingDays} gün kaldı` : ''}
                      </Typography>
                      {item.endsAt ? (
                        <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.3 }}>Bitiş: {when(item.endsAt)}</Typography>
                      ) : null}
                      {item.receiptUrl ? (
                        <Button
                          href={item.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          sx={{ ...panelButton, mt: 0.8, color: T.navy, px: 0, minWidth: 0 }}
                        >
                          {isReceiptPdf(item.receiptUrl) ? 'Dekontu aç (PDF)' : 'Dekontu gör'}
                        </Button>
                      ) : null}
                      {item.rejectionReason ? (
                        <Typography sx={{ color: '#96393C', fontSize: 12, mt: 0.6 }}>{item.rejectionReason}</Typography>
                      ) : null}
                    </Box>
                  </Box>
                  {item.status === 'pending' ? (
                    <Button onClick={() => cancelFeature(item)} sx={{ ...panelButton, mt: 1.6, color: T.muted }}>Talebi iptal et</Button>
                  ) : null}
                </PanelCard>
              ))}
            </Box>
          )}
        </Box>
      )}

      {view === 'grow' && growTab === 'week' && (
        <Box>
          <SectionTitle
            overline="VİTRİN"
            title="Haftanın atölyesi"
            subtitle="3 mağazalık şerit, 7 gün. Havale + dekont."
            action={liveFeatureProducts.length && !hasPendingWeek && !weekLocked ? (
              <Button startIcon={<CelebrationOutlined />} onClick={openWeek} sx={primaryButton}>
                {shopIsWeekly ? 'Uzat' : 'Talep gönder'}
              </Button>
            ) : null}
          />
          <PanelCard sx={{ mb: 2.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 900, color: T.navy }}>Vitrin kapasitesi</Typography>
                <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.3 }}>
                  {weekSlots.used}/{weekSlots.total} dolu
                  {weekFull && weekSlots.nextFreeAt ? ` · sıradaki boşalma ${when(weekSlots.nextFreeAt)}` : ''}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 900, color: weekLocked ? T.rose : T.navy }}>
                {weekLocked ? 'Dolu — yeni mağaza alınmaz' : shopIsWeekly && weekFull ? 'Dolu — uzatma açık' : `${weekSlots.free} yer boş`}
              </Typography>
            </Box>
            <Box sx={{ mt: 1.4, height: 8, borderRadius: 99, bgcolor: T.surfaceSoft, overflow: 'hidden' }}>
              <Box sx={{ width: `${Math.min(100, (Number(weekSlots.used) / Number(weekSlots.total || ATELIER_WEEK_SLOTS)) * 100)}%`, height: '100%', bgcolor: weekFull ? T.rose : T.navy }} />
            </Box>
          </PanelCard>
          <PanelCard sx={{ mb: 2.4 }}>
            <Typography sx={{ fontWeight: 800, color: T.lavender, fontSize: 12, letterSpacing: 1 }}>{(weekPack.label || '7 gün').toUpperCase()}</Typography>
            <Typography sx={{ fontWeight: 900, color: T.navy, fontSize: '1.6rem', mt: 0.4 }}>{money(weekPack.price)}</Typography>
            <Typography sx={{ color: T.muted, fontSize: 13 }}>{weekPack.hint || 'Haftanın atölyesi'} · tüm mağaza</Typography>
          </PanelCard>
          {filteredWeek.length === 0 ? (
            <PanelCard sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.8 }}>Henüz talep yok</Typography>
              <Typography sx={{ color: T.muted }}>
                {weekLocked
                  ? 'Vitrin dolu. Bir yer boşalınca başvurabilirsin; canlıysan uzatma açık kalır.'
                  : 'Yayında en az bir onaylı ürünün olsun, dekontu yükle.'}
              </Typography>
            </PanelCard>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.8 }}>
              {filteredWeek.map((item) => (
                <PanelCard key={item.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                    <Typography sx={{ fontWeight: 900, color: T.navy }}>Haftanın atölyesi</Typography>
                    <StatusChip map={ATELIER_WEEK_STATUS} value={item.status} />
                  </Box>
                  <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.4 }}>
                    {item.days} gün · {Number(item.price) === 0 ? 'Ücretsiz' : money(item.price)}
                    {item.remainingDays ? ` · ${item.remainingDays} gün kaldı` : ''}
                  </Typography>
                  {item.endsAt ? (
                    <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.3 }}>Bitiş: {when(item.endsAt)}</Typography>
                  ) : null}
                  {item.receiptUrl ? (
                    <Button
                      href={item.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ ...panelButton, mt: 0.8, color: T.navy, px: 0, minWidth: 0 }}
                    >
                      {isReceiptPdf(item.receiptUrl) ? 'Dekontu aç (PDF)' : 'Dekontu gör'}
                    </Button>
                  ) : null}
                  {item.rejectionReason ? (
                    <Typography sx={{ color: '#96393C', fontSize: 12, mt: 0.6 }}>{item.rejectionReason}</Typography>
                  ) : null}
                  {item.status === 'pending' ? (
                    <Button onClick={() => cancelWeek(item)} sx={{ ...panelButton, mt: 1.6, color: T.muted }}>Talebi iptal et</Button>
                  ) : null}
                </PanelCard>
              ))}
            </Box>
          )}
        </Box>
      )}

      {view === 'store' && store && (
        <Box>
          <SectionTitle
            overline="AYARLAR"
            title="Mağaza bilgileri"
            subtitle="İletişim, adres ve ödeme bilgilerinizi güncel tutun. Bu bilgiler atölye sayfanızda görünür."
            action={seller.slug ? (
              <Button startIcon={<OpenInNewRounded />} onClick={() => window.open(`/atolye/${seller.slug}`, '_blank')} sx={{ ...panelButton, color: T.navy, border: `1px solid ${T.line}`, bgcolor: '#fff', px: 2 }}>
                Atölye sayfası
              </Button>
            ) : null}
          />
          <PanelCard>
            <Box component="form" onSubmit={saveStore} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Mağaza adı" value={store.magazaAdi} onChange={(e) => setStore((s) => ({ ...s, magazaAdi: e.target.value }))} required sx={fieldSx} />
              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <Typography sx={{ fontWeight: 800, color: T.navy, mb: 0.6, fontSize: '0.92rem' }}>Üretim alanı</Typography>
                <Typography sx={{ color: T.muted, fontWeight: 600, fontSize: '0.8rem', mb: 1 }}>
                  Birden fazla alan seçebilirsiniz.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {magazaTurleri.map((item) => {
                    const selected = store.magazaTuru.includes(item.value);
                    return (
                      <Chip
                        key={item.value}
                        clickable
                        label={item.label}
                        onClick={() => setStore((s) => {
                          const current = asMagazaTurleri(s.magazaTuru);
                          const magazaTuru = current.includes(item.value)
                            ? current.filter((value) => value !== item.value)
                            : [...current, item.value];
                          return { ...s, magazaTuru };
                        })}
                        sx={{
                          fontWeight: 800,
                          bgcolor: selected ? T.rose : '#fff',
                          color: selected ? '#fff' : T.navy,
                          border: selected ? 'none' : `1px solid ${T.line}`
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
              <TextField label="Telefon" value={store.telefon} onChange={(e) => setStore((s) => ({ ...s, telefon: e.target.value }))} required sx={fieldSx} />
              <Box sx={{ gridColumn: { md: '1 / -1' }, p: 1.8, borderRadius: '18px', border: `1px solid ${T.line}`, bgcolor: T.surfaceSoft, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                  <Typography sx={{ fontWeight: 800, color: T.navy, fontSize: '0.92rem' }}>Havale / EFT hesabı</Typography>
                  <Typography sx={{ color: T.muted, fontWeight: 600, fontSize: '0.8rem', mt: 0.35 }}>
                    Bankanın sorduğu alıcı ad soyad ve IBAN’ı buradan istediğin zaman değiştirebilirsin.
                  </Typography>
                </Box>
                <TextField
                  label="Alıcı ad soyad"
                  value={store.ibanHolder || ''}
                  onChange={(e) => setStore((s) => ({ ...s, ibanHolder: e.target.value }))}
                  required
                  helperText="Havale formuna yazılacak isim"
                  sx={fieldSx}
                />
                <TextField
                  label="IBAN"
                  value={store.iban}
                  onChange={(e) => setStore((s) => ({ ...s, iban: formatIban(e.target.value) }))}
                  required
                  helperText="TR ile başlayan 26 karakter, tamamen değiştirilebilir"
                  sx={fieldSx}
                />
              </Box>
              <TextField label="Şehir" value={store.sehir} onChange={(e) => setStore((s) => ({ ...s, sehir: e.target.value }))} required sx={fieldSx} />
              <TextField label="İlçe" value={store.ilce} onChange={(e) => setStore((s) => ({ ...s, ilce: e.target.value }))} required sx={fieldSx} />
              <TextField label="Adres" value={store.adres} onChange={(e) => setStore((s) => ({ ...s, adres: e.target.value }))} required sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }} />
              <TextField label="Instagram" value={store.instagram} onChange={(e) => setStore((s) => ({ ...s, instagram: e.target.value }))} sx={fieldSx} />
              <TextField label="Website" value={store.website} onChange={(e) => setStore((s) => ({ ...s, website: e.target.value }))} sx={fieldSx} />
              <TextField label="Açıklama" value={store.aciklama} onChange={(e) => setStore((s) => ({ ...s, aciklama: e.target.value }))} multiline minRows={3} sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }} />
              <Button type="submit" disabled={savingStore} sx={{ ...primaryButton, justifySelf: 'start' }}>
                {savingStore ? 'Kaydediliyor...' : 'Mağazayı güncelle'}
              </Button>
            </Box>
          </PanelCard>
        </Box>
      )}

      <Dialog open={Boolean(removing)} onClose={() => setRemoving(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '22px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>Ürünü sil</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.muted }}>
            <b>{removing?.title}</b> kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoving(null)} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button color="error" onClick={removeProduct} sx={{ fontWeight: 800 }}>Sil</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={featureOpen} onClose={closeFeature} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>
          {featureTarget?.isSponsored || liveFeaturedProductIds.has(String(featureTarget?._id || '')) ? 'Vitrin süresini uzat' : 'Öne çıkanlara talep'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.muted, mb: 1.4 }}>
            {featureTarget?.isSponsored || liveFeaturedProductIds.has(String(featureTarget?._id || ''))
              ? 'Paket süresi mevcut bitişe eklenir. Vitrin dolu olsa da uzatma açılır.'
              : vitrinFull
                ? `Vitrin dolu (${featuredSlots.used}/${featuredSlots.total}). Yeni ürün alınmaz; yalnızca vitrindeki ürünü uzatabilirsin.`
                : 'Ürün ve paket seç, havale yap, dekontu yükle. Onaylanınca 12 kişilik ana sayfa vitrine çıkar.'}
          </Typography>
          {liveFeatureProducts.length === 0 ? (
            <Typography sx={{ color: T.muted, mb: 2 }}>Yayında onaylı ürününüz yok. Önce bir ürün yayınlayın.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mb: 2, maxHeight: 280, overflowY: 'auto', pr: 0.4 }}>
              {liveFeatureProducts.map((product) => {
                const selected = String(featureTarget?._id) === String(product._id);
                const pending = pendingFeaturedProductIds.has(String(product._id));
                const live = product.isSponsored || liveFeaturedProductIds.has(String(product._id));
                const blocked = pending || (vitrinFull && !live);
                return (
                  <Box
                    key={product._id}
                    onClick={() => {
                      if (blocked) return;
                      setFeatureTarget(product);
                    }}
                    sx={{
                      cursor: blocked ? 'not-allowed' : 'pointer',
                      opacity: blocked ? 0.55 : 1,
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      p: 1,
                      borderRadius: '16px',
                      border: selected ? `2px solid ${T.navy}` : `1px solid ${T.line}`,
                      bgcolor: selected ? 'rgba(46,59,85,0.06)' : '#fff'
                    }}
                  >
                    <Box component="img" src={product.image} alt="" sx={{ width: 52, height: 52, objectFit: 'cover', borderRadius: '12px', bgcolor: T.surfaceSoft, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, color: T.navy, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.title}
                      </Typography>
                      <Typography sx={{ color: T.muted, fontSize: 12 }}>
                        {pending ? 'Bekleyen talep var' : live ? 'Vitrinde — uzatılabilir' : vitrinFull ? 'Vitrin dolu' : money(product.price)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
          <Typography sx={{ fontWeight: 800, color: T.navy, mb: 1, fontSize: '0.92rem' }}>Paket süresi</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
            {featuredPackages.map((pack) => {
              const selected = featureDays === pack.days;
              return (
                <Box
                  key={pack.days}
                  onClick={() => setFeatureDays(pack.days)}
                  sx={{
                    cursor: 'pointer',
                    p: 1.6,
                    borderRadius: '16px',
                    border: selected ? `2px solid ${T.navy}` : `1px solid ${T.line}`,
                    bgcolor: selected ? 'rgba(46,59,85,0.06)' : '#fff'
                  }}
                >
                  <Typography sx={{ fontWeight: 800, color: T.navy }}>{pack.label}</Typography>
                  <Typography sx={{ fontWeight: 900, color: T.rose, mt: 0.3 }}>{money(pack.price)}</Typography>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ mt: 2, p: 1.6, borderRadius: '16px', border: `1px solid ${T.line}`, bgcolor: T.surfaceSoft }}>
            <Typography sx={{ fontWeight: 800, color: T.navy, fontSize: '0.92rem' }}>Havale / EFT</Typography>
            {featuredBank.holder ? (
              <Typography sx={{ color: T.navy, fontWeight: 800, fontSize: 13, mt: 0.5 }}>{featuredBank.holder}</Typography>
            ) : null}
            <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.2 }}>{featuredBank.name}</Typography>
            <Typography sx={{ color: T.navy, fontWeight: 800, letterSpacing: 0.3, mt: 0.2 }}>{featuredBank.iban}</Typography>
            <Typography sx={{ color: T.rose, fontWeight: 900, mt: 0.8 }}>
              {money(featuredPackages.find((pack) => pack.days === featureDays)?.price || 0)}
            </Typography>
            <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.3 }}>
              Açıklama: {featureTarget?.title || 'ürün adı'} · öne çıkan
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, color: T.navy, mb: 1, mt: 2, fontSize: '0.92rem' }}>Ödeme dekontu</Typography>
          <Box
            component="label"
            sx={{
              display: 'block',
              cursor: 'pointer',
              p: 1.8,
              borderRadius: '16px',
              border: `1.5px dashed ${featureReceipt ? T.navy : T.line}`,
              bgcolor: featureReceipt ? 'rgba(46,59,85,0.06)' : T.surfaceSoft,
              textAlign: 'center'
            }}
          >
            <input
              hidden
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={(e) => { pickFeatureReceipt(e.target.files); e.target.value = ''; }}
            />
            {featureReceipt ? (
              <Box>
                {featureReceipt.isPdf ? (
                  <Typography sx={{ fontWeight: 800, color: T.navy }}>{featureReceipt.file.name}</Typography>
                ) : (
                  <Box component="img" src={featureReceipt.preview} alt="" sx={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain', borderRadius: '12px', mb: 0.8 }} />
                )}
                <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.6 }}>Değiştirmek için tekrar seçin</Typography>
              </Box>
            ) : (
              <Box>
                <Typography sx={{ fontWeight: 800, color: T.navy }}>Dekont yükleyin</Typography>
                <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.4 }}>JPG, PNG veya PDF · en fazla 8 MB</Typography>
              </Box>
            )}
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Not (isteğe bağlı)"
            value={featureNote}
            onChange={(e) => setFeatureNote(e.target.value)}
            sx={{ ...fieldSx, mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button onClick={closeFeature} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button
            onClick={submitFeature}
            disabled={
              savingFeature
              || !featureTarget
              || !featureReceipt?.file
              || (vitrinFull && !featureTarget.isSponsored && !liveFeaturedProductIds.has(String(featureTarget._id)))
            }
            sx={primaryButton}
          >
            {savingFeature
              ? 'Gönderiliyor...'
              : (featureTarget?.isSponsored || liveFeaturedProductIds.has(String(featureTarget?._id || '')))
                ? 'Uzatma gönder'
                : 'Talep gönder'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={weekOpen} onClose={closeWeek} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>
          {shopIsWeekly ? 'Haftayı uzat' : 'Haftanın atölyesi talebi'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.muted, mb: 1.4 }}>
            {shopIsWeekly
              ? '7 gün, mevcut bitişe eklenir. Vitrin dolu olsa da uzatma açılır.'
              : weekLocked
                ? `Vitrin dolu (${weekSlots.used}/${weekSlots.total}). Yeni mağaza alınmaz.`
                : 'Paket 7 gün 6.000 ₺. Havale yap, dekontu yükle. Onaylanınca atölyen ana sayfa şeridine çıkar.'}
          </Typography>
          {!liveFeatureProducts.length ? (
            <Typography sx={{ color: T.muted, mb: 2 }}>Yayında onaylı ürününüz yok. Önce bir ürün yayınlayın.</Typography>
          ) : null}
          <Box sx={{ p: 1.6, borderRadius: '16px', border: `1px solid ${T.line}`, bgcolor: T.surfaceSoft }}>
            <Typography sx={{ fontWeight: 800, color: T.navy, fontSize: '0.92rem' }}>Havale / EFT</Typography>
            {weekBank.holder ? (
              <Typography sx={{ color: T.navy, fontWeight: 800, fontSize: 13, mt: 0.5 }}>{weekBank.holder}</Typography>
            ) : null}
            <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.2 }}>{weekBank.name}</Typography>
            <Typography sx={{ color: T.navy, fontWeight: 800, letterSpacing: 0.3, mt: 0.2 }}>{weekBank.iban}</Typography>
            <Typography sx={{ color: T.rose, fontWeight: 900, mt: 0.8 }}>{money(weekPack.price)}</Typography>
            <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.3 }}>
              Açıklama: {seller?.magazaAdi || 'atölye adı'} · haftanın atölyesi
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, color: T.navy, mb: 1, mt: 2, fontSize: '0.92rem' }}>Ödeme dekontu</Typography>
          <Box
            component="label"
            sx={{
              display: 'block',
              cursor: 'pointer',
              p: 1.8,
              borderRadius: '16px',
              border: `1.5px dashed ${weekReceipt ? T.navy : T.line}`,
              bgcolor: weekReceipt ? 'rgba(46,59,85,0.06)' : T.surfaceSoft,
              textAlign: 'center'
            }}
          >
            <input
              hidden
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={(e) => { pickWeekReceipt(e.target.files); e.target.value = ''; }}
            />
            {weekReceipt ? (
              <Box>
                {weekReceipt.isPdf ? (
                  <Typography sx={{ fontWeight: 800, color: T.navy }}>{weekReceipt.file.name}</Typography>
                ) : (
                  <Box component="img" src={weekReceipt.preview} alt="" sx={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain', borderRadius: '12px', mb: 0.8 }} />
                )}
                <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.6 }}>Değiştirmek için tekrar seçin</Typography>
              </Box>
            ) : (
              <Box>
                <Typography sx={{ fontWeight: 800, color: T.navy }}>Dekont yükleyin</Typography>
                <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.4 }}>JPG, PNG veya PDF · en fazla 8 MB</Typography>
              </Box>
            )}
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Not (isteğe bağlı)"
            value={weekNote}
            onChange={(e) => setWeekNote(e.target.value)}
            sx={{ ...fieldSx, mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button onClick={closeWeek} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button
            onClick={submitWeek}
            disabled={savingWeek || !weekReceipt?.file || weekLocked || !liveFeatureProducts.length}
            sx={primaryButton}
          >
            {savingWeek ? 'Gönderiliyor...' : shopIsWeekly ? 'Uzatma gönder' : 'Talep gönder'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={answerOpen} onClose={() => setAnswerOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>
          {activeQuestion?.answer ? 'Yanıtı düzenle' : 'Soruyu yanıtla'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontWeight: 800, color: T.navy, mb: 0.6 }}>{activeQuestion?.product?.title}</Typography>
          <Typography sx={{ color: T.muted, mb: 2 }}>{activeQuestion?.user?.adSoyad}: {activeQuestion?.question}</Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            label="Yanıtınız"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            sx={fieldSx}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button onClick={() => setAnswerOpen(false)} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button onClick={saveAnswer} disabled={savingAnswer || answerText.trim().length < 8} sx={primaryButton}>
            {savingAnswer ? 'Kaydediliyor...' : 'Yanıtı kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {openOrder ? (
        <SellerOrderDetail
          order={openOrder}
          onClose={() => setOpenOrder(null)}
          onStatus={updateOrderStatus}
          updating={updatingOrder === openOrder._id}
          onFlash={flash}
          onReply={async (text) => {
            try {
              const data = await sellerService.addOrderNote(openOrder._id, text);
              if (data.order) setOpenOrder(data.order);
              flash(data.mesaj || 'Yanıt iletildi.');
              return true;
            } catch (err) {
              fail(err, 'Yanıt iletilemedi.');
              return false;
            }
          }}
        />
      ) : null}
    </PanelShell>
  );
}
