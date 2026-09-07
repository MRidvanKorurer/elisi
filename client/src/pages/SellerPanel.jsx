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
  FormControlLabel,
  MenuItem,
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
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded';
import PendingActionsOutlined from '@mui/icons-material/PendingActionsOutlined';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import PanelShell, { PanelCard, SectionTitle, StatusChip, fieldSx, primaryButton } from '../components/PanelShell';
import ImageUploader from '../components/ImageUploader';
import { sellerService } from '../api/sellerService';
import { isSellerRole } from '../utils/roles';
import { formatIban, sanitizeIban } from '../utils/sellerValidation';
import { APPROVAL_STATUS, ORDER_STATUS, PAYMENT_STATUS, T, money, when } from '../utils/panel';

import { CATEGORY_OPTIONS } from '../utils/categories';

const MAGAZA_TURLERI = CATEGORY_OPTIONS;

const emptyProduct = {
  title: '',
  description: '',
  category: 'canta',
  price: '',
  stock: 1,
  discountPercentage: 0,
  colors: '',
  sizes: '',
  immediateDelivery: true
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

export default function SellerPanel({ user, handleLogout }) {
  const [view, setView] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState(null);
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [mainImage, setMainImage] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const [store, setStore] = useState(null);
  const [savingStore, setSavingStore] = useState(false);
  const [removing, setRemoving] = useState(null);

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
      magazaTuru: data.satici.magazaTuru || 'canta',
      aciklama: data.satici.aciklama || '',
      telefon: data.satici.telefon || '',
      sehir: data.satici.sehir || '',
      ilce: data.satici.ilce || '',
      adres: data.satici.adres || '',
      iban: formatIban(data.satici.iban || ''),
      instagram: data.satici.instagram || '',
      website: data.satici.website || ''
    });
    return data.satici;
  };

  const loadPanel = async () => {
    const [ov, pr, or] = await Promise.all([
      sellerService.getOverview(),
      sellerService.getMyProducts(),
      sellerService.getMyOrders()
    ]);
    setOverview(ov.overview);
    setProducts(pr.products || []);
    setOrders(or.orders || []);
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

  const q = query.trim().toLowerCase();
  const filteredProducts = useMemo(
    () => products.filter((p) => !q || `${p.title} ${p.category}`.toLowerCase().includes(q)),
    [products, q]
  );
  const filteredOrders = useMemo(
    () => orders.filter((o) => !q || `${o.customerInfo?.firstName} ${o.customerInfo?.lastName} ${o._id}`.toLowerCase().includes(q)),
    [orders, q]
  );

  if (!user) return <Navigate to="/auth" replace />;
  if (!isSellerRole(user.rol)) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: `linear-gradient(180deg, ${T.cream} 0%, ${T.creamDeep} 100%)` }}>
        <CircularProgress sx={{ color: T.rose }} />
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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setMainImage(null);
    setGallery([]);
    setDialogOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      title: product.title || '',
      description: product.description || '',
      category: product.category || 'canta',
      price: product.price ?? '',
      stock: product.stock ?? 1,
      discountPercentage: product.discountPercentage || 0,
      colors: (product.colors || []).join(', '),
      sizes: (product.sizes || []).join(', '),
      immediateDelivery: product.immediateDelivery !== false
    });
    setMainImage(null);
    setGallery([]);
    setDialogOpen(true);
  };

  const saveProduct = async () => {
    if (!editing && !mainImage?.file) {
      setError('Ana görsel yüklemelisiniz.');
      return;
    }
    setSavingProduct(true);
    setError('');
    try {
      if (editing) {
        await sellerService.updateProduct(editing._id, {
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
          discountPercentage: Number(form.discountPercentage) || 0,
          immediateDelivery: form.immediateDelivery
        });
        flash('Ürün güncellendi.');
      } else {
        const body = new FormData();
        body.append('title', form.title);
        body.append('description', form.description);
        body.append('category', form.category);
        body.append('price', form.price);
        body.append('stock', form.stock);
        body.append('discountPercentage', form.discountPercentage || 0);
        body.append('colors', form.colors);
        body.append('sizes', form.sizes);
        body.append('immediateDelivery', String(form.immediateDelivery));
        body.append('image', mainImage.file);
        gallery.forEach((item) => body.append('gallery', item.file));

        const data = await sellerService.createProduct(body);
        flash(data.mesaj || 'Ürün onaya gönderildi.');
      }
      setDialogOpen(false);
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
      const data = await sellerService.updateMe({ ...store, iban: sanitizeIban(store.iban) });
      setSeller(data.satici);
      flash(data.mesaj || 'Mağaza güncellendi.');
    } catch (err) {
      fail(err, 'Güncelleme başarısız.');
    } finally {
      setSavingStore(false);
    }
  };

  const goView = (id) => {
    setView(id);
    setQuery('');
    setMobileOpen(false);
  };

  const nav = [
    { id: 'dashboard', label: 'Ana sayfa', icon: DashboardOutlined },
    { id: 'orders', label: 'Siparişler', icon: ReceiptLongOutlined, badge: overview?.openOrders || 0 },
    { id: 'products', label: 'Ürünlerim', icon: Inventory2Outlined, badge: overview?.pendingApproval || 0 },
    { id: 'store', label: 'Mağaza bilgileri', icon: StorefrontOutlined }
  ];

  return (
    <PanelShell
      nav={nav}
      view={view}
      onView={goView}
      user={user}
      roleLabel="Satıcı paneli"
      handleLogout={handleLogout}
      query={query}
      setQuery={setQuery}
      searchPlaceholder="Kendi ürün ve siparişlerinde ara"
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
    >
      {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: '14px' }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2, borderRadius: '14px' }} onClose={() => setMessage('')}>{message}</Alert> : null}

      {view === 'dashboard' && overview && (
        <Box>
          <SectionTitle
            overline="MAĞAZAM"
            title={seller.magazaAdi}
            subtitle="Ürünlerinizi ekleyip fiyat ve stok güncelleyebilir, siparişlerinizi takip edebilirsiniz."
            action={<Button onClick={openCreate} sx={primaryButton}>Yeni ürün ekle</Button>}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.8, mb: 2 }}>
            <StatCard icon={Inventory2Rounded} title="Yayındaki ürün" value={overview.published} hint={`${overview.products} toplam`} tone={T.navy} />
            <StatCard icon={PendingActionsOutlined} title="Onay bekleyen" value={overview.pendingApproval} hint="Süper admin onayı" tone="#C08A4A" />
            <StatCard icon={ShoppingBagOutlined} title="Siparişlerim" value={overview.orders} hint={`${overview.openOrders} hazırlanıyor`} tone={T.lavender} />
            <StatCard icon={PaymentsOutlined} title="Tahsil edilen" value={money(overview.revenue)} hint="Ödenen siparişler" tone={T.rose} />
          </Box>

          {overview.pendingApproval > 0 && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
              {overview.pendingApproval} ürününüz süper admin onayında. Onaylandığında otomatik yayına alınır.
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 1.8 }}>
            <PanelCard sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ px: 2.6, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 900, color: T.navy }}>Son siparişler</Typography>
                <Button onClick={() => goView('orders')} sx={{ fontWeight: 800, color: T.rose }}>Tümü</Button>
              </Box>
              <Table size="small">
                <TableBody>
                  {(overview.recentOrders || []).map((order) => (
                    <TableRow key={order._id} hover>
                      <TableCell sx={bodyCell}>
                        <Typography sx={{ fontWeight: 800 }}>{order.customerInfo?.firstName} {order.customerInfo?.lastName}</Typography>
                        <Typography sx={{ fontSize: 12, color: T.muted }}>{when(order.createdAt)}</Typography>
                      </TableCell>
                      <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(order.sellerTotal)}</TableCell>
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
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1.4 }}>Mağaza durumu</Typography>
              {[
                ['Kritik stok', overview.lowStock],
                ['Reddedilen ürün', overview.rejected],
                ['Toplam ürün', overview.products]
              ].map(([labelText, value]) => (
                <Box key={labelText} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.1, borderBottom: `1px solid ${T.line}` }}>
                  <Typography sx={{ fontWeight: 700, color: T.navy }}>{labelText}</Typography>
                  <Chip size="small" label={value} sx={{ fontWeight: 900, bgcolor: value ? T.roseSoft : 'rgba(46,59,85,0.06)' }} />
                </Box>
              ))}
              <Typography sx={{ color: T.muted, fontSize: '0.83rem', mt: 1.8 }}>
                Başlık, kategori ve görsel değişiklikleri süper admin tarafından yapılır.
              </Typography>
            </PanelCard>
          </Box>
        </Box>
      )}

      {view === 'orders' && (
        <Box>
          <SectionTitle
            overline="SATIŞLAR"
            title="Siparişlerim"
            subtitle="Yalnızca kendi ürünlerinizin geçtiği siparişleri ve size ait tutarı görürsünüz."
          />
          <PanelCard sx={{ p: 0, overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Müşteri', 'Ürünler', 'Tutarım', 'Ödeme', 'Durum', 'Tarih'].map((h) => (
                    <TableCell key={h} sx={headCell}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell sx={bodyCell}>
                      <Typography sx={{ fontWeight: 800 }}>{order.customerInfo?.firstName} {order.customerInfo?.lastName}</Typography>
                      <Typography sx={{ fontSize: 12, color: T.muted }}>
                        {order.shippingAddress?.district}/{order.shippingAddress?.city}
                      </Typography>
                    </TableCell>
                    <TableCell sx={bodyCell}>
                      {(order.orderItems || []).map((item, idx) => (
                        <Typography key={idx} sx={{ fontSize: 13 }}>{item.name} × {item.quantity}</Typography>
                      ))}
                    </TableCell>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(order.sellerTotal)}</TableCell>
                    <TableCell sx={bodyCell}><StatusChip map={PAYMENT_STATUS} value={order.paymentStatus} /></TableCell>
                    <TableCell sx={bodyCell}><StatusChip map={ORDER_STATUS} value={order.orderStatus} /></TableCell>
                    <TableCell sx={{ ...bodyCell, color: T.muted }}>{when(order.createdAt)}</TableCell>
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
            overline="KATALOĞUM"
            title="Ürünlerim"
            subtitle="Yeni ürünler süper admin onayından sonra yayına alınır."
            action={<Button onClick={openCreate} sx={primaryButton}>Yeni ürün ekle</Button>}
          />
          <PanelCard sx={{ p: 0, overflow: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Ürün', 'Fiyat', 'Stok', 'Onay', 'Yayın', ''].map((h) => (
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
                          <Typography sx={{ fontSize: 12, color: T.muted }}>{product.category}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800 }}>{money(product.price)}</TableCell>
                    <TableCell sx={{ ...bodyCell, fontWeight: 800, color: product.stock <= 5 ? '#96393C' : T.navy }}>{product.stock}</TableCell>
                    <TableCell sx={bodyCell}>
                      <StatusChip map={APPROVAL_STATUS} value={product.approvalStatus || 'approved'} />
                      {product.approvalStatus === 'rejected' && product.rejectionReason ? (
                        <Typography sx={{ fontSize: 12, color: '#96393C', mt: 0.4 }}>{product.rejectionReason}</Typography>
                      ) : null}
                    </TableCell>
                    <TableCell sx={bodyCell}>
                      <Chip
                        size="small"
                        label={product.isActive ? 'Yayında' : 'Gizli'}
                        sx={{ fontWeight: 800, bgcolor: product.isActive ? 'rgba(150,190,150,0.24)' : 'rgba(46,59,85,0.07)', color: product.isActive ? '#3F6B47' : T.muted }}
                      />
                    </TableCell>
                    <TableCell sx={{ ...bodyCell, whiteSpace: 'nowrap' }}>
                      <Button onClick={() => openEdit(product)} sx={{ fontWeight: 800, color: T.rose }}>Düzenle</Button>
                      {product.approvalStatus === 'approved' && (
                        <Button onClick={() => toggleActive(product)} sx={{ fontWeight: 800, color: T.navy }}>
                          {product.isActive ? 'Gizle' : 'Yayınla'}
                        </Button>
                      )}
                      <Button color="error" onClick={() => setRemoving(product)} sx={{ fontWeight: 800 }}>Sil</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow><TableCell colSpan={6} sx={{ ...bodyCell, color: T.muted }}>Henüz ürün yok.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </PanelCard>
        </Box>
      )}

      {view === 'store' && store && (
        <Box>
          <SectionTitle overline="AYARLAR" title="Mağaza bilgileri" subtitle="İletişim, adres ve ödeme bilgilerinizi güncel tutun." />
          <PanelCard>
            <Box component="form" onSubmit={saveStore} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Mağaza adı" value={store.magazaAdi} onChange={(e) => setStore((s) => ({ ...s, magazaAdi: e.target.value }))} required sx={fieldSx} />
              <TextField select label="Mağaza türü" value={store.magazaTuru} onChange={(e) => setStore((s) => ({ ...s, magazaTuru: e.target.value }))} sx={fieldSx}>
                {MAGAZA_TURLERI.map((item) => (
                  <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                ))}
              </TextField>
              <TextField label="Telefon" value={store.telefon} onChange={(e) => setStore((s) => ({ ...s, telefon: e.target.value }))} required sx={fieldSx} />
              <TextField label="IBAN" value={store.iban} onChange={(e) => setStore((s) => ({ ...s, iban: formatIban(e.target.value) }))} required sx={fieldSx} />
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, color: T.navy }}>{editing ? 'Ürünü düzenle' : 'Yeni ürün'}</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
            {editing
              ? 'Başlık, kategori ve görselleri süper admin düzenler. Fiyat, stok ve açıklamayı siz güncelleyebilirsiniz.'
              : 'Ürün kaydedildikten sonra süper admin onayına düşer, onaylanınca yayınlanır.'}
          </Alert>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField label="Başlık" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} disabled={Boolean(editing)} required sx={fieldSx} />
              <TextField select label="Kategori" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} disabled={Boolean(editing)} sx={fieldSx}>
                {MAGAZA_TURLERI.map((item) => (
                  <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                ))}
              </TextField>
              <TextField label="Açıklama" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} multiline minRows={4} required sx={fieldSx} />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.4 }}>
                <TextField label="Fiyat" type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required sx={fieldSx} />
                <TextField label="Stok" type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} required sx={fieldSx} />
                <TextField label="İndirim %" type="number" value={form.discountPercentage} onChange={(e) => setForm((p) => ({ ...p, discountPercentage: e.target.value }))} sx={fieldSx} />
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
              {editing ? (
                <Box>
                  <Typography sx={{ fontWeight: 800, color: T.navy, mb: 0.8, fontSize: '0.9rem' }}>Ürün görselleri</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[editing.image, ...(editing.additionalImages || [])].filter(Boolean).map((url) => (
                      <Box key={url} component="img" src={url} alt="" sx={{ width: 86, height: 86, objectFit: 'cover', borderRadius: '14px', border: `1px solid ${T.line}` }} />
                    ))}
                  </Box>
                </Box>
              ) : (
                <>
                  <ImageUploader label="Ana görsel" value={mainImage} onChange={setMainImage} hint="Vitrinde görünen kapak görseli" />
                  <ImageUploader label="Galeri (opsiyonel)" multiple value={gallery} onChange={setGallery} hint="En fazla 6 ek görsel" height={110} />
                  <TextField label="Renkler (virgülle)" value={form.colors} onChange={(e) => setForm((p) => ({ ...p, colors: e.target.value }))} sx={fieldSx} />
                  <TextField label="Bedenler (virgülle)" value={form.sizes} onChange={(e) => setForm((p) => ({ ...p, sizes: e.target.value }))} sx={fieldSx} />
                </>
              )}
              <FormControlLabel
                control={<Switch checked={form.immediateDelivery} onChange={(e) => setForm((p) => ({ ...p, immediateDelivery: e.target.checked }))} />}
                label="Hemen kargo"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ fontWeight: 800, color: T.muted }}>Vazgeç</Button>
          <Button onClick={saveProduct} disabled={savingProduct} sx={primaryButton}>
            {savingProduct ? 'Kaydediliyor...' : editing ? 'Kaydet' : 'Onaya gönder'}
          </Button>
        </DialogActions>
      </Dialog>

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
    </PanelShell>
  );
}
