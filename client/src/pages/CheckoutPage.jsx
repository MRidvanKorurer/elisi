

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  LinearProgress // <-- EKLENDİ
} from '@mui/material';
import SiteContainer from '../components/SiteContainer';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';

import { cartService, normalizeCartItems } from '../api/cartServices';
import { orderService } from '../api/orderServices';
import { authService } from '../api/authService';
import { promoService } from '../api/promoService';
import userService from '../api/userService';
import { imgBagOrange } from '../assets/media';
import { BRIEF_FIELDS, emptyBrief, lineKey } from '../utils/orderBrief';
import Seo from '../components/Seo';
import { FREE_SHIPPING_LIMIT, SHIPPING_FEE } from '../utils/shipping';
import { getSitePublic } from '../api/siteService';
import LegalTextDialog from '../components/LegalTextDialog';
import BankTransferDetails from '../components/BankTransferDetails';

const FALLBACK_IMAGE = imgBagOrange;

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

const cardSx = {
  p: { xs: 1.6, sm: 2.2, md: 3 },
  borderRadius: { xs: '20px', md: '26px' },
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(148, 109, 109, 0.12)',
  boxShadow: '0 18px 40px -32px rgba(46,59,85,0.45)',
  minWidth: 0,
  maxWidth: '100%',
  width: '100%',
  boxSizing: 'border-box',
  overflow: 'hidden'
};

