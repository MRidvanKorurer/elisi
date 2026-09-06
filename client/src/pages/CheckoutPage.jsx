import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  Typography,
  FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import { cartService } from '../api/cartServices';
import { orderService } from '../api/orderServices';
import userService from '../api/userService';
import { imgBagOrange } from '../assets/media';
import Seo from '../components/Seo';

const WHATSAPP_NUMBER = '905XXXXXXXXX';
const FREE_SHIPPING_LIMIT = 500;
const FALLBACK_IMAGE = imgBagOrange;

const formatPrice = (value) =>
  Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const productIdOf = (item) => item.product?._id || item.product || item.id;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '14px',
    backgroundColor: '#FDF4D2',
    '& fieldset': { borderColor: 'rgba(148, 109, 109, 0.2)' },
    '&:hover fieldset': { borderColor: '#946D6D' },
    '&.Mui-focused fieldset': { borderColor: '#946D6D', borderWidth: '1.5px' }
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#946D6D' }
};

const darkBtnSx = {
  backgroundColor: '#2E3B55',
  color: '#FFFFFF',
  fontWeight: 800,
  '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF' },
  '&.Mui-disabled': { color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(46,59,85,0.45)' }
};

function SelectBox({ selected, onClick, children }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        border: selected ? '2px solid #946D6D' : '1px solid rgba(148,109,109,0.18)',
        backgroundColor: selected ? 'rgba(253,244,210,0.85)' : '#FDF4D2',
        borderRadius: '16px',
        p: 1.5,
        minWidth: 0,
        transition: 'border-color 0.2s ease, background-color 0.2s ease'
      }}
    >
      {children}
    </Box>
  );
}

const cardSx = {
  p: { xs: 2.2, md: 3 },
  borderRadius: '24px',
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(148, 109, 109, 0.12)'
};

const splitName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1)[0] };
};

function Row({ label, value, accent }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography sx={{ color: '#6E5252', fontWeight: 600 }}>{label}</Typography>
      <Typography fontWeight={800} sx={{ color: accent ? '#2E7D32' : '#2E3B55' }}>{value}</Typography>
    </Box>
  );
}

function SectionTitle({ step, title }) {
  return (
    <Box sx={{ color: '#2E3B55', mb: 2, display: 'flex', alignItems: 'center', gap: 1.2, fontWeight: 800, fontSize: '1.05rem' }}>
      <Box sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#A290B7', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{step}</Box>
      {title}
    </Box>
  );
}

function PayOption({ selected, value, icon, title, subtitle }) {
  return (
    <Box
      sx={{
        border: selected ? '2px solid #946D6D' : '1px solid rgba(148,109,109,0.18)',
        backgroundColor: selected ? 'rgba(253,244,210,0.7)' : '#fff',
        borderRadius: '16px',
        px: 1.2,
        py: 0.6,
        mb: 1.2
      }}
    >
      <FormControlLabel
        value={value}
        control={<Radio sx={{ color: '#A290B7', '&.Mui-checked': { color: '#946D6D' } }} />}
        sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
        label={
          <Box sx={{ display: 'flex', gap: 1.2, py: 0.8, pr: 1 }}>
            <Box sx={{ color: '#946D6D', mt: 0.2 }}>{icon}</Box>
            <Box>
              <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>{title}</Typography>
              <Typography variant="body2" sx={{ color: '#6E5252', mt: 0.3 }}>{subtitle}</Typography>
            </Box>
          </Box>
        }
      />
    </Box>
  );
}

export default function CheckoutPage({ user }) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('new');
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', district: ''
  });

  const showToast = (message, severity = 'error') => setToast({ open: true, message, severity });

  const applyAddress = (addr) => {
    if (!addr) return;
    setSelectedAddressId(addr._id);
    const names = splitName(addr.adSoyad);
    setFormData((prev) => ({
      ...prev,
      firstName: names.firstName || prev.firstName,
      lastName: names.lastName || prev.lastName,
      phone: addr.telefon || prev.phone,
      address: addr.adres || '',
      city: addr.il || '',
      district: addr.ilce || ''
    }));
    setErrors((prev) => ({ ...prev, address: '', city: '', district: '' }));
  };

  useEffect(() => {
    const loadCart = async () => {
      try {
        setCartLoading(true);
        const response = await cartService.getCart();
        setCartItems(response.items || []);
      } catch {
        showToast('Sepet bilgileri yüklenemedi.', 'error');
        setCartItems([]);
      } finally {
        setCartLoading(false);
      }
    };
    loadCart();
  }, []);

  useEffect(() => {
    if (!user) return;
    const names = splitName(user.adSoyad);
    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || names.firstName,
      lastName: prev.lastName || names.lastName,
      email: prev.email || user.email || '',
      phone: prev.phone || user.telefon || ''
    }));

    userService.getProfile()
      .then((res) => {
        const list = res.user?.adresler || [];
        const cards = res.user?.kayitliKartlar || [];
        setAddresses(list);
        setSavedCards(cards);
        const def = list.find((item) => item.isDefault) || list[0];
        if (def) applyAddress(def);
        if (cards[0]) setSelectedCardId(cards[0]._id);
      })
      .catch(() => {});
  }, [user]);

  const { subtotal, shippingCost, total, remainingForFreeShipping } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity || 1)), 0);
    const shipping = sub >= FREE_SHIPPING_LIMIT || sub === 0 ? 0 : 49.9;
    return {
      subtotal: sub,
      shippingCost: shipping,
      total: sub + shipping,
      remainingForFreeShipping: Math.max(0, FREE_SHIPPING_LIMIT - sub)
    };
  }, [cartItems]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const syncCart = (items) => {
    setCartItems(items || []);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleRemoveLine = async (item) => {
    try {
      const response = await cartService.removeFromCart(productIdOf(item), {
        all: true,
        color: item.color,
        size: item.size
      });
      if (response.success) syncCart(response.items);
    } catch (error) {
      showToast(error.message || 'Ürün silinemedi.', 'error');
    }
  };

  const handleQty = async (item, nextQty) => {
    if (nextQty < 1) {
      await handleRemoveLine(item);
      return;
    }
    try {
      const response = await cartService.updateCartItem(productIdOf(item), {
        quantity: nextQty,
        color: item.color,
        size: item.size
      });
      if (response.success) syncCart(response.items);
    } catch (error) {
      showToast(error.message || 'Adet güncellenemedi.', 'error');
    }
  };

  const validateForm = () => {
    const next = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.firstName.trim()) next.firstName = 'Ad zorunlu';
    if (!formData.lastName.trim()) next.lastName = 'Soyad zorunlu';
    if (!formData.email.trim()) next.email = 'E-posta zorunlu';
    else if (!emailRegex.test(formData.email)) next.email = 'Geçerli bir e-posta girin';
    if (phoneDigits.length < 10) next.phone = 'Geçerli bir telefon girin';
    if (!formData.address.trim()) next.address = 'Adres zorunlu';
    if (!formData.city.trim()) next.city = 'İl zorunlu';
    if (!formData.district.trim()) next.district = 'İlçe zorunlu';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (method) => ({
    customerInfo: {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim()
    },
    shippingAddress: {
      address: formData.address.trim(),
      city: formData.city.trim(),
      district: formData.district.trim()
    },
    orderItems: cartItems.map((item) => ({
      product: productIdOf(item),
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      color: item.color,
      size: item.size
    })),
    paymentMethod: method,
    savedCardId: method === 'credit_card' && selectedCardId && selectedCardId !== 'new' ? selectedCardId : undefined
  });

  const handleOrderSubmit = async () => {
    if (!validateForm()) {
      showToast('Lütfen eksik alanları tamamlayın.', 'warning');
      return;
    }
    if (!cartItems.length) {
      showToast('Sepetiniz boş.', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await orderService.createOrder(buildPayload(paymentMethod));
      if (!response.success) {
        showToast(response.message || 'Sipariş oluşturulamadı.', 'error');
        return;
      }

      if (paymentMethod === 'credit_card' && response.paymentUrl && !response.usedSavedCard) {
        window.location.href = response.paymentUrl;
        return;
      }

      await cartService.clearCart();
      window.dispatchEvent(new Event('cartUpdated'));
      navigate(`/siparis-basarili?orderId=${response.orderId}&method=${paymentMethod}`);
    } catch (error) {
      showToast(error.message || 'Sipariş oluşturulurken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!validateForm()) {
      showToast('WhatsApp siparişi için iletişim ve adres bilgileri gerekli.', 'warning');
      return;
    }
    const lines = cartItems.map((item) => `- ${item.name} x${item.quantity} (${formatPrice(item.price * item.quantity)} ₺)`).join('\n');
    const text = `Merhaba NikBag, sipariş vermek istiyorum.\n\n${formData.firstName} ${formData.lastName}\n${formData.phone}\n${formData.address}, ${formData.district}/${formData.city}\n\n${lines}\n\nToplam: ${formatPrice(total)} ₺`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');

    try {
      await orderService.createOrder(buildPayload('whatsapp'));
      await cartService.clearCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch {
      /* WhatsApp opened even if order record fails */
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FDF4D2 0%, #F7EBC0 100%)', pt: { xs: 10, md: 13 }, pb: { xs: 14, md: 8 } }}>
      <Seo title="Sepet ve Ödeme" path="/checkout" noindex />
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 8 }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 700 }}>{toast.message}</Alert>
      </Snackbar>

      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <Button startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => navigate(-1)} sx={{ color: '#6E5252', fontWeight: 700 }}>
            Geri
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#2E3B55', fontSize: { xs: '1.5rem', md: '2rem' } }}>Güvenli ödeme</Typography>
            <Typography variant="body2" sx={{ color: '#6E5252' }}>Bilgileriniz SSL ile korunur. Kart bilgisi sitede saklanmaz.</Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)' },
            gap: { xs: 2.5, md: 3.5 },
            alignItems: 'start'
          }}
        >
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={cardSx}>
              <SectionTitle step="1" title="İletişim" />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField name="firstName" label="Ad" value={formData.firstName} onChange={handleInputChange} error={!!errors.firstName} helperText={errors.firstName} sx={fieldSx} />
                <TextField name="lastName" label="Soyad" value={formData.lastName} onChange={handleInputChange} error={!!errors.lastName} helperText={errors.lastName} sx={fieldSx} />
                <TextField name="email" label="E-posta" value={formData.email} onChange={handleInputChange} error={!!errors.email} helperText={errors.email} sx={fieldSx} />
                <TextField name="phone" label="Telefon" value={formData.phone} onChange={handleInputChange} error={!!errors.phone} helperText={errors.phone} placeholder="05xx xxx xx xx" sx={fieldSx} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <SectionTitle step="2" title="Teslimat adresi" />
              {!user && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
                  Kayıtlı adreslerinizi kullanmak için{' '}
                  <Box component="span" onClick={() => navigate('/auth')} sx={{ fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>giriş yapın</Box>.
                </Alert>
              )}
              {user && addresses.length === 0 && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
                  Kayıtlı adresiniz yok.{' '}
                  <Box component="span" onClick={() => navigate('/profile')} sx={{ fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>Profilde adres ekle</Box>
                </Alert>
              )}
              {addresses.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2, mb: 2 }}>
                  {addresses.map((addr) => (
                    <SelectBox key={addr._id} selected={selectedAddressId === addr._id} onClick={() => applyAddress(addr)}>
                      <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }}>{addr.baslik}</Typography>
                      <Typography variant="body2" sx={{ color: '#6E5252', mt: 0.4 }}>{addr.adSoyad}</Typography>
                      <Typography variant="caption" sx={{ color: '#6E5252', display: 'block', mt: 0.3 }}>
                        {addr.adres}, {addr.ilce}/{addr.il}
                      </Typography>
                    </SelectBox>
                  ))}
                  <SelectBox selected={!selectedAddressId} onClick={() => setSelectedAddressId('')}>
                    <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }}>Yeni adres gir</Typography>
                    <Typography variant="caption" sx={{ color: '#6E5252' }}>Aşağıdaki formu doldurun</Typography>
                  </SelectBox>
                </Box>
              )}
              <Stack spacing={2}>
                <TextField name="address" label="Açık adres" value={formData.address} onChange={handleInputChange} multiline minRows={2} error={!!errors.address} helperText={errors.address} sx={fieldSx} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField name="city" label="İl" value={formData.city} onChange={handleInputChange} error={!!errors.city} helperText={errors.city} sx={fieldSx} />
                  <TextField name="district" label="İlçe" value={formData.district} onChange={handleInputChange} error={!!errors.district} helperText={errors.district} sx={fieldSx} />
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <SectionTitle step="3" title="Ödeme yöntemi" />
              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <PayOption selected={paymentMethod === 'credit_card'} value="credit_card" icon={<CreditCardOutlinedIcon />} title="Kredi / banka kartı" subtitle="Kayıtlı kartınızı seçin veya İyzico ile yeni kart ekleyin." />
                {paymentMethod === 'credit_card' && (
                  <Box sx={{ mb: 2, pl: { xs: 0, sm: 1 } }}>
                    {!user && (
                      <Alert severity="info" sx={{ mb: 1.5, borderRadius: '14px' }}>
                        Kayıtlı kart için{' '}
                        <Box component="span" onClick={() => navigate('/auth')} sx={{ fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>giriş yapın</Box>.
                      </Alert>
                    )}
                    {user && savedCards.length === 0 && (
                      <Alert severity="info" sx={{ mb: 1.5, borderRadius: '14px' }}>
                        Kayıtlı kartınız yok.{' '}
                        <Box component="span" onClick={() => navigate('/profile')} sx={{ fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>Profilde kart ekle</Box>
                      </Alert>
                    )}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2 }}>
                      {savedCards.map((card) => (
                        <SelectBox key={card._id} selected={selectedCardId === card._id} onClick={() => setSelectedCardId(card._id)}>
                          <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.85rem' }}>{card.kartTipi || 'Kart'}</Typography>
                          <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: 1, mt: 0.5, color: '#2E3B55' }}>•••• {card.son4Hane}</Typography>
                          <Typography variant="caption" sx={{ color: '#6E5252' }}>{card.kartSahibi} · {card.skt}</Typography>
                        </SelectBox>
                      ))}
                      <SelectBox selected={selectedCardId === 'new'} onClick={() => setSelectedCardId('new')}>
                        <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }}>Yeni kart</Typography>
                        <Typography variant="caption" sx={{ color: '#6E5252' }}>İyzico güvenli ödeme sayfası</Typography>
                      </SelectBox>
                    </Box>
                  </Box>
                )}
                <PayOption selected={paymentMethod === 'transfer'} value="transfer" icon={<AccountBalanceOutlinedIcon />} title="Havale / EFT" subtitle="Sipariş sonrası hesap bilgileri gösterilir. Ödeme onaylanınca üretim başlar." />
              </RadioGroup>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                disabled={!cartItems.length}
                onClick={handleWhatsAppOrder}
                sx={{ mt: 2, py: 1.2, borderRadius: '14px', borderColor: '#25D366', color: '#1B8F47', fontWeight: 800, backgroundColor: 'rgba(37,211,102,0.08)', '&:hover': { backgroundColor: '#25D366', color: '#FFFFFF', borderColor: '#25D366' } }}
              >
                WhatsApp ile sipariş
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2, color: '#6E5252' }}>
                <LocalShippingOutlinedIcon fontSize="small" />
                <Typography variant="caption" fontWeight={700}>500 ₺ ve üzeri kargo bedava</Typography>
              </Box>
            </Paper>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.2, md: 3 },
              borderRadius: '24px',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(148, 109, 109, 0.12)',
              position: { md: 'sticky' },
              top: { md: 100 }
            }}
          >
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2, fontSize: '1.15rem' }}>Sipariş özeti</Typography>
            {cartLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#946D6D' }} /></Box>
            ) : cartItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography sx={{ color: '#6E5252', mb: 2 }}>Sepetiniz boş.</Typography>
                <Button variant="contained" onClick={() => navigate('/products')} sx={{ ...darkBtnSx }}>Ürünlere git</Button>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                {cartItems.map((item) => (
                  <Box key={`${productIdOf(item)}-${item.color}-${item.size}`} sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
                    <Box component="img" src={item.image || FALLBACK_IMAGE} alt={item.name} onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} sx={{ width: 72, height: 72, borderRadius: '14px', objectFit: 'cover', flexShrink: 0, bgcolor: '#F8F5F0' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }} noWrap>{item.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#6E5252' }}>{[item.color, item.size].filter(Boolean).join(' · ') || 'Standart'}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.6 }}>
                        <IconButton size="small" onClick={() => handleQty(item, item.quantity - 1)} sx={{ border: '1px solid rgba(148,109,109,0.2)', width: 28, height: 28 }}><RemoveIcon sx={{ fontSize: 16 }} /></IconButton>
                        <Typography fontWeight={800} sx={{ minWidth: 18, textAlign: 'center' }}>{item.quantity}</Typography>
                        <IconButton size="small" onClick={() => handleQty(item, item.quantity + 1)} sx={{ border: '1px solid rgba(148,109,109,0.2)', width: 28, height: 28 }}><AddIcon sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" onClick={() => handleRemoveLine(item)} sx={{ ml: 'auto', color: '#946D6D' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Typography fontWeight={800} sx={{ color: '#946D6D', whiteSpace: 'nowrap' }}>{formatPrice(item.price * item.quantity)} ₺</Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {subtotal > 0 && remainingForFreeShipping > 0 && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: '14px', bgcolor: 'rgba(176,205,230,0.35)', color: '#2E3B55' }}>
                Ücretsiz kargo için {formatPrice(remainingForFreeShipping)} ₺ daha ekleyin.
              </Alert>
            )}

            <Divider sx={{ my: 2, borderColor: 'rgba(148,109,109,0.12)' }} />
            <Row label="Ara toplam" value={`${formatPrice(subtotal)} ₺`} />
            <Row label="Kargo" value={shippingCost === 0 ? 'Ücretsiz' : `${formatPrice(shippingCost)} ₺`} accent={shippingCost === 0} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
              <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>Toplam</Typography>
              <Typography fontWeight={800} sx={{ color: '#946D6D', fontSize: '1.45rem' }}>{formatPrice(total)} ₺</Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              disabled={loading || !cartItems.length}
              onClick={handleOrderSubmit}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockOutlinedIcon />}
              sx={{ mt: 2.5, py: 1.45, borderRadius: '16px', display: { xs: 'none', md: 'inline-flex' }, ...darkBtnSx }}
            >
              {paymentMethod === 'credit_card' ? 'Güvenli ödemeye geç' : 'Siparişi tamamla'}
            </Button>
          </Paper>
        </Box>
      </Container>

      <Paper
        elevation={8}
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          px: 2,
          py: 1.4,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          gap: 1.5,
          alignItems: 'center',
          background: 'rgba(253,244,210,0.94)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(148,109,109,0.16)'
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#6E5252', fontWeight: 700 }}>Toplam</Typography>
          <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>{formatPrice(total)} ₺</Typography>
        </Box>
        <Button fullWidth variant="contained" disabled={loading || !cartItems.length} onClick={handleOrderSubmit} sx={{ borderRadius: '14px', py: 1.3, ...darkBtnSx }}>
          {loading ? 'İşleniyor...' : 'Ödemeye geç'}
        </Button>
      </Paper>
    </Box>
  );
}
