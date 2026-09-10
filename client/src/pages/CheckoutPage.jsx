import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';

import { cartService } from '../api/cartServices';
import { orderService } from '../api/orderServices';
import { authService } from '../api/authService';
import { promoService } from '../api/promoService';
import userService from '../api/userService';
import { imgBagOrange } from '../assets/media';
import Seo from '../components/Seo';
import { FREE_SHIPPING_LIMIT, SHIPPING_FEE } from '../utils/shipping';

const WHATSAPP_NUMBER = '905551234567';
const FALLBACK_IMAGE = imgBagOrange;
const BANK = {
  name: 'NikBag El Sanatları',
  iban: 'TR00 0000 0000 0000 0000 0000 00'
};
const SAMPLE_CARD = {
  kartSahibi: 'Nik Bag',
  kartNumarasi: '5890 0400 0000 0016',
  skt: '12/30',
  cvc: '000'
};

const formatPrice = (value) =>
  Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const productIdOf = (item) => item.product?._id || item.product || item.id;

const promoItemsOf = (items) =>
  items.map((item) => ({
    product: productIdOf(item),
    quantity: item.quantity,
    price: item.price
  }));

const splitName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1)[0] };
};

const formatCardNumber = (value) =>
  String(value || '').replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

const formatSkt = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const formatPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length <= 9) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
};

const cardBrand = (number) => {
  const digits = String(number || '').replace(/\D/g, '');
  if (digits.startsWith('4')) return 'Visa';
  if (digits.startsWith('5')) return 'Mastercard';
  if (digits.startsWith('9') || digits.startsWith('6')) return 'Troy';
  return 'Kart';
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    backgroundColor: '#fff',
    '& fieldset': { borderColor: 'rgba(148, 109, 109, 0.18)' },
    '&:hover fieldset': { borderColor: '#946D6D' },
    '&.Mui-focused fieldset': { borderColor: '#946D6D', borderWidth: '1.5px' }
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#946D6D' }
};

const darkBtnSx = {
  backgroundColor: '#2E3B55',
  color: '#FFFFFF',
  fontWeight: 800,
  boxShadow: 'none',
  '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF', boxShadow: 'none' },
  '&.Mui-disabled': { color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(46,59,85,0.45)' }
};

const cardSx = {
  p: { xs: 2.2, md: 3 },
  borderRadius: '26px',
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(148, 109, 109, 0.12)',
  boxShadow: '0 18px 40px -32px rgba(46,59,85,0.45)'
};

function SelectBox({ selected, onClick, children }) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      sx={{
        cursor: 'pointer',
        border: selected ? '2px solid #946D6D' : '1px solid rgba(148,109,109,0.16)',
        backgroundColor: selected ? 'rgba(253,244,210,0.9)' : '#fff',
        borderRadius: '18px',
        p: 1.6,
        minWidth: 0,
        transition: 'border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease',
        '&:hover': { borderColor: '#946D6D', transform: 'translateY(-1px)' }
      }}
    >
      {children}
    </Box>
  );
}

function Row({ label, value, accent }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 2 }}>
      <Typography sx={{ color: '#6E5252', fontWeight: 600 }}>{label}</Typography>
      <Typography fontWeight={800} sx={{ color: accent ? '#2E7D32' : '#2E3B55' }}>{value}</Typography>
    </Box>
  );
}

function SectionTitle({ step, title, hint }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ color: '#2E3B55', display: 'flex', alignItems: 'center', gap: 1.2, fontWeight: 800, fontSize: '1.05rem' }}>
        <Box sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#A290B7', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{step}</Box>
        {title}
      </Box>
      {hint && <Typography variant="body2" sx={{ color: '#6E5252', mt: 0.8, pl: 5.2 }}>{hint}</Typography>}
    </Box>
  );
}

function PayOption({ selected, icon, title, subtitle, onClick }) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      sx={{
        cursor: 'pointer',
        border: selected ? '2px solid #946D6D' : '1px solid rgba(148,109,109,0.16)',
        backgroundColor: selected ? 'rgba(253,244,210,0.75)' : '#fff',
        borderRadius: '18px',
        px: 1.6,
        py: 1.3,
        display: 'flex',
        gap: 1.4,
        alignItems: 'flex-start',
        mb: 1.2,
        transition: 'border-color 0.2s ease, background-color 0.2s ease'
      }}
    >
      <Box
        sx={{
          width: 22,
          height: 22,
          mt: 0.2,
          borderRadius: '50%',
          border: selected ? '6px solid #946D6D' : '2px solid rgba(148,109,109,0.35)',
          flexShrink: 0
        }}
      />
      <Box sx={{ color: '#946D6D', mt: 0.1 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>{title}</Typography>
        <Typography variant="body2" sx={{ color: '#6E5252', mt: 0.3 }}>{subtitle}</Typography>
      </Box>
    </Box>
  );
}

export default function CheckoutPage({ user }) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('new');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', district: '', addressTitle: 'Ev'
  });
  const [cardForm, setCardForm] = useState({
    kartSahibi: '', kartNumarasi: '', skt: '', cvc: ''
  });
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponLocked, setCouponLocked] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');

  const showToast = (message, severity = 'error') => setToast({ open: true, message, severity });

  const applyAddress = (addr) => {
    if (!addr) return;
    setSelectedAddressId(addr._id);
    setShowAddressForm(false);
    const names = splitName(addr.adSoyad);
    setFormData((prev) => ({
      ...prev,
      firstName: names.firstName || prev.firstName,
      lastName: names.lastName || prev.lastName,
      phone: addr.telefon || prev.phone,
      address: addr.adres || '',
      city: addr.il || '',
      district: addr.ilce || '',
      addressTitle: addr.baslik || prev.addressTitle
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
    if (!user) {
      setShowAddressForm(true);
      setShowCardForm(true);
      return;
    }
    const names = splitName(user.adSoyad);
    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || names.firstName,
      lastName: prev.lastName || names.lastName,
      email: prev.email || user.email || '',
      phone: prev.phone || user.telefon || ''
    }));
    setCardForm((prev) => ({
      ...prev,
      kartSahibi: prev.kartSahibi || user.adSoyad || ''
    }));

    userService.getProfile()
      .then((res) => {
        const list = res.user?.adresler || [];
        const cards = res.user?.kayitliKartlar || [];
        setAddresses(list);
        setSavedCards(cards);
        const def = list.find((item) => item.isDefault) || list[0];
        if (def) applyAddress(def);
        else setShowAddressForm(true);
        if (cards[0]) {
          setSelectedCardId(cards[0]._id);
          setShowCardForm(false);
        } else {
          setSelectedCardId('new');
          setShowCardForm(true);
        }
      })
      .catch(() => setShowAddressForm(true));
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const hydrateCoupon = async () => {
      setCouponBusy(true);
      try {
        const me = await authService.getProfile();
        const fresh = me.kullanici || me.user || user;
        const kod = fresh.kampanyaKodu || user.kampanyaKodu || '';
        const used = Boolean(fresh.kampanyaKullanildi);
        setCouponInput(kod);
        setCouponLocked(used);
        if (!kod || used) {
          setCouponApplied(null);
          setCouponMessage(used ? 'Hoş geldin indirimin yalnızca ilk siparişte geçerlidir.' : '');
          return;
        }
        const data = await authService.verifyCampaign(kod);
        if (cancelled) return;
        if (data.success) {
          setCouponApplied({ code: data.kod || kod, percent: data.indirimOrani || 10 });
          setCouponMessage(data.mesaj || '%10 hoş geldin indirimi uygulandı.');
        } else {
          setCouponApplied(null);
          setCouponLocked(true);
          setCouponMessage(data.mesaj || '');
        }
      } catch (error) {
        if (cancelled) return;
        setCouponApplied(null);
        const mesaj = error.response?.data?.mesaj || '';
        setCouponLocked(Boolean(mesaj));
        setCouponMessage(mesaj);
      } finally {
        if (!cancelled) setCouponBusy(false);
      }
    };
    hydrateCoupon();
    return () => { cancelled = true; };
  }, [user]);

  const applyCoupon = async () => {
    if (!user) {
      showToast('İndirim kodu için giriş yap.', 'warning');
      navigate('/auth');
      return;
    }
    const kod = couponInput.trim();
    if (!kod) {
      showToast('Bir indirim kodu yaz.', 'warning');
      return;
    }
    try {
      setCouponBusy(true);
      const data = await authService.verifyCampaign(kod);
      if (!data.success) {
        setCouponApplied(null);
        setCouponMessage(data.mesaj || 'Kod uygulanamadı.');
        return;
      }
      setCouponApplied({ code: data.kod || kod, percent: data.indirimOrani || 10 });
      setCouponInput(data.kod || kod);
      setCouponMessage(data.mesaj || '%10 indirim uygulandı.');
    } catch (error) {
      setCouponApplied(null);
      setCouponMessage(error.response?.data?.mesaj || error.message || 'Kod geçersiz.');
    } finally {
      setCouponBusy(false);
    }
  };

  const applyPromo = async (rawCode = promoInput, currentSubtotal) => {
    const kod = String(rawCode || '').trim();
    const sub = currentSubtotal != null
      ? currentSubtotal
      : cartItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity || 1)), 0);
    if (!kod) {
      showToast('Bir kampanya kodu yaz.', 'warning');
      return;
    }
    try {
      setPromoBusy(true);
      const data = await promoService.verify(kod, sub, promoItemsOf(cartItems));
      if (!data.success) {
        setPromoApplied(null);
        setPromoMessage(data.mesaj || 'Kod uygulanamadı.');
        return;
      }
      setPromoApplied({
        code: data.kod || kod,
        percent: data.indirimOrani || 0,
        discount: Number(data.indirim) || 0,
        sellerScoped: Boolean(data.sellerScoped),
        shopName: data.shopName || ''
      });
      setPromoInput(data.kod || kod);
      setPromoMessage(data.mesaj || 'Kampanya uygulandı.');
    } catch (error) {
      setPromoApplied(null);
      setPromoMessage(error.response?.data?.mesaj || error.message || 'Kod geçersiz.');
    } finally {
      setPromoBusy(false);
    }
  };

  const promoCartKey = useMemo(
    () => cartItems.map((item) => `${productIdOf(item)}:${item.quantity || 1}`).join('|'),
    [cartItems]
  );

  const { subtotal, shippingCost, total, remainingForFreeShipping, couponDiscount, promoDiscount } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity || 1)), 0);
    const welcomePercent = Number(couponApplied?.percent || 0);
    const welcomeOff = welcomePercent > 0 ? Number((sub * welcomePercent / 100).toFixed(2)) : 0;
    const campaignOff = promoApplied?.discount != null
      ? Number(promoApplied.discount)
      : 0;
    const shipping = sub >= FREE_SHIPPING_LIMIT || sub === 0 ? 0 : SHIPPING_FEE;
    return {
      subtotal: sub,
      couponDiscount: welcomeOff,
      promoDiscount: campaignOff,
      shippingCost: shipping,
      total: Math.max(0, sub - welcomeOff - campaignOff) + shipping,
      remainingForFreeShipping: Math.max(0, FREE_SHIPPING_LIMIT - sub)
    };
  }, [cartItems, couponApplied, promoApplied]);

  useEffect(() => {
    if (!promoApplied?.code) return undefined;
    let cancelled = false;
    promoService.verify(promoApplied.code, subtotal, promoItemsOf(cartItems))
      .then((data) => {
        if (cancelled) return;
        if (!data.success) {
          setPromoApplied(null);
          setPromoMessage(data.mesaj || 'Kampanya bu tutarda geçerli değil.');
          return;
        }
        setPromoApplied((prev) => (prev ? {
          ...prev,
          percent: data.indirimOrani || prev.percent,
          discount: Number(data.indirim) || 0,
          sellerScoped: Boolean(data.sellerScoped),
          shopName: data.shopName || prev.shopName || ''
        } : prev));
        setPromoMessage(data.mesaj || 'Kampanya uygulandı.');
      })
      .catch((error) => {
        if (cancelled) return;
        setPromoApplied(null);
        setPromoMessage(error.response?.data?.mesaj || 'Kampanya bu tutarda geçerli değil.');
      });
    return () => { cancelled = true; };
  }, [subtotal, promoCartKey, promoApplied?.code]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    const next = name === 'phone' ? formatPhone(value) : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCardChange = (event) => {
    const { name, value } = event.target;
    let next = value;
    if (name === 'kartNumarasi') next = formatCardNumber(value);
    if (name === 'skt') next = formatSkt(value);
    if (name === 'cvc') next = String(value).replace(/\D/g, '').slice(0, 4);
    setCardForm((prev) => ({ ...prev, [name]: next }));
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

  const openNewAddress = () => {
    setSelectedAddressId('');
    setShowAddressForm(true);
    setFormData((prev) => ({ ...prev, address: '', city: '', district: '', addressTitle: 'Ev' }));
  };

  const openCardForm = () => {
    setSelectedCardId('new');
    setShowCardForm(true);
    setCardForm((prev) => ({
      ...prev,
      kartSahibi: prev.kartSahibi || `${formData.firstName} ${formData.lastName}`.trim() || user?.adSoyad || ''
    }));
  };

  const fillSampleCard = () => {
    setPaymentMethod('credit_card');
    setSelectedCardId('new');
    setShowCardForm(true);
    setCardForm({
      kartSahibi: `${formData.firstName} ${formData.lastName}`.trim() || SAMPLE_CARD.kartSahibi,
      kartNumarasi: SAMPLE_CARD.kartNumarasi,
      skt: SAMPLE_CARD.skt,
      cvc: SAMPLE_CARD.cvc
    });
    showToast('Örnek kart dolduruldu. Kaydetmeniz yeterli.', 'success');
  };

  const handleSaveAddress = async () => {
    if (!user) {
      showToast('Adresi kaydetmek için giriş yapın.', 'warning');
      navigate('/auth');
      return;
    }
    if (!formData.address.trim() || !formData.city.trim() || !formData.district.trim()) {
      showToast('Kaydetmek için il, ilçe ve açık adres gerekli.', 'warning');
      return;
    }
    try {
      setSavingAddress(true);
      const response = await userService.addAddress({
        baslik: formData.addressTitle.trim() || 'Teslimat',
        adSoyad: `${formData.firstName} ${formData.lastName}`.trim() || user.adSoyad,
        telefon: formData.phone.trim() || user.telefon || '05000000000',
        adres: formData.address.trim(),
        il: formData.city.trim(),
        ilce: formData.district.trim()
      });
      const list = response.addresses || [];
      setAddresses(list);
      applyAddress(response.addedAddress || list[list.length - 1]);
      showToast('Adres kaydedildi.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Adres kaydedilemedi.', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSaveCard = async () => {
    if (!user) {
      showToast('Kart kaydetmek için giriş yapın. Misafir olarak İyzico ile devam edebilirsiniz.', 'warning');
      return;
    }
    const digits = cardForm.kartNumarasi.replace(/\D/g, '');
    if (!cardForm.kartSahibi.trim() || digits.length < 15 || !/^\d{2}\/\d{2}$/.test(cardForm.skt)) {
      showToast('Kart adı, 16 haneli numara ve AA/YY son kullanma tarihi gerekli.', 'warning');
      return;
    }
    try {
      setSavingCard(true);
      const response = await userService.addCard({
        kartSahibi: cardForm.kartSahibi.trim(),
        kartNumarasi: digits,
        skt: cardForm.skt
      });
      const cards = response.savedCards || [];
      setSavedCards(cards);
      const added = cards[cards.length - 1];
      if (added?._id) setSelectedCardId(added._id);
      setShowCardForm(false);
      setCardForm({ kartSahibi: cardForm.kartSahibi, kartNumarasi: '', skt: '', cvc: '' });
      showToast('Kart kaydedildi.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Kart kaydedilemedi.', 'error');
    } finally {
      setSavingCard(false);
    }
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
    savedCardId: method === 'credit_card' && selectedCardId && selectedCardId !== 'new' ? selectedCardId : undefined,
    couponCode: couponApplied?.code || undefined,
    promoCode: promoApplied?.code || undefined
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
    const welcomeLine = couponDiscount > 0 ? `\nHoş geldin (%${couponApplied?.percent || 10}): -${formatPrice(couponDiscount)} ₺` : '';
    const promoLine = promoDiscount > 0 ? `\nKampanya (${promoApplied?.code || ''} %${promoApplied?.percent || ''}): -${formatPrice(promoDiscount)} ₺` : '';
    const discountLine = `${welcomeLine}${promoLine}`;
    const text = `Merhaba NikBag, sipariş vermek istiyorum.\n\n${formData.firstName} ${formData.lastName}\n${formData.phone}\n${formData.address}, ${formData.district}/${formData.city}\n\n${lines}${discountLine}\n\nToplam: ${formatPrice(total)} ₺`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');

    try {
      await orderService.createOrder(buildPayload('whatsapp'));
      await cartService.clearCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch {
      /* WhatsApp opened even if order record fails */
    }
  };

  const payLabel = paymentMethod === 'credit_card'
    ? (selectedCardId === 'new' ? 'İyzico ile güvenli öde' : 'Kayıtlı kart ile tamamla')
    : 'Siparişi tamamla';

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FDF4D2 0%, #F4E7C4 100%)', pt: { xs: 10, md: 13 }, pb: { xs: 14, md: 8 } }}>
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
            <Typography variant="body2" sx={{ color: '#6E5252' }}>Kart numarası sitede saklanmaz. Tam ödeme İyzico altyapısıyla tamamlanır.</Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(300px, 0.8fr)' },
            gap: { xs: 2.5, md: 3.5 },
            alignItems: 'start'
          }}
        >
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={cardSx}>
              <SectionTitle step="1" title="İletişim" hint="Sipariş ve kargo güncellemeleri bu bilgilere gider." />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField name="firstName" label="Ad" value={formData.firstName} onChange={handleInputChange} error={!!errors.firstName} helperText={errors.firstName} sx={fieldSx} />
                <TextField name="lastName" label="Soyad" value={formData.lastName} onChange={handleInputChange} error={!!errors.lastName} helperText={errors.lastName} sx={fieldSx} />
                <TextField name="email" label="E-posta" value={formData.email} onChange={handleInputChange} error={!!errors.email} helperText={errors.email} sx={fieldSx} />
                <TextField name="phone" label="Telefon" value={formData.phone} onChange={handleInputChange} error={!!errors.phone} helperText={errors.phone} placeholder="05xx xxx xx xx" sx={fieldSx} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <SectionTitle step="2" title="Teslimat adresi" hint="Kayıtlı adresiniz varsa seçin, yoksa yeni adres ekleyin." />
              {!user && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
                  Adresi profilinize kaydetmek için{' '}
                  <Box component="span" onClick={() => navigate('/auth')} sx={{ fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>giriş yapın</Box>.
                </Alert>
              )}
              {addresses.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2, mb: 2 }}>
                  {addresses.map((addr) => (
                    <SelectBox key={addr._id} selected={selectedAddressId === addr._id} onClick={() => applyAddress(addr)}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                        <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }}>{addr.baslik}</Typography>
                        {selectedAddressId === addr._id && <CheckRoundedIcon sx={{ fontSize: 18, color: '#946D6D' }} />}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#6E5252', mt: 0.4 }}>{addr.adSoyad}</Typography>
                      <Typography variant="caption" sx={{ color: '#6E5252', display: 'block', mt: 0.3 }}>
                        {addr.adres}, {addr.ilce}/{addr.il}
                      </Typography>
                    </SelectBox>
                  ))}
                </Box>
              )}
              <Button
                variant="outlined"
                onClick={openNewAddress}
                sx={{ mb: 2, borderRadius: '14px', fontWeight: 800, borderColor: 'rgba(148,109,109,0.35)', color: '#946D6D' }}
              >
                Yeni adres ekle
              </Button>
              <Collapse in={showAddressForm || !selectedAddressId} unmountOnExit={false}>
                <Stack spacing={2}>
                  <TextField name="addressTitle" label="Adres başlığı" value={formData.addressTitle} onChange={handleInputChange} placeholder="Ev, iş, stüdyo" sx={fieldSx} />
                  <TextField name="address" label="Açık adres" value={formData.address} onChange={handleInputChange} multiline minRows={2} error={!!errors.address} helperText={errors.address} sx={fieldSx} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField name="city" label="İl" value={formData.city} onChange={handleInputChange} error={!!errors.city} helperText={errors.city} sx={fieldSx} />
                    <TextField name="district" label="İlçe" value={formData.district} onChange={handleInputChange} error={!!errors.district} helperText={errors.district} sx={fieldSx} />
                  </Box>
                  {user && (
                    <Button disabled={savingAddress} onClick={handleSaveAddress} sx={{ alignSelf: 'flex-start', fontWeight: 800, color: '#2E3B55' }}>
                      {savingAddress ? 'Kaydediliyor...' : 'Bu adresi profilime kaydet'}
                    </Button>
                  )}
                </Stack>
              </Collapse>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <SectionTitle step="3" title="Ödeme yöntemi" hint="Kayıtlı kart seçin, yeni kart ekleyin veya havale ile tamamlayın." />
              <PayOption
                selected={paymentMethod === 'credit_card'}
                onClick={() => setPaymentMethod('credit_card')}
                icon={<CreditCardOutlinedIcon />}
                title="Kredi / banka kartı"
                subtitle="Kayıtlı kartınızı seçin veya örnek kart ile yeni kart ekleyin."
              />
              <Collapse in={paymentMethod === 'credit_card'}>
                <Box sx={{ mb: 2, pl: { xs: 0, sm: 0.5 } }}>
                  {!user && (
                    <Alert severity="info" sx={{ mb: 1.5, borderRadius: '14px' }}>
                      Kart kaydı için giriş gerekir. Misafir ödeme İyzico sayfasında açılır.
                    </Alert>
                  )}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2, mb: 1.5 }}>
                    {savedCards.map((card) => (
                      <SelectBox
                        key={card._id}
                        selected={selectedCardId === card._id && !showCardForm}
                        onClick={() => {
                          setSelectedCardId(card._id);
                          setShowCardForm(false);
                        }}
                      >
                        <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.85rem' }}>{card.kartTipi || 'Kart'}</Typography>
                        <Typography sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, letterSpacing: 1.4, mt: 0.5, color: '#2E3B55' }}>•••• {card.son4Hane}</Typography>
                        <Typography variant="caption" sx={{ color: '#6E5252' }}>{card.kartSahibi} · {card.skt}</Typography>
                      </SelectBox>
                    ))}
                    <SelectBox
                      selected={selectedCardId === 'new'}
                      onClick={openCardForm}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AddCardOutlinedIcon sx={{ color: '#946D6D' }} />
                        <Box>
                          <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }}>Yeni kart ekle</Typography>
                          <Typography variant="caption" sx={{ color: '#6E5252' }}>Formu aç, örnek kartı doldur</Typography>
                        </Box>
                      </Box>
                    </SelectBox>
                  </Box>

                  <Button
                    variant="outlined"
                    startIcon={<AutoAwesomeOutlinedIcon />}
                    onClick={fillSampleCard}
                    sx={{ mb: 1.5, borderRadius: '14px', fontWeight: 800, borderColor: '#A290B7', color: '#2E3B55', '&:hover': { borderColor: '#946D6D', backgroundColor: 'rgba(162,144,183,0.12)' } }}
                  >
                    Örnek kart doldur
                  </Button>

                  <Collapse in={showCardForm || selectedCardId === 'new'} unmountOnExit={false}>
                    <Box
                      sx={{
                        p: { xs: 1.6, sm: 2 },
                        borderRadius: '20px',
                        background: 'linear-gradient(180deg, #FDF4D2 0%, #fff 100%)',
                        border: '1px solid rgba(148,109,109,0.16)'
                      }}
                    >
                      <Box
                        sx={{
                          mb: 2,
                          p: 2,
                          borderRadius: '18px',
                          minHeight: 132,
                          background: 'linear-gradient(135deg, #2E3B55 0%, #946D6D 100%)',
                          color: '#FDF4D2',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Typography sx={{ fontWeight: 800, letterSpacing: 1.5, fontSize: 12 }}>{cardBrand(cardForm.kartNumarasi)}</Typography>
                        <Typography sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, letterSpacing: 2, fontSize: { xs: 16, sm: 18 } }}>
                          {cardForm.kartNumarasi || '•••• •••• •••• ••••'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{cardForm.kartSahibi || 'Kart sahibi'}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{cardForm.skt || 'AA/YY'}</Typography>
                        </Box>
                      </Box>
                      <Stack spacing={1.6}>
                        <TextField name="kartSahibi" label="Kart üzerindeki isim" value={cardForm.kartSahibi} onChange={handleCardChange} sx={fieldSx} />
                        <TextField name="kartNumarasi" label="Kart numarası" value={cardForm.kartNumarasi} onChange={handleCardChange} placeholder="ACCT-000015" slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 19 } }} sx={fieldSx} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.6 }}>
                          <TextField name="skt" label="Son kullanma" value={cardForm.skt} onChange={handleCardChange} placeholder="12/30" slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 5 } }} sx={fieldSx} />
                          <TextField name="cvc" label="CVC" value={cardForm.cvc} onChange={handleCardChange} placeholder="000" slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 4 } }} sx={fieldSx} />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#6E5252' }}>
                          Kart numarası kayıtta maskelenir. CVC saklanmaz.
                        </Typography>
                        <Button
                          variant="contained"
                          disabled={savingCard}
                          onClick={handleSaveCard}
                          startIcon={savingCard ? <CircularProgress size={16} color="inherit" /> : <AddCardOutlinedIcon />}
                          sx={{ ...darkBtnSx, borderRadius: '14px', py: 1.2 }}
                        >
                          {user ? 'Kartı kaydet' : 'Kart kaydı için giriş yapın'}
                        </Button>
                      </Stack>
                    </Box>
                  </Collapse>
                </Box>
              </Collapse>

              <PayOption
                selected={paymentMethod === 'transfer'}
                onClick={() => setPaymentMethod('transfer')}
                icon={<AccountBalanceOutlinedIcon />}
                title="Havale / EFT"
                subtitle="Sipariş sonrası hesap bilgileri gösterilir. Ödeme onaylanınca üretim başlar."
              />
              <Collapse in={paymentMethod === 'transfer'}>
                <Box sx={{ mb: 2, p: 2, borderRadius: '18px', border: '1px dashed rgba(148,109,109,0.35)', backgroundColor: 'rgba(253,244,210,0.55)' }}>
                  <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 0.6 }}>Banka bilgisi</Typography>
                  <Typography variant="body2" sx={{ color: '#6E5252' }}>{BANK.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#2E3B55', fontWeight: 800, letterSpacing: 0.4 }}>{BANK.iban}</Typography>
                  <Typography variant="caption" sx={{ color: '#946D6D', fontWeight: 700 }}>Açıklamaya sipariş kodunu yazın.</Typography>
                </Box>
              </Collapse>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                disabled={!cartItems.length}
                onClick={handleWhatsAppOrder}
                sx={{ mt: 1, py: 1.2, borderRadius: '14px', borderColor: '#25D366', color: '#1B8F47', fontWeight: 800, backgroundColor: 'rgba(37,211,102,0.08)', '&:hover': { backgroundColor: '#25D366', color: '#FFFFFF', borderColor: '#25D366' } }}
              >
                WhatsApp ile sipariş
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2, color: '#6E5252' }}>
                <LocalShippingOutlinedIcon fontSize="small" />
                <Typography variant="caption" fontWeight={700}>{formatPrice(FREE_SHIPPING_LIMIT)} ₺ ve üzeri kargo bedava</Typography>
              </Box>
            </Paper>
          </Stack>

          <Paper elevation={0} sx={{ ...cardSx, top: { lg: 100 } }}>
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

            <Box sx={{ mb: 2, p: 1.6, borderRadius: '16px', backgroundColor: 'rgba(253,244,210,0.7)', border: '1px dashed rgba(148,109,109,0.28)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                <CardGiftcardOutlinedIcon sx={{ color: '#946D6D', fontSize: 20 }} />
                <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }}>Hoş geldin kodu</Typography>
              </Box>
              {user ? (
                <>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="NIK10-XXXXXX"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      disabled={couponBusy || couponLocked}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' } }}
                    />
                    <Button
                      variant="contained"
                      disabled={couponBusy || couponLocked}
                      onClick={applyCoupon}
                      sx={{ borderRadius: '12px', fontWeight: 800, px: 1.8, backgroundColor: '#946D6D', '&:hover': { backgroundColor: '#2E3B55' } }}
                    >
                      {couponBusy ? '...' : 'Uygula'}
                    </Button>
                  </Box>
                  {couponMessage && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: couponApplied ? '#1B8F47' : '#946D6D', fontWeight: 700 }}>
                      {couponMessage}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600 }}>
                  Üye ol, ilk siparişine özel %10 indirim kodunu kullan.
                </Typography>
              )}
            </Box>
            <Box sx={{ mb: 2, p: 1.6, borderRadius: '16px', backgroundColor: '#fff', border: '1px dashed rgba(46,59,85,0.18)' }}>
              <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem', mb: 1 }}>Kampanya kodu</Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#6E5252', fontWeight: 600 }}>
                Site kodları tüm sepette, atölye kodları yalnızca o satıcının ürünlerinde geçerlidir.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Site veya atölye kodu"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  disabled={promoBusy}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' } }}
                />
                <Button
                  variant="contained"
                  disabled={promoBusy}
                  onClick={() => applyPromo()}
                  sx={{ borderRadius: '12px', fontWeight: 800, px: 1.8, backgroundColor: '#2E3B55', '&:hover': { backgroundColor: '#946D6D' } }}
                >
                  {promoBusy ? '...' : 'Uygula'}
                </Button>
              </Box>
              {promoMessage && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: promoApplied ? '#1B8F47' : '#946D6D', fontWeight: 700 }}>
                  {promoMessage}
                </Typography>
              )}
            </Box>
            <Divider sx={{ my: 2, borderColor: 'rgba(148,109,109,0.12)' }} />
            <Row label="Ara toplam" value={`${formatPrice(subtotal)} ₺`} />
            {couponDiscount > 0 && (
              <Row label={`Hoş geldin (%${couponApplied?.percent || 10})`} value={`-${formatPrice(couponDiscount)} ₺`} accent />
            )}
            {promoDiscount > 0 && (
              <Row
                label={promoApplied?.sellerScoped && promoApplied.shopName
                  ? `Kampanya · ${promoApplied.shopName} (%${promoApplied.percent || 0})`
                  : `Kampanya (%${promoApplied?.percent || 0})`}
                value={`-${formatPrice(promoDiscount)} ₺`}
                accent
              />
            )}
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
              {payLabel}
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
          {loading ? 'İşleniyor...' : payLabel}
        </Button>
      </Paper>
    </Box>
  );
}