const fieldSx = {
  width: '100%',
  minWidth: 0,
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

const legalLinkSx = {
  display: 'inline',
  p: 0,
  border: 0,
  background: 'none',
  color: '#946D6D',
  font: 'inherit',
  fontWeight: 800,
  textDecoration: 'underline',
  cursor: 'pointer'
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
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1.2, minWidth: 0 }}>
      <Typography sx={{ color: '#6E5252', fontWeight: 600, minWidth: 0, pr: 1 }}>{label}</Typography>
      <Typography fontWeight={800} sx={{ color: accent ? '#2E7D32' : '#2E3B55', flexShrink: 0, textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

function SectionTitle({ step, title, hint }) {
  return (
    <Box sx={{ mb: 2, minWidth: 0, maxWidth: '100%' }}>
      <Box sx={{ color: '#2E3B55', display: 'flex', alignItems: 'center', gap: 1.2, fontWeight: 800, fontSize: { xs: '1rem', sm: '1.05rem' }, minWidth: 0 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#A290B7', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{step}</Box>
        <Box component="span" sx={{ minWidth: 0 }}>{title}</Box>
      </Box>
      {hint && (
        <Typography
          variant="body2"
          sx={{
            color: '#6E5252',
            mt: 0.8,
            pl: { xs: 0, sm: 5.2 },
            pr: { xs: 6, sm: 0 },
            lineHeight: 1.5,
            wordBreak: 'break-word'
          }}
        >
          {hint}
        </Typography>
      )}
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
        minWidth: 0,
        maxWidth: '100%',
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
      <Box sx={{ color: '#946D6D', mt: 0.1, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>{title}</Typography>
        <Typography variant="body2" sx={{ color: '#6E5252', mt: 0.3, wordBreak: 'break-word' }}>{subtitle}</Typography>
      </Box>
    </Box>
  );
}

export default function CheckoutPage({ user }) {
  const { t } = useTranslation('checkout');
  const navigate = useLocaleNavigate();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [briefs, setBriefs] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('new');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', identityNumber: '', address: '', city: '', district: '', addressTitle: 'Ev'
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
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalDoc, setLegalDoc] = useState('');
  const [site, setSite] = useState(null);

  useEffect(() => {
    getSitePublic().then(setSite);
  }, []);

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
        setCartItems(normalizeCartItems(response.items));
      } catch {
        showToast('Sepet bilgileri yüklenemedi.', 'error');
        setCartItems([]);
      } finally {
        setCartLoading(false);
      }
    };
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
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
      navigate('/giris');
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

    // Kargo limiti artık import edilen FREE_SHIPPING_LIMIT (1000) üzerinden çalışır
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
    if (paymentMethod === 'credit_card' && formData.identityNumber.replace(/\D/g, '').length !== 11) {
      next.identityNumber = 'Kart ödemesi için 11 haneli T.C. kimlik numarası gerekli';
    }
    if (!legalAccepted) next.legal = 'Sözleşmeleri onaylayın';
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

  const handleSaveAddress = async () => {
    if (!user) {
      showToast('Adresi kaydetmek için giriş yapın.', 'warning');
      navigate('/giris');
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
      phone: formData.phone.trim(),
      identityNumber: formData.identityNumber.replace(/\D/g, '')
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
      size: item.size,
      customBrief: briefs[lineKey(item)] || emptyBrief()
    })),
    paymentMethod: method,
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

      try { sessionStorage.setItem('nikbagGuestEmail', String(formData.email || '').trim()); } catch { /* ignore */ }

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
    const number = site?.whatsapp;
    if (!number) {
      showToast('WhatsApp numarası henüz tanımlanmamış.', 'warning');
      return;
    }
    const lines = cartItems.map((item) => {
      const brief = briefs[lineKey(item)] || {};
      const notes = BRIEF_FIELDS
        .map((field) => (String(brief[field.key] || '').trim() ? `${field.label}: ${brief[field.key].trim()}` : ''))
        .filter(Boolean)
        .join('\n');
      return `- ${item.name} x${item.quantity} (${formatPrice(item.price * item.quantity)} ₺)${notes ? `\n${notes}` : ''}`;
    }).join('\n');
    const welcomeLine = couponDiscount > 0 ? `\nHoş geldin (%${couponApplied?.percent || 10}): -${formatPrice(couponDiscount)} ₺` : '';
    const promoLine = promoDiscount > 0 ? `\nKampanya (${promoApplied?.code || ''} %${promoApplied?.percent || ''}): -${formatPrice(promoDiscount)} ₺` : '';
    const discountLine = `${welcomeLine}${promoLine}`;

    setWhatsappLoading(true);
    try {
      const response = await orderService.createOrder(buildPayload('whatsapp'));
      const pay = site?.bank?.iban
        ? `\n\nÖdeme: ${formatPrice(total)} ₺\n${site.bank.holder || site.bank.name || ''}\n${site.bank.iban}`
        : `\n\nÖdeme: ${formatPrice(total)} ₺`;
      const text = `Merhaba NikBag, sipariş vermek istiyorum.\n\n${formData.firstName} ${formData.lastName}\n${formData.phone}\n${formData.address}, ${formData.district}/${formData.city}\n\n${lines}${discountLine}\n\nToplam: ${formatPrice(total)} ₺${pay}${response?.orderId ? `\nSipariş: ${response.orderId}` : ''}`;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank');
      await cartService.clearCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      showToast(error.message || 'Sipariş kaydı oluşturulamadı.', 'error');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const payLabel = paymentMethod === 'credit_card'
    ? (selectedCardId === 'new' ? 'İyzico ile güvenli öde' : 'Kayıtlı kart ile tamamla')
    : 'Siparişi tamamla';

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', maxWidth: '100%', overflowX: 'clip', background: 'linear-gradient(180deg, #FDF4D2 0%, #F4E7C4 100%)', pt: { xs: 10, md: 13 }, pb: { xs: 16, md: 8 } }}>
      <Seo title={t('seoTitle')} path="/sepet" noindex />
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 8 }}>
        <Alert severity={toast.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 700 }}>{toast.message}</Alert>
      </Snackbar>

      <SiteContainer sx={{ px: { xs: 1.5, sm: 2, md: 3 }, maxWidth: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 3, flexWrap: 'wrap', minWidth: 0 }}>
          <Button startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />} onClick={() => navigate(-1)} sx={{ color: '#6E5252', fontWeight: 700, flexShrink: 0 }}>
            Geri
          </Button>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#2E3B55', fontSize: { xs: '1.35rem', sm: '1.5rem', md: '2rem' } }}>Güvenli ödeme</Typography>
            <Typography variant="body2" sx={{ color: '#6E5252', pr: { xs: 6, sm: 0 } }}>Kart numarası sitede saklanmaz. Tam ödeme İyzico altyapısıyla tamamlanır.</Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.2fr) minmax(0, 0.8fr)' },
            gap: { xs: 2.5, md: 3.5 },
            alignItems: 'start',
            width: '100%',
            minWidth: 0
          }}
        >
          <Stack spacing={2.5} sx={{ minWidth: 0, width: '100%', maxWidth: '100%' }}>
            <Paper elevation={0} sx={cardSx}>
              <SectionTitle step="1" title={t('contact')} hint={t('contactHint')} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: 2, width: '100%' }}>
                <TextField fullWidth name="firstName" label={t('firstName')} value={formData.firstName} onChange={handleInputChange} error={!!errors.firstName} helperText={errors.firstName} sx={fieldSx} />
                <TextField fullWidth name="lastName" label={t('lastName')} value={formData.lastName} onChange={handleInputChange} error={!!errors.lastName} helperText={errors.lastName} sx={fieldSx} />
                <TextField fullWidth name="email" label={t('email')} value={formData.email} onChange={handleInputChange} error={!!errors.email} helperText={errors.email} sx={fieldSx} />
                <TextField fullWidth name="phone" label={t('phone')} value={formData.phone} onChange={handleInputChange} error={!!errors.phone} helperText={errors.phone} placeholder="05xx xxx xx xx" sx={fieldSx} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <SectionTitle step="2" title={t('addressTitle')} hint={t('addressHint')} />
              {!user && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: '14px' }}>
                  Adresi profilinize kaydetmek için{' '}
                  <Box component="span" onClick={() => navigate('/giris')} sx={{ fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>giriş yapın</Box>.
                </Alert>
              )}
              {addresses.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: 1.2, mb: 2 }}>
                  {addresses.map((addr) => (
                    <SelectBox key={addr._id} selected={selectedAddressId === addr._id} onClick={() => applyAddress(addr)}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
                        <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem', minWidth: 0 }} noWrap>{addr.baslik}</Typography>
                        {selectedAddressId === addr._id && <CheckRoundedIcon sx={{ fontSize: 18, color: '#946D6D', flexShrink: 0 }} />}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#6E5252', mt: 0.4 }}>{addr.adSoyad}</Typography>
                      <Typography variant="caption" sx={{ color: '#6E5252', display: 'block', mt: 0.3, wordBreak: 'break-word' }}>
                        {addr.adres}, {addr.ilce}/{addr.il}
                      </Typography>
                    </SelectBox>
                  ))}
                </Box>
              )}
              <Button
                variant="outlined"
                fullWidth
                onClick={openNewAddress}
                sx={{ mb: 2, borderRadius: '14px', fontWeight: 800, borderColor: 'rgba(148,109,109,0.35)', color: '#946D6D', width: { xs: '100%', sm: 'auto' } }}
              >
                Yeni adres ekle
              </Button>
              <Collapse in={showAddressForm || !selectedAddressId} unmountOnExit={false}>
                <Stack spacing={2} sx={{ minWidth: 0 }}>
                  <TextField fullWidth name="addressTitle" label={t('addressLabel')} value={formData.addressTitle} onChange={handleInputChange} placeholder={t('addressPlaceholder')} sx={fieldSx} />
                  <TextField fullWidth name="address" label={t('street')} value={formData.address} onChange={handleInputChange} multiline minRows={2} error={!!errors.address} helperText={errors.address} sx={fieldSx} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: 2 }}>
                    <TextField fullWidth name="city" label={t('city')} value={formData.city} onChange={handleInputChange} error={!!errors.city} helperText={errors.city} sx={fieldSx} />
                    <TextField fullWidth name="district" label={t('district')} value={formData.district} onChange={handleInputChange} error={!!errors.district} helperText={errors.district} sx={fieldSx} />
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
              <SectionTitle step="3" title={t('payment')} hint={t('paymentHint')} />
              <PayOption
                selected={paymentMethod === 'credit_card'}
                onClick={() => setPaymentMethod('credit_card')}
                icon={<CreditCardOutlinedIcon />}
                title="Kredi / banka kartı"
                subtitle="Ödeme İyzico sayfasında alınır. Kart numarası bu sitede saklanmaz."
              />
              <Collapse in={paymentMethod === 'credit_card'}>
                <Box sx={{ mb: 2 }}>
                  <Alert severity="info" sx={{ mb: 1.5, borderRadius: '14px' }}>
                    Kart bilgisi İyzico’nun güvenli sayfasında girilir. Bu sitede saklanmaz.
                  </Alert>
                  <TextField
                    name="identityNumber"
                    label="T.C. kimlik numarası"
                    value={formData.identityNumber}
                    onChange={handleInputChange}
                    error={!!errors.identityNumber}
                    helperText={errors.identityNumber || 'İyzico ödemesi için zorunlu'}
                    slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 11 } }}
                    sx={fieldSx}
                    fullWidth
                  />
                </Box>
              </Collapse>

              <PayOption
                selected={paymentMethod === 'transfer'}
                onClick={() => setPaymentMethod('transfer')}
                icon={<AccountBalanceOutlinedIcon />}
                title="Havale / EFT"
                subtitle="Sipariş sonrası hesap bilgileri gösterilir. Ödeme onaylanınca üretim başlar."
              />
              <Box sx={{ mb: 2, p: 2, borderRadius: '18px', border: '1px dashed rgba(148,109,109,0.35)', backgroundColor: 'rgba(253,244,210,0.55)' }}>
                <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 0.4 }}>Ödeme hesabı</Typography>
                <BankTransferDetails
                  bank={site?.bank}
                  note={t('bankHint')}
                />
              </Box>

              <FormControlLabel
                sx={{ alignItems: 'flex-start', mt: 1, mb: 1.5, mx: 0 }}
                control={
                  <Checkbox
                    checked={legalAccepted}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setLegalDoc('on-bilgilendirme');
                        return;
                      }
                      setLegalAccepted(false);
                    }}
                    sx={{ color: '#946D6D', pt: 0.2 }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: errors.legal ? '#d32f2f' : '#6E5252', lineHeight: 1.5 }}>
                    <Box component="button" type="button" onClick={() => setLegalDoc('on-bilgilendirme')} sx={legalLinkSx}>Ön bilgilendirme</Box>
                    {', '}
                    <Box component="button" type="button" onClick={() => setLegalDoc('mesafeli-satis')} sx={legalLinkSx}>mesafeli satış sözleşmesi</Box>
                    {' ve '}
                    <Box component="button" type="button" onClick={() => setLegalDoc('gizlilik')} sx={legalLinkSx}>gizlilik</Box>
                    {' metinlerini okudum, kabul ediyorum.'}
                  </Typography>
                }
              />

              <Button
                fullWidth
                variant="outlined"
                startIcon={whatsappLoading ? <CircularProgress size={16} color="inherit" /> : <WhatsAppIcon />}
                disabled={!cartItems.length || whatsappLoading || loading}
                onClick={handleWhatsAppOrder}
                sx={{ mt: 1, py: 1.2, borderRadius: '14px', borderColor: '#25D366', color: '#1B8F47', fontWeight: 800, backgroundColor: 'rgba(37,211,102,0.08)', '&:hover': { backgroundColor: '#25D366', color: '#FFFFFF', borderColor: '#25D366' } }}
              >
                {whatsappLoading ? t('actions.loading', { ns: 'common' }) : 'WhatsApp ile sipariş'}
              </Button>
            </Paper>
          </Stack>

          {/* SİPARİŞ ÖZETİ (SAĞ PANEL) */}
          <Paper elevation={0} sx={{ ...cardSx, position: { lg: 'sticky' }, top: { lg: 100 } }}>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2, fontSize: '1.15rem' }}>Sipariş özeti</Typography>
            {cartLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#946D6D' }} /></Box>
            ) : cartItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography sx={{ color: '#6E5252', mb: 2 }}>Sepetiniz boş.</Typography>
                <Button variant="contained" onClick={() => navigate('/urunler')} sx={{ ...darkBtnSx }}>Ürünlere git</Button>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ mb: 2, minWidth: 0 }}>
                {cartItems.map((item) => (
                  <Box
                    key={`${productIdOf(item)}-${item.color}-${item.size}`}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '64px minmax(0, 1fr)', sm: '72px minmax(0, 1fr) auto' },
                      gap: { xs: 1.2, sm: 1.5 },
                      alignItems: 'start',
                      minWidth: 0
                    }}
                  >
                    <Box
                      component="img"
                      src={item.image || FALLBACK_IMAGE}
                      alt={item.name}
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                      sx={{ width: { xs: 64, sm: 72 }, height: { xs: 64, sm: 72 }, borderRadius: '14px', objectFit: 'cover', bgcolor: '#F8F5F0' }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#6E5252' }}>{[item.color, item.size].filter(Boolean).join(' · ') || 'Standart'}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.6, flexWrap: 'wrap' }}>
                        <IconButton size="small" onClick={() => handleQty(item, item.quantity - 1)} sx={{ border: '1px solid rgba(148,109,109,0.2)', width: 36, height: 36 }}><RemoveIcon sx={{ fontSize: 18 }} /></IconButton>
                        <Typography fontWeight={800} sx={{ minWidth: 22, textAlign: 'center' }}>{item.quantity}</Typography>
                        <IconButton size="small" onClick={() => handleQty(item, item.quantity + 1)} sx={{ border: '1px solid rgba(148,109,109,0.2)', width: 36, height: 36 }}><AddIcon sx={{ fontSize: 18 }} /></IconButton>
                        <IconButton size="small" onClick={() => handleRemoveLine(item)} sx={{ ml: 'auto', color: '#946D6D', width: 36, height: 36 }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                      </Box>
                      <Typography fontWeight={800} sx={{ color: '#946D6D', mt: 0.6, display: { xs: 'block', sm: 'none' } }}>{formatPrice(item.price * item.quantity)} ₺</Typography>
                    </Box>
                    <Typography fontWeight={800} sx={{ color: '#946D6D', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' }, pt: 0.2 }}>{formatPrice(item.price * item.quantity)} ₺</Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {/* ---> YENİ EKLENEN KARGO BARI (Ücretsiz kargoya kalan tutar) <--- */}
            {cartItems.length > 0 && subtotal > 0 && (
              <Box
                sx={{
                  mb: 2.5,
                  p: 1.8,
                  borderRadius: '16px',
                  bgcolor: remainingForFreeShipping > 0 ? '#FDF4D2' : '#E8F5E9',
                  border: '1px dashed',
                  borderColor: remainingForFreeShipping > 0 ? 'rgba(148,109,109,0.28)' : 'rgba(46,125,50,0.2)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: remainingForFreeShipping > 0 ? 1.2 : 0 }}>
                  <Typography sx={{ fontSize: '1.2rem' }}>{remainingForFreeShipping > 0 ? '📦' : '🚚'}</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: remainingForFreeShipping > 0 ? '#2E3B55' : '#2E7D32' }}>
                    {remainingForFreeShipping > 0
                      ? `Kargonun bedava olmasına ${formatPrice(remainingForFreeShipping)} ₺ kaldı!`
                      : 'Tebrikler! Kargo bedava.'}
                  </Typography>
                </Box>
                {remainingForFreeShipping > 0 && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (subtotal / FREE_SHIPPING_LIMIT) * 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(148,109,109,0.15)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#946D6D', borderRadius: 4 }
                    }}
                  />
                )}
              </Box>
            )}

            <Box sx={{ mb: 2, p: 1.6, borderRadius: '16px', backgroundColor: 'rgba(253,244,210,0.7)', border: '1px dashed rgba(148,109,109,0.28)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                <CardGiftcardOutlinedIcon sx={{ color: '#946D6D', fontSize: 20 }} />
                <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }}>Hoş geldin kodu</Typography>
              </Box>
              {user ? (
                <>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="NIK10-XXXXXX"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      disabled={couponBusy || couponLocked}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' }, minWidth: 0 }}
                    />
                    <Button
                      variant="contained"
                      disabled={couponBusy || couponLocked}
                      onClick={applyCoupon}
                      sx={{ borderRadius: '12px', fontWeight: 800, px: 1.8, flexShrink: 0, width: { xs: '100%', sm: 'auto' }, backgroundColor: '#946D6D', '&:hover': { backgroundColor: '#2E3B55' } }}
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
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Site veya atölye kodu"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  disabled={promoBusy}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' }, minWidth: 0 }}
                />
                <Button
                  variant="contained"
                  disabled={promoBusy}
                  onClick={() => applyPromo()}
                  sx={{ borderRadius: '12px', fontWeight: 800, px: 1.8, flexShrink: 0, width: { xs: '100%', sm: 'auto' }, backgroundColor: '#2E3B55', '&:hover': { backgroundColor: '#946D6D' } }}
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

             {cartItems.length > 0 && (
              <Box sx={{ mb: 2, p: 1.6, borderRadius: '16px', border: '1px solid rgba(148,109,109,0.16)', bgcolor: 'rgba(253,244,210,0.45)' }}>
                <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 0.4 }}>Sipariş Notu</Typography>
                <Typography sx={{ color: '#6E5252', fontSize: 13, mb: 1.4 }}>
                  Varsa özel üretim ürünleriniz için ölçü/renk taleplerinizi veya siparişinizle ilgili diğer notlarınızı buraya yazabilirsiniz.
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Sipariş notunuz (Örn: Siyah çantanın sapı 5cm daha uzun olsun)"
                  value={briefs.generalNote || ''}
                  onChange={(event) => setBriefs((prev) => ({
                    ...prev,
                    generalNote: event.target.value
                  }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }}
                />
              </Box>
            )}

            
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

            {/* GÜNCELLENEN KARGO SATIRI */}
            <Row
              label="Kargo"
              value={shippingCost === 0 ? 'Ücretsiz' : `${formatPrice(shippingCost)} ₺`}
              accent={shippingCost === 0}
            />

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
      </SiteContainer>

      <Paper
        elevation={8}
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          px: 1.5,
          py: 1.2,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          gap: 1.2,
          alignItems: 'center',
          minWidth: 0,
          background: 'rgba(253,244,210,0.94)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(148,109,109,0.16)'
        }}
      >
        <Box sx={{ minWidth: 0, flexShrink: 0 }}>
          <Typography variant="caption" sx={{ color: '#6E5252', fontWeight: 700, display: 'block', lineHeight: 1.1 }}>Toplam</Typography>
          <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{formatPrice(total)} ₺</Typography>
        </Box>
        <Button
          fullWidth
          variant="contained"
          disabled={loading || !cartItems.length}
          onClick={handleOrderSubmit}
          sx={{
            borderRadius: '14px',
            py: 1.25,
            minWidth: 0,
            fontSize: { xs: '0.78rem', sm: '0.875rem' },
            ...darkBtnSx
          }}
        >
          {loading ? 'İşleniyor...' : (paymentMethod === 'credit_card' ? 'Güvenli öde' : 'Tamamla')}
        </Button>
      </Paper>
      <LegalTextDialog
        open={Boolean(legalDoc)}
        slug={legalDoc}
        slugs={['on-bilgilendirme', 'mesafeli-satis', 'gizlilik']}
        onClose={() => setLegalDoc('')}
        onAccept={() => {
          setLegalAccepted(true);
          setErrors((prev) => ({ ...prev, legal: '' }));
        }}
      />
    </Box>
  );
}