import React, { useEffect, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Container, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Divider, IconButton, Paper, Snackbar,
  TextField, Typography, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import userService from '../api/userService';

import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import AddLocationAltOutlinedIcon from '@mui/icons-material/AddLocationAltOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded';

const TABS = [
  { id: 'profile', label: 'Profil', icon: <PersonOutlineOutlinedIcon /> },
  { id: 'addresses', label: 'Adresler', icon: <LocationOnOutlinedIcon /> },
  { id: 'cards', label: 'Kartlar', icon: <PaymentOutlinedIcon /> },
  { id: 'orders', label: 'Siparişler', icon: <LocalMallOutlinedIcon /> },
  { id: 'favorites', label: 'Favoriler', icon: <FavoriteBorderOutlinedIcon /> }
];

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '14px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    '& fieldset': { borderColor: 'rgba(148,109,109,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(148,109,109,0.45)' },
    '&.Mui-focused fieldset': { borderColor: '#946D6D', borderWidth: '1.5px' }
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#946D6D' }
};

import { imgBagOrange } from '../assets/media';
import Seo from './Seo';

const formatPrice = (value) =>
  Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const FALLBACK_IMAGE = imgBagOrange;

function orderLabel(order) {
  if (order?.orderStatus === 'delivered') return 'Teslim edildi';
  if (order?.orderStatus === 'shipped') return 'Kargoda';
  if (order?.orderStatus === 'cancelled') return 'İptal';
  if (order?.paymentStatus === 'pending') return 'Ödeme bekleniyor';
  if (order?.paymentStatus === 'failed') return 'Ödeme başarısız';
  return 'Hazırlanıyor';
}

function statusConfig(label) {
  const s = String(label || '').toLowerCase();
  if (s.includes('teslim')) return { color: '#81B29A', icon: <CheckCircleOutlineOutlinedIcon sx={{ color: '#81B29A' }} /> };
  if (s.includes('kargo')) return { color: '#DDA15E', icon: <LocalShippingOutlinedIcon sx={{ color: '#DDA15E' }} /> };
  if (s.includes('iptal') || s.includes('başarısız') || s.includes('failed')) return { color: '#946D6D', icon: <HighlightOffOutlinedIcon sx={{ color: '#946D6D' }} /> };
  if (s.includes('ödeme')) return { color: '#A290B7', icon: <HourglassEmptyRounded sx={{ color: '#A290B7' }} /> };
  return { color: '#A290B7', icon: <Inventory2OutlinedIcon sx={{ color: '#A290B7' }} /> };
}

export default function ProfileDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', currentPassword: '', newPassword: '' });
  const [addresses, setAddresses] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({ baslik: '', adSoyad: '', telefon: '', il: '', ilce: '', adres: '' });
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({ kartSahibi: '', kartNumarasi: '', skt: '' });
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, title: '', message: '' });

  const showAlert = (message, severity = 'success') => setAlertConfig({ open: true, message, severity });

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await userService.getProfile();
        const user = profileRes.user || profileRes;
        setFormData({
          name: user.adSoyad || user.name || '',
          email: user.email || '',
          phone: user.telefon || user.phone || '',
          currentPassword: '',
          newPassword: ''
        });
        setAddresses(user.adresler || user.addresses || []);
        setSavedCards(user.kayitliKartlar || user.savedCards || []);

        const [ordersRes, favRes] = await Promise.allSettled([
          userService.getOrders(),
          userService.getFavorites()
        ]);
        if (ordersRes.status === 'fulfilled' && ordersRes.value?.success) {
          setOrders(ordersRes.value.orders || []);
        }
        if (favRes.status === 'fulfilled' && favRes.value?.success) {
          setFavorites((favRes.value.favorites || []).filter(Boolean));
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate('/auth');
          return;
        }
        showAlert('Veriler alınırken hata oluştu.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAddressInputChange = (e) => setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  const handleCardInputChange = (e) => setCardForm({ ...cardForm, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) return showAlert('Ad soyad zorunludur.', 'warning');
    if ((formData.currentPassword && !formData.newPassword) || (!formData.currentPassword && formData.newPassword)) {
      return showAlert('Şifre değiştirmek için mevcut ve yeni şifreyi birlikte girin.', 'warning');
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      return showAlert('Yeni şifre en az 6 karakter olmalıdır.', 'warning');
    }

    setSaving(true);
    try {
      await userService.updateProfile({ adSoyad: formData.name.trim(), telefon: formData.phone.trim() });
      if (formData.currentPassword && formData.newPassword) {
        await userService.changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword });
        setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      }
      showAlert('Profiliniz güncellendi.');
    } catch (error) {
      showAlert(error.response?.data?.message || 'Güncelleme başarısız oldu.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!addressForm.baslik || !addressForm.adSoyad || !addressForm.telefon || !addressForm.il || !addressForm.ilce || !addressForm.adres) {
      return showAlert('Lütfen tüm adres alanlarını doldurun.', 'warning');
    }
    try {
      const response = await userService.addAddress(addressForm);
      setAddresses(response.addresses || response.adresler || []);
      setIsAddressModalOpen(false);
      setAddressForm({ baslik: '', adSoyad: '', telefon: '', il: '', ilce: '', adres: '' });
      showAlert('Adres eklendi.');
    } catch (error) {
      showAlert(error.response?.data?.message || 'Adres eklenirken bir hata oluştu.', 'error');
    }
  };

  const handleAddCard = async () => {
    const digits = String(cardForm.kartNumarasi || '').replace(/\D/g, '');
    if (!cardForm.kartSahibi || !digits || !cardForm.skt) {
      return showAlert('Lütfen tüm kart alanlarını doldurun.', 'warning');
    }
    if (digits.length < 12) {
      return showAlert('Geçerli bir kart numarası giriniz.', 'warning');
    }
    try {
      const response = await userService.addCard({ ...cardForm, kartNumarasi: digits });
      setSavedCards(response.savedCards || response.kayitliKartlar || []);
      setIsCardModalOpen(false);
      setCardForm({ kartSahibi: '', kartNumarasi: '', skt: '' });
      showAlert('Kart eklendi.');
    } catch (error) {
      showAlert(error.response?.data?.message || 'Kart eklenirken bir hata oluştu.', 'error');
    }
  };

  const openDeleteModal = (type, id) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      title: type === 'address' ? 'Adresi sil' : 'Kartı sil',
      message: type === 'address'
        ? 'Bu adresi silmek istediğinize emin misiniz?'
        : 'Bu kayıtlı kartı silmek istediğinize emin misiniz?'
    });
  };

  const closeDeleteModal = () => setDeleteModal({ isOpen: false, type: null, id: null, title: '', message: '' });

  const confirmDelete = async () => {
    const { type, id } = deleteModal;
    if (!id) return;
    try {
      if (type === 'address') {
        await userService.deleteAddress(id);
        setAddresses((prev) => prev.filter((addr) => addr._id !== id));
        showAlert('Adres silindi.');
      } else {
        await userService.deleteCard(id);
        setSavedCards((prev) => prev.filter((card) => card._id !== id));
        showAlert('Kart silindi.');
      }
    } catch {
      showAlert('Silme işlemi başarısız.', 'error');
    } finally {
      closeDeleteModal();
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      await userService.removeFavorite(productId);
      setFavorites((prev) => prev.filter((fav) => String(fav._id || fav.id) !== String(productId)));
      showAlert('Ürün favorilerden çıkarıldı.');
    } catch {
      showAlert('Favorilerden çıkarılırken hata oluştu.', 'error');
    }
  };

  const openOrderDetails = async (orderId) => {
    setIsOrderModalOpen(true);
    setIsOrderLoading(true);
    setSelectedOrder(null);
    try {
      const data = await userService.getOrderById(orderId);
      if (data.success) setSelectedOrder(data.order);
    } catch {
      showAlert('Sipariş detayları alınamadı.', 'error');
      setIsOrderModalOpen(false);
    } finally {
      setIsOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#946D6D' }} />
      </Box>
    );
  }

  const initials = formData.name ? formData.name.trim().charAt(0).toUpperCase() : 'N';

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 10, md: 13 }, pb: 8 }}>
      <Seo title="Hesabım" path="/profile" noindex />
      <Snackbar open={alertConfig.open} autoHideDuration={3600} onClose={() => setAlertConfig((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={alertConfig.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 700 }}>{alertConfig.message}</Alert>
      </Snackbar>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <Typography sx={{ color: '#A290B7', fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.75rem', textTransform: 'uppercase' }}>Hesap</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#2E3B55', letterSpacing: '-0.03em', fontSize: { xs: '1.7rem', md: '2.1rem' } }}>
            {formData.name || 'Hesabım'}
          </Typography>
          <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 0.5 }}>{formData.email}</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2.5, md: 4 }, alignItems: 'flex-start', minWidth: 0, width: '100%' }}>
          <Paper
            elevation={0}
            sx={{
              width: { xs: '100%', md: 250 },
              flexShrink: 0,
              borderRadius: '22px',
              p: { xs: 1, md: 1.5 },
              backgroundColor: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(148,109,109,0.12)',
              position: { md: 'sticky' },
              top: { md: 108 }
            }}
          >
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'row', md: 'column' },
              gap: 0.8,
              overflowX: { xs: 'auto', md: 'visible' },
              overflowY: 'hidden',
              pb: { xs: 0.4, md: 0 },
              mx: { xs: -0.25, md: 0 },
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}>
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    startIcon={tab.icon}
                    sx={{
                      justifyContent: 'flex-start',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      minWidth: { xs: 'auto', md: '100%' },
                      borderRadius: '14px',
                      px: 1.6,
                      py: 1.15,
                      fontWeight: active ? 800 : 600,
                      color: active ? '#1E2738' : '#6E5252',
                      bgcolor: active ? '#B0CDE6' : 'transparent',
                      '& .MuiButton-startIcon': { mr: 1 },
                      '&:hover': { bgcolor: active ? '#B0CDE6' : 'rgba(176,205,230,0.28)' }
                    }}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, minWidth: 0, width: '100%', overflow: 'hidden', borderRadius: '24px', p: { xs: 2.2, sm: 3.5, md: 4.5 }, backgroundColor: '#fff', border: '1px solid rgba(148,109,109,0.1)' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                {activeTab === 'profile' && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5 }}>
                      <Avatar sx={{ width: { xs: 64, md: 84 }, height: { xs: 64, md: 84 }, bgcolor: '#B0CDE6', color: '#1E2738', fontWeight: 800, fontSize: { xs: '1.6rem', md: '2rem' } }}>{initials}</Avatar>
                      <Box>
                        <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>Kişisel bilgiler</Typography>
                        <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600 }}>E-posta güvenlik nedeniyle değiştirilemez.</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                      <TextField fullWidth label="Ad soyad" name="name" value={formData.name} onChange={handleInputChange} sx={fieldSx} />
                      <TextField fullWidth label="E-posta" value={formData.email} disabled sx={fieldSx} />
                      <TextField fullWidth label="Telefon" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="05xx xxx xx xx" sx={{ ...fieldSx, gridColumn: { xs: '1', sm: '1 / -1' } }} />
                    </Box>
                    <Divider sx={{ my: 3, borderColor: 'rgba(148,109,109,0.12)' }}>
                      <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 800, letterSpacing: '0.06em' }}>ŞİFRE (OPSİYONEL)</Typography>
                    </Divider>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <TextField fullWidth label="Mevcut şifre" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleInputChange} sx={fieldSx} />
                      <TextField fullWidth label="Yeni şifre" name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange} sx={fieldSx} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button onClick={handleSaveProfile} disabled={saving} variant="contained" sx={primaryBtnSx}>
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {activeTab === 'addresses' && (
                  <Box>
                    <HeaderRow title="Adreslerim" actionLabel="Yeni adres" icon={<AddLocationAltOutlinedIcon />} onClick={() => setIsAddressModalOpen(true)} />
                    {addresses.length === 0 ? (
                      <EmptyState text="Kayıtlı adresiniz yok." />
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2, alignItems: 'stretch' }}>
                        {addresses.map((addr) => (
                          <Paper key={addr._id} elevation={0} sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1, minWidth: 0 }}>
                              <Typography noWrap fontWeight={800} sx={{ color: '#2E3B55', minWidth: 0 }}>{addr.baslik}</Typography>
                              {addr.isDefault && <Chip size="small" label="Varsayılan" sx={{ bgcolor: '#B0CDE6', fontWeight: 800, flexShrink: 0 }} />}
                            </Box>
                            <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 700, wordBreak: 'break-word' }}>{addr.adSoyad} · {addr.telefon}</Typography>
                            <Typography variant="body2" sx={{ color: '#6E5252', mt: 0.8, mb: 1.5, flex: 1, wordBreak: 'break-word' }}>{addr.adres}<br />{addr.ilce} / {addr.il}</Typography>
                            <Button onClick={() => openDeleteModal('address', addr._id)} size="small" startIcon={<DeleteOutlinedIcon />} sx={{ color: '#946D6D', fontWeight: 700, alignSelf: 'flex-start' }}>Sil</Button>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {activeTab === 'cards' && (
                  <Box>
                    <HeaderRow title="Kayıtlı kartlar" actionLabel="Yeni kart" icon={<AddCardOutlinedIcon />} onClick={() => setIsCardModalOpen(true)} />
                    {savedCards.length === 0 ? (
                      <EmptyState text="Kayıtlı kartınız yok. Ödeme sırasında da kart girebilirsiniz." />
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2, alignItems: 'stretch' }}>
                        {savedCards.map((card) => (
                          <Paper key={card._id} elevation={0} sx={{ ...cardSx, height: '100%', minWidth: 0, background: 'linear-gradient(135deg, #1E2738 0%, #2E3B55 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
                            <CreditCardOutlinedIcon sx={{ position: 'absolute', right: -16, bottom: -18, fontSize: 110, opacity: 0.12 }} />
                            <Typography sx={{ letterSpacing: '2px', mb: 2.5, fontFamily: 'monospace', fontWeight: 700 }}>•••• •••• •••• {card.son4Hane}</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pr: 4 }}>
                              <Box>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Kart sahibi</Typography>
                                <Typography variant="body2" fontWeight={800}>{card.kartSahibi}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>SKT</Typography>
                                <Typography variant="body2" fontWeight={800}>{card.skt}</Typography>
                              </Box>
                            </Box>
                            <IconButton onClick={() => openDeleteModal('card', card._id)} size="small" sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.7)' }}>
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {activeTab === 'orders' && (
                  <Box>
                    <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2.5, fontSize: '1.2rem' }}>Siparişlerim</Typography>
                    {orders.length === 0 ? (
                      <EmptyState text="Henüz siparişiniz yok." action="Alışverişe başla" onAction={() => navigate('/products')} />
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {orders.map((order) => {
                          const orderId = order._id;
                          const label = orderLabel(order);
                          const cfg = statusConfig(label);
                          const itemsCount = order.orderItems?.length || 0;
                          return (
                            <Paper key={orderId} elevation={0} sx={{ ...cardSx, minWidth: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(0,1.4fr) auto auto auto' }, gap: 1.5, alignItems: 'center' }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 800 }}>#{String(orderId).slice(-6).toUpperCase()}</Typography>
                                <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600 }} noWrap>
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : ''} · {itemsCount} ürün
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                {cfg.icon}
                                <Typography variant="body2" fontWeight={800} sx={{ color: cfg.color, whiteSpace: 'nowrap' }}>{label}</Typography>
                              </Box>
                              <Typography fontWeight={800} sx={{ color: '#2E3B55', whiteSpace: 'nowrap' }}>{formatPrice(order.totalPrice)} ₺</Typography>
                              <Button onClick={() => openOrderDetails(orderId)} endIcon={<VisibilityOutlinedIcon />} sx={{ borderRadius: '12px', color: '#2E3B55', fontWeight: 800, border: '1px solid rgba(46,59,85,0.18)', justifySelf: { sm: 'end' }, whiteSpace: 'nowrap' }}>
                                Detay
                              </Button>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}

                {activeTab === 'favorites' && (
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2.5, fontSize: '1.2rem' }}>Favorilerim</Typography>
                    {favorites.length === 0 ? (
                      <EmptyState text="Favori listeniz boş." action="Ürünlere git" onAction={() => navigate('/products')} />
                    ) : (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                          gap: 2,
                          alignItems: 'stretch'
                        }}
                      >
                        {favorites.map((fav) => {
                          const id = fav._id || fav.id;
                          const price = fav.discountPercentage > 0
                            ? fav.price - (fav.price * fav.discountPercentage / 100)
                            : (fav.price || fav.fiyat || 0);
                          return (
                            <Paper
                              key={id}
                              elevation={0}
                              onClick={() => id && navigate(`/product/${id}`)}
                              sx={{
                                ...cardSx,
                                p: 0,
                                minWidth: 0,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                '&:hover': { borderColor: 'rgba(148,109,109,0.35)', boxShadow: '0 10px 24px -16px rgba(46,59,85,0.35)' }
                              }}
                            >
                              <Box sx={{ width: '100%', aspectRatio: '1 / 1', bgcolor: '#F8F5F0', overflow: 'hidden', flexShrink: 0 }}>
                                <Box
                                  component="img"
                                  src={fav.image || fav.gorsel || FALLBACK_IMAGE}
                                  alt={fav.title || fav.name || ''}
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                              </Box>
                              <Box sx={{ p: 1.6, display: 'flex', flexDirection: 'column', gap: 0.8, flex: 1, minWidth: 0 }}>
                                <Typography
                                  fontWeight={800}
                                  sx={{
                                    color: '#2E3B55',
                                    fontSize: '0.92rem',
                                    lineHeight: 1.35,
                                    minHeight: '2.7em',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  {fav.title || fav.name || fav.isim}
                                </Typography>
                                <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
                                  <Typography fontWeight={800} sx={{ color: '#946D6D', whiteSpace: 'nowrap' }}>{formatPrice(price)} ₺</Typography>
                                  <IconButton
                                    aria-label="Favorilerden çıkar"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(id); }}
                                    sx={{ bgcolor: 'rgba(148,109,109,0.1)', color: '#946D6D', flexShrink: 0, width: 36, height: 36 }}
                                  >
                                    <DeleteOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}
              </motion.div>
            </AnimatePresence>
          </Paper>
        </Box>
      </Container>

      <Dialog open={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} fullScreen={isMobile} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: 0, sm: '24px' } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#2E3B55' }}>Yeni adres</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
            <TextField fullWidth label="Başlık (Ev, İş)" name="baslik" value={addressForm.baslik} onChange={handleAddressInputChange} sx={{ ...fieldSx, gridColumn: { sm: '1 / -1' } }} />
            <TextField fullWidth label="Alıcı ad soyad" name="adSoyad" value={addressForm.adSoyad} onChange={handleAddressInputChange} sx={fieldSx} />
            <TextField fullWidth label="Telefon" name="telefon" value={addressForm.telefon} onChange={handleAddressInputChange} sx={fieldSx} />
            <TextField fullWidth label="İl" name="il" value={addressForm.il} onChange={handleAddressInputChange} sx={fieldSx} />
            <TextField fullWidth label="İlçe" name="ilce" value={addressForm.ilce} onChange={handleAddressInputChange} sx={fieldSx} />
            <TextField fullWidth multiline rows={3} label="Açık adres" name="adres" value={addressForm.adres} onChange={handleAddressInputChange} sx={{ ...fieldSx, gridColumn: '1 / -1' }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setIsAddressModalOpen(false)} sx={{ fontWeight: 700, color: '#6E5252' }}>İptal</Button>
          <Button onClick={handleAddAddress} variant="contained" sx={primaryBtnSx}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} fullScreen={isMobile} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: { xs: 0, sm: '24px' } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#2E3B55' }}>Yeni kart</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth label="Kart üzerindeki isim" name="kartSahibi" value={cardForm.kartSahibi} onChange={handleCardInputChange} sx={fieldSx} />
            <TextField fullWidth label="Kart numarası" name="kartNumarasi" value={cardForm.kartNumarasi} onChange={handleCardInputChange} inputProps={{ maxLength: 19 }} sx={fieldSx} />
            <TextField fullWidth label="Son kullanma (AA/YY)" name="skt" value={cardForm.skt} onChange={handleCardInputChange} placeholder="12/28" sx={fieldSx} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setIsCardModalOpen(false)} sx={{ fontWeight: 700, color: '#6E5252' }}>İptal</Button>
          <Button onClick={handleAddCard} variant="contained" sx={primaryBtnSx}>Kaydet</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteModal.isOpen} onClose={closeDeleteModal} PaperProps={{ sx: { borderRadius: '22px', maxWidth: 400 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#946D6D', fontWeight: 800 }}>
          <WarningAmberRoundedIcon /> {deleteModal.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#2E3B55', fontWeight: 600 }}>{deleteModal.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={closeDeleteModal} sx={{ fontWeight: 700, color: '#6E5252' }}>İptal</Button>
          <Button onClick={confirmDelete} variant="contained" sx={{ ...primaryBtnSx, bgcolor: '#946D6D' }}>Evet, sil</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} fullScreen={isMobile} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: 0, sm: '24px' } } }}>
        {isOrderLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
            <CircularProgress sx={{ color: '#946D6D', mb: 2 }} />
            <Typography sx={{ color: '#6E5252', fontWeight: 600 }}>Sipariş detayı yükleniyor...</Typography>
          </Box>
        ) : selectedOrder ? (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: '#2E3B55' }}>
              Sipariş #{String(selectedOrder._id).slice(-6).toUpperCase()}
              <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600, mt: 0.5 }}>{orderLabel(selectedOrder)}</Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 800 }}>TESLİMAT</Typography>
              <Typography sx={{ color: '#2E3B55', fontWeight: 600, mb: 2.5 }}>
                {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.district} / {selectedOrder.shippingAddress?.city}
              </Typography>
              {(selectedOrder.orderItems || []).map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5, p: 1.2, borderRadius: '14px', border: '1px solid rgba(148,109,109,0.12)', minWidth: 0 }}>
                  <Box component="img" src={item.image || FALLBACK_IMAGE} alt="" sx={{ width: 56, height: 56, borderRadius: '10px', objectFit: 'cover', flexShrink: 0, display: 'block' }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap fontWeight={800} sx={{ color: '#2E3B55' }}>{item.name}</Typography>
                    <Typography variant="body2" sx={{ color: '#6E5252' }}>Adet: {item.quantity}</Typography>
                  </Box>
                  <Typography fontWeight={800} sx={{ color: '#946D6D', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatPrice(item.price)} ₺</Typography>
                </Box>
              ))}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
              <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>Toplam {formatPrice(selectedOrder.totalPrice)} ₺</Typography>
              <Button onClick={() => setIsOrderModalOpen(false)} variant="contained" sx={primaryBtnSx}>Kapat</Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}

function HeaderRow({ title, actionLabel, icon, onClick }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 2.5, minWidth: 0 }}>
      <Typography fontWeight={800} noWrap sx={{ color: '#2E3B55', fontSize: '1.2rem', minWidth: 0 }}>{title}</Typography>
      <Button onClick={onClick} variant="contained" startIcon={icon} sx={{ ...primaryBtnSx, flexShrink: 0 }}>{actionLabel}</Button>
    </Box>
  );
}

function EmptyState({ text, action, onAction }) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
      <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>{text}</Typography>
      {action && (
        <Button onClick={onAction} variant="contained" sx={{ ...primaryBtnSx, mt: 2 }}>{action}</Button>
      )}
    </Box>
  );
}

const primaryBtnSx = {
  bgcolor: '#2E3B55',
  color: '#fff',
  borderRadius: '14px',
  px: 2.5,
  py: 1.1,
  fontWeight: 800,
  boxShadow: 'none',
  '&:hover': { bgcolor: '#946D6D', boxShadow: 'none' }
};

const cardSx = {
  p: 2.2,
  borderRadius: '18px',
  border: '1px solid rgba(148,109,109,0.14)',
  boxShadow: 'none',
  minWidth: 0,
  boxSizing: 'border-box'
};
