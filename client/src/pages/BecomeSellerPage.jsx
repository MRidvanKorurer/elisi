import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import Instagram from '@mui/icons-material/Instagram';
import LanguageOutlined from '@mui/icons-material/LanguageOutlined';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import BusinessOutlined from '@mui/icons-material/BusinessOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { sellerService } from '../api/sellerService';
import { imgMood2 } from '../assets/media';
import Seo from '../components/Seo';
import { breadcrumbSchema } from '../utils/schema';
import {
  STEP_FIELDS,
  firstErrorMessage,
  getFieldError,
  mapServerErrorToField,
  normalizeFieldValue,
  validateFields
} from '../utils/sellerValidation';

import { CATEGORY_OPTIONS } from '../utils/categories';

const MAGAZA_TURLERI = CATEGORY_OPTIONS;

const STEPS = [
  { id: 0, label: 'Hesap', hint: 'Kimlik ve iletişim' },
  { id: 1, label: 'Atölye', hint: 'Mağaza kimliği' },
  { id: 2, label: 'Ödeme', hint: 'Adres ve IBAN' }
];

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '18px',
    backgroundColor: 'rgba(255,255,255,0.78)',
    transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
    '& fieldset': { borderColor: 'rgba(148, 109, 109, 0.16)' },
    '&:hover fieldset': { borderColor: 'rgba(148, 109, 109, 0.45)' },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      boxShadow: '0 0 0 4px rgba(176, 205, 230, 0.45)'
    },
    '&.Mui-focused fieldset': { borderColor: '#946D6D', borderWidth: '1.5px' }
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#946D6D' }
};

const DURUM_METIN = {
  pending: {
    title: 'Başvurunuz incelemede',
    text: 'Mağazanız onaylandıktan sonra ürün yükleyebilirsiniz. Bu süreç genellikle kısa sürer.',
    color: '#946D6D'
  },
  approved: {
    title: 'Mağazanız yayında',
    text: 'Satıcı hesabınız onaylandı. El emeğinizi vitrine taşıyabilirsiniz.',
    color: '#2E7D32'
  },
  rejected: {
    title: 'Başvuru reddedildi',
    text: 'Bilgilerinizi kontrol edip destek ekibiyle iletişime geçebilirsiniz.',
    color: '#C62828'
  },
  suspended: {
    title: 'Mağaza askıda',
    text: 'Hesabınız geçici olarak durduruldu. Destek ekibiyle iletişime geçin.',
    color: '#E65100'
  }
};

const PageBackdrop = () => (
  <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${imgMood2})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'saturate(0.85) brightness(0.92)',
        transform: 'scale(1.06)'
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(125deg, rgba(253,244,210,0.92) 0%, rgba(253,244,210,0.72) 42%, rgba(176,205,230,0.55) 100%)'
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        width: 420,
        height: 420,
        borderRadius: '50%',
        top: -80,
        right: -60,
        background: 'radial-gradient(circle, rgba(162,144,183,0.35) 0%, rgba(162,144,183,0) 70%)',
        filter: 'blur(10px)'
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        width: 360,
        height: 360,
        borderRadius: '50%',
        bottom: 40,
        left: -90,
        background: 'radial-gradient(circle, rgba(148,109,109,0.22) 0%, rgba(148,109,109,0) 70%)'
      }}
    />
  </Box>
);

const glassPanel = {
  position: 'relative',
  borderRadius: { xs: '28px', md: '36px' },
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(28px) saturate(160%)',
  WebkitBackdropFilter: 'blur(28px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.82)',
  boxShadow: '0 30px 80px -28px rgba(46,59,85,0.35), inset 0 1px 0 rgba(255,255,255,0.8)'
};

function Stepper({ step }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 }, mb: { xs: 3, md: 4 } }}>
      {STEPS.map((item, index) => {
        const active = step === index;
        const done = step > index;
        return (
          <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: done || active ? '#fff' : '#6E5252',
                  background: done || active
                    ? 'linear-gradient(135deg, #946D6D 0%, #A290B7 100%)'
                    : 'rgba(253,244,210,0.9)',
                  boxShadow: active ? '0 8px 18px rgba(148,109,109,0.28)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {done ? '✓' : index + 1}
              </Box>
              <Box sx={{ display: { xs: index === step ? 'block' : 'none', sm: 'block' }, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#2E3B55', lineHeight: 1.1 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: '#6E5252', fontWeight: 600, display: { xs: 'none', md: 'block' } }}>
                  {item.hint}
                </Typography>
              </Box>
            </Box>
            {index < STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1,
                  height: 2,
                  mx: 1,
                  borderRadius: 99,
                  background: done
                    ? 'linear-gradient(90deg, #946D6D, #A290B7)'
                    : 'rgba(148,109,109,0.18)'
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default function BecomeSellerPage({ user, onLoginSuccess }) {
  const loggedIn = Boolean(user);
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(Boolean(user));
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [seller, setSeller] = useState(null);

  const [form, setForm] = useState({
    adSoyad: user?.adSoyad || '',
    email: user?.email || '',
    sifre: '',
    telefon: user?.telefon || '',
    magazaAdi: '',
    magazaTuru: '',
    hesapTipi: 'bireysel',
    aciklama: '',
    sehir: '',
    ilce: '',
    adres: '',
    iban: '',
    tcKimlik: '',
    vergiNo: '',
    instagram: '',
    website: '',
    sozlesmeOnay: false
  });

  useEffect(() => {
    let cancelled = false;

    const loadSeller = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      try {
        const data = await sellerService.getMe();
        if (!cancelled) setSeller(data.satici);
      } catch {
        if (!cancelled) setSeller(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    loadSeller();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      adSoyad: prev.adSoyad || user.adSoyad || '',
      email: prev.email || user.email || '',
      telefon: prev.telefon || user.telefon || ''
    }));
  }, [user]);

  const setFieldError = (name, formState) => {
    const message = getFieldError(name, formState, { loggedIn });
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
    return message;
  };

  const handleChange = (key) => (event) => {
    const raw = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    const value = event.target.type === 'checkbox' ? raw : normalizeFieldValue(key, raw);
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (errors[key] || key === 'sozlesmeOnay') {
        const message = getFieldError(key, next, { loggedIn });
        setErrors((current) => {
          const copy = { ...current };
          if (message) copy[key] = message;
          else delete copy[key];
          return copy;
        });
      }
      return next;
    });
    if (error) setError('');
  };

  const handleBlur = (key) => () => {
    setForm((prev) => {
      const next = {
        ...prev,
        [key]: typeof prev[key] === 'string' ? prev[key].trim() : prev[key]
      };
      setFieldError(key, next);
      return next;
    });
  };

  const handleAccountType = (value) => {
    setForm((prev) => {
      const next = { ...prev, hesapTipi: value };
      setErrors((current) => {
        const copy = { ...current };
        delete copy.tcKimlik;
        delete copy.vergiNo;
        return copy;
      });
      return next;
    });
  };

  const validateCurrentStep = (current, formState = form) => {
    const names = STEP_FIELDS[current](loggedIn, formState.hesapTipi);
    const stepErrors = validateFields(names, formState, { loggedIn });
    setErrors((prev) => {
      const next = { ...prev };
      names.forEach((name) => {
        if (stepErrors[name]) next[name] = stepErrors[name];
        else delete next[name];
      });
      return next;
    });
    return stepErrors;
  };

  const goNext = () => {
    const stepErrors = validateCurrentStep(step);
    const message = firstErrorMessage(stepErrors);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((value) => Math.min(value + 1, 2));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const stepErrors = validateCurrentStep(2);
    const message = firstErrorMessage(stepErrors);
    if (message) {
      setError(message);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        adSoyad: form.adSoyad.trim(),
        email: form.email.trim().toLowerCase(),
        magazaAdi: form.magazaAdi.trim(),
        sehir: form.sehir.trim(),
        ilce: form.ilce.trim(),
        adres: form.adres.trim(),
        instagram: form.instagram.trim(),
        website: form.website.trim(),
        iban: form.iban.replace(/\s+/g, '').toUpperCase()
      };
      if (loggedIn) delete payload.sifre;

      const data = await sellerService.register(payload);
      setSeller(data.satici);
      if (onLoginSuccess && data.kullanici) {
        onLoginSuccess(data.kullanici, { redirect: false });
      }
    } catch (err) {
      const serverMessage = err.response?.data?.mesaj || err.response?.data?.message || 'Başvuru gönderilemedi. Lütfen tekrar deneyin.';
      const field = mapServerErrorToField(serverMessage);
      if (field) setErrors((prev) => ({ ...prev, [field]: serverMessage }));
      setError(serverMessage);
      if (err.response?.data?.satici) setSeller(err.response.data.satici);
    } finally {
      setLoading(false);
    }
  };

  const fieldProps = (name, extraHelper) => ({
    error: Boolean(errors[name]),
    helperText: errors[name] || extraHelper || undefined,
    onBlur: handleBlur(name)
  });

  const durum = useMemo(() => DURUM_METIN[seller?.durum] || DURUM_METIN.pending, [seller]);

  if (checking) {
    return (
      <Box sx={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PageBackdrop />
        <CircularProgress sx={{ color: '#946D6D', position: 'relative', zIndex: 1 }} />
      </Box>
    );
  }

  if (seller?.durum === 'approved') {
    return <Navigate to="/admin" replace />;
  }

  if (seller) {
    return (
      <Box sx={{ minHeight: '100vh', position: 'relative', pt: { xs: 13, md: 16 }, pb: 10, px: 2 }}>
        <PageBackdrop />
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>
            <Box sx={{ ...glassPanel, textAlign: 'center', p: { xs: 4, sm: 6.5 } }}>
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  mx: 'auto',
                  mb: 2.5,
                  borderRadius: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(145deg, #B0CDE6 0%, #A290B7 100%)',
                  color: '#2E3B55',
                  boxShadow: '0 18px 40px rgba(162,144,183,0.35)'
                }}
              >
                {seller.durum === 'pending' ? <HourglassEmptyRounded sx={{ fontSize: 42 }} /> : <CheckCircleRounded sx={{ fontSize: 46 }} />}
              </Box>
              <Typography variant="overline" sx={{ letterSpacing: 2.4, fontWeight: 800, color: '#A290B7' }}>
                Nik Bag Atölye
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ color: durum.color, letterSpacing: '-1.2px', mb: 1.5, fontSize: { xs: '1.85rem', sm: '2.3rem' } }}>
                {durum.title}
              </Typography>
              <Typography sx={{ color: '#6E5252', fontWeight: 600, mb: 3.5, lineHeight: 1.7 }}>
                {seller.reddetmeNedeni || durum.text}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  mb: 4,
                  p: 2.2,
                  borderRadius: '20px',
                  background: 'rgba(253,244,210,0.7)',
                  textAlign: 'left'
                }}
              >
                <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>{seller.magazaAdi}</Typography>
                <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600 }}>
                  {seller.sehir} / {seller.ilce} · {seller.magazaTuruEtiket}
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to="/"
                variant="contained"
                sx={{
                  borderRadius: '18px',
                  px: 4,
                  py: 1.4,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #B0CDE6 0%, #9BB8D4 100%)',
                  color: '#2E3B55',
                  boxShadow: '0 12px 28px rgba(176,205,230,0.45)',
                  '&:hover': { background: '#946D6D', color: '#fff' }
                }}
              >
                Anasayfaya dön
              </Button>
            </Box>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', pt: { xs: 11, md: 13 }, pb: { xs: 8, md: 10 } }}>
      <Seo
        title="Satıcı Ol - El Emeği Ürünlerini Nik Bag'de Sat"
        description="El yapımı ürünlerini Nik Bag vitrininde satışa çıkar. Komisyon şeffaf, başvuru ücretsiz; mağazanı dakikalar içinde aç, siparişlerini panelden yönet."
        path="/satici-ol"
        keywords={['el yapımı ürün satmak', 'online satıcı ol', 'butik satıcı başvurusu', 'Nik Bag satıcı']}
        jsonLd={breadcrumbSchema([
          { name: 'Ana Sayfa', path: '/' },
          { name: 'Satıcı Ol', path: '/satici-ol' }
        ])}
      />
      <PageBackdrop />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '0.92fr 1.18fr' },
            gap: { xs: 3, md: 4.5 },
            alignItems: 'start'
          }}
        >
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <Box
              sx={{
                ...glassPanel,
                position: { lg: 'sticky' },
                top: { lg: 110 },
                overflow: 'hidden',
                p: { xs: 3.2, md: 4.5 },
                minHeight: { lg: 620 },
                background: 'linear-gradient(165deg, rgba(255,255,255,0.55) 0%, rgba(176,205,230,0.38) 48%, rgba(162,144,183,0.28) 100%)'
              }}
            >
              <Chip
                icon={<AutoAwesomeOutlined sx={{ fontSize: '18px !important', color: '#946D6D !important' }} />}
                label="El emeği üreticiler için vitrin"
                sx={{
                  mb: 3,
                  fontWeight: 800,
                  bgcolor: 'rgba(255,255,255,0.72)',
                  color: '#2E3B55',
                  border: '1px solid rgba(255,255,255,0.9)'
                }}
              />
              <Typography
                component="h1"
                fontWeight={800}
                sx={{
                  color: '#2E3B55',
                  letterSpacing: '-1.6px',
                  lineHeight: 1.08,
                  mb: 2,
                  fontSize: { xs: '2.15rem', md: '3.05rem' }
                }}
              >
                Atölyeni
                <Box component="span" sx={{ display: 'block', background: 'linear-gradient(120deg, #946D6D 10%, #A290B7 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  vitrine taşı.
                </Box>
              </Typography>
              <Typography sx={{ color: '#6E5252', fontWeight: 600, lineHeight: 1.8, mb: 4, maxWidth: 420 }}>
                Koleksiyonunu Nik Bag’de sergile. Başvurun kaydedilir, onayın ardından mağazan yayına alınır.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.2, mb: 4, flexWrap: 'wrap' }}>
                {[
                  { n: '01', t: 'Başvur' },
                  { n: '02', t: 'Onaylan' },
                  { n: '03', t: 'Sat' }
                ].map((item) => (
                  <Box
                    key={item.n}
                    sx={{
                      px: 1.6,
                      py: 1.1,
                      borderRadius: '16px',
                      bgcolor: 'rgba(255,255,255,0.55)',
                      border: '1px solid rgba(255,255,255,0.8)',
                      minWidth: 86
                    }}
                  >
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#A290B7', letterSpacing: 1 }}>{item.n}</Typography>
                    <Typography sx={{ fontWeight: 800, color: '#2E3B55', fontSize: '0.92rem' }}>{item.t}</Typography>
                  </Box>
                ))}
              </Box>

              {[
                { icon: <VerifiedOutlined />, title: 'Güvenli hesap', text: 'Oturum ve başvuru bilgilerin korunur.' },
                { icon: <PaymentsOutlined />, title: 'IBAN ile ödeme', text: 'Satış bedeli kayıtlı hesabına geçer.' },
                { icon: <LocalShippingOutlined />, title: 'Kendi tempo', text: 'Üretim ve kargo takvimini sen kurarsın.' }
              ].map((item) => (
                <Box key={item.title} sx={{ display: 'flex', gap: 1.8, mb: 2.2 }}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: '16px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      color: '#946D6D',
                      boxShadow: '0 10px 22px rgba(46,59,85,0.08)'
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>{item.title}</Typography>
                    <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 500 }}>{item.text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }}>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ ...glassPanel, p: { xs: 2.6, sm: 4, md: 4.6 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 800, color: '#A290B7' }}>
                    Satıcı başvurusu
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color: '#2E3B55', letterSpacing: '-0.8px', fontSize: { xs: '1.55rem', sm: '1.9rem' } }}>
                    {STEPS[step].label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600, mt: 0.4 }}>
                    {loggedIn
                      ? 'Hesabın bağlı. Adımları tamamla, başvurun sisteme düşsün.'
                      : 'Üç kısa adım. Kayıt sonrası oturumun otomatik açılır.'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    width: 52,
                    height: 52,
                    borderRadius: '18px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #B0CDE6, #A290B7)',
                    color: '#2E3B55'
                  }}
                >
                  <StorefrontOutlined />
                </Box>
              </Box>

              <Stepper step={step} />

              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: '16px', bgcolor: 'rgba(255,235,238,0.9)' }}>
                  {error}
                </Alert>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.28 }}
                >
                  {step === 0 && (
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#2E3B55', mb: 1.4 }}>Hesap tipi</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.4, mb: 2.6 }}>
                        {[
                          { value: 'bireysel', title: 'Bireysel', text: 'Kendi atölyen, kendi imzan.', icon: <BadgeOutlined /> },
                          { value: 'kurumsal', title: 'Kurumsal', text: 'Şirket veya kooperatif.', icon: <BusinessOutlined /> }
                        ].map((option) => {
                          const selected = form.hesapTipi === option.value;
                          return (
                            <Box
                              key={option.value}
                              onClick={() => handleAccountType(option.value)}
                              sx={{
                                cursor: 'pointer',
                                p: 2,
                                borderRadius: '20px',
                                border: selected ? '1.5px solid #946D6D' : '1px solid rgba(148,109,109,0.18)',
                                background: selected
                                  ? 'linear-gradient(180deg, rgba(176,205,230,0.55) 0%, rgba(255,255,255,0.75) 100%)'
                                  : 'rgba(255,255,255,0.45)',
                                boxShadow: selected ? '0 12px 28px rgba(148,109,109,0.16)' : 'none',
                                transition: 'all 0.25s ease'
                              }}
                            >
                              <Box sx={{ color: '#946D6D', mb: 0.8 }}>{option.icon}</Box>
                              <Typography fontWeight={800} sx={{ color: '#2E3B55' }}>{option.title}</Typography>
                              <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 500 }}>{option.text}</Typography>
                            </Box>
                          );
                        })}
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        {!loggedIn && (
                          <>
                            <TextField fullWidth required label="Ad Soyad" value={form.adSoyad} onChange={handleChange('adSoyad')} sx={fieldSx}
                              {...fieldProps('adSoyad')}
                              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineOutlined sx={{ color: '#946D6D' }} /></InputAdornment> }} />
                            <TextField fullWidth required type="email" label="E-posta" value={form.email} onChange={handleChange('email')} sx={fieldSx}
                              {...fieldProps('email')}
                              InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: '#946D6D' }} /></InputAdornment> }} />
                            <TextField fullWidth required type={showPassword ? 'text' : 'password'} label="Şifre" value={form.sifre} onChange={handleChange('sifre')} sx={fieldSx}
                              {...fieldProps('sifre', 'En az 6 karakter, bir harf ve bir rakam')}
                              InputProps={{
                                startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#946D6D' }} /></InputAdornment>,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" sx={{ color: '#946D6D' }}>
                                      {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                  </InputAdornment>
                                )
                              }} />
                          </>
                        )}
                        <TextField fullWidth required label="Telefon" value={form.telefon} onChange={handleChange('telefon')} placeholder="05xx xxx xx xx" sx={fieldSx}
                          {...fieldProps('telefon')}
                          InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined sx={{ color: '#946D6D' }} /></InputAdornment> }} />
                        {form.hesapTipi === 'bireysel' ? (
                          <TextField fullWidth required label="T.C. Kimlik No" value={form.tcKimlik} onChange={handleChange('tcKimlik')} inputProps={{ maxLength: 11, inputMode: 'numeric' }} sx={fieldSx}
                            {...fieldProps('tcKimlik')} />
                        ) : (
                          <TextField fullWidth required label="Vergi No" value={form.vergiNo} onChange={handleChange('vergiNo')} inputProps={{ maxLength: 10, inputMode: 'numeric' }} sx={fieldSx}
                            {...fieldProps('vergiNo', '10 haneli vergi kimlik numarası')} />
                        )}
                      </Box>
                    </Box>
                  )}

                  {step === 1 && (
                    <Box>
                      <TextField fullWidth required label="Mağaza adı" value={form.magazaAdi} onChange={handleChange('magazaAdi')} sx={{ ...fieldSx, mb: 2.4 }}
                        {...fieldProps('magazaAdi')}
                        inputProps={{ maxLength: 60 }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><StorefrontOutlined sx={{ color: '#946D6D' }} /></InputAdornment> }} />

                      <Typography sx={{ fontWeight: 800, color: errors.magazaTuru ? '#d32f2f' : '#2E3B55', mb: 1.2 }}>Üretim alanı</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: errors.magazaTuru ? 0.6 : 2.4 }}>
                        {MAGAZA_TURLERI.map((item) => {
                          const selected = form.magazaTuru === item.value;
                          return (
                            <Chip
                              key={item.value}
                              clickable
                              label={item.label}
                              onClick={() => {
                                setForm((prev) => ({ ...prev, magazaTuru: item.value }));
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.magazaTuru;
                                  return next;
                                });
                                if (error) setError('');
                              }}
                              sx={{
                                fontWeight: 800,
                                px: 0.6,
                                py: 2.1,
                                borderRadius: '14px',
                                bgcolor: selected ? '#946D6D' : 'rgba(255,255,255,0.7)',
                                color: selected ? '#fff' : '#2E3B55',
                                border: selected ? 'none' : errors.magazaTuru ? '1px solid #d32f2f' : '1px solid rgba(148,109,109,0.18)',
                                '&:hover': { bgcolor: selected ? '#7d5b5b' : 'rgba(176,205,230,0.55)' }
                              }}
                            />
                          );
                        })}
                      </Box>
                      {errors.magazaTuru && (
                        <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 700, display: 'block', mb: 2 }}>
                          {errors.magazaTuru}
                        </Typography>
                      )}

                      <TextField fullWidth multiline minRows={3.4} label="Atölye hikâyesi" value={form.aciklama} onChange={handleChange('aciklama')}
                        placeholder="Nasıl üretiyorsun, hangi malzemeleri kullanıyorsun?" sx={{ ...fieldSx, mb: 2 }}
                        {...fieldProps('aciklama', `${form.aciklama.length}/1000`)}
                        inputProps={{ maxLength: 1000 }} />

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField fullWidth label="Instagram" value={form.instagram} onChange={handleChange('instagram')} placeholder="@kullaniciadi" sx={fieldSx}
                          {...fieldProps('instagram')}
                          InputProps={{ startAdornment: <InputAdornment position="start"><Instagram sx={{ color: '#946D6D' }} /></InputAdornment> }} />
                        <TextField fullWidth label="Web sitesi" value={form.website} onChange={handleChange('website')} placeholder="https://" sx={fieldSx}
                          {...fieldProps('website')}
                          InputProps={{ startAdornment: <InputAdornment position="start"><LanguageOutlined sx={{ color: '#946D6D' }} /></InputAdornment> }} />
                      </Box>
                    </Box>
                  )}

                  {step === 2 && (
                    <Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                        <TextField fullWidth required label="Şehir" value={form.sehir} onChange={handleChange('sehir')} sx={fieldSx}
                          {...fieldProps('sehir')}
                          InputProps={{ startAdornment: <InputAdornment position="start"><PlaceOutlined sx={{ color: '#946D6D' }} /></InputAdornment> }} />
                        <TextField fullWidth required label="İlçe" value={form.ilce} onChange={handleChange('ilce')} sx={fieldSx}
                          {...fieldProps('ilce')} />
                      </Box>
                      <TextField fullWidth required multiline minRows={2.2} label="Açık adres" value={form.adres} onChange={handleChange('adres')} sx={{ ...fieldSx, mb: 2 }}
                        {...fieldProps('adres')} />
                      <TextField fullWidth required label="IBAN" value={form.iban} onChange={handleChange('iban')} placeholder="TR00 ACCT-000003 0000 00" sx={fieldSx}
                        {...fieldProps('iban', 'TR ile başlayan 26 karakter')}
                        InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalanceOutlined sx={{ color: '#946D6D' }} /></InputAdornment> }} />

                      <Box
                        sx={{
                          mt: 2.4,
                          p: 2,
                          borderRadius: '20px',
                          bgcolor: 'rgba(253,244,210,0.65)',
                          border: errors.sozlesmeOnay ? '1px solid #d32f2f' : '1px solid rgba(148,109,109,0.12)'
                        }}
                      >
                        <FormControlLabel
                          sx={{ alignItems: 'flex-start', mr: 0 }}
                          control={
                            <Checkbox
                              checked={form.sozlesmeOnay}
                              onChange={handleChange('sozlesmeOnay')}
                              sx={{ color: errors.sozlesmeOnay ? '#d32f2f' : '#A290B7', mt: -0.4, '&.Mui-checked': { color: '#946D6D' } }}
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600, pt: 0.7, lineHeight: 1.6 }}>
                              Satıcı sözleşmesini, ürün sorumluluğunu ve verdiğim bilgilerin doğruluğunu kabul ediyorum.
                            </Typography>
                          }
                        />
                        {errors.sozlesmeOnay && (
                          <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 700, pl: 4.5 }}>
                            {errors.sozlesmeOnay}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </motion.div>
              </AnimatePresence>

              <Box sx={{ display: 'flex', gap: 1.4, mt: 3.4, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                {step > 0 && (
                  <Button
                    type="button"
                    onClick={() => { setError(''); setStep((value) => value - 1); }}
                    startIcon={<ArrowBackRounded />}
                    sx={{
                      flex: { sm: '0 0 160px' },
                      py: 1.45,
                      borderRadius: '16px',
                      fontWeight: 800,
                      color: '#2E3B55',
                      bgcolor: 'rgba(253,244,210,0.8)',
                      '&:hover': { bgcolor: '#FDF4D2' }
                    }}
                  >
                    Geri
                  </Button>
                )}
                {step < 2 ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    endIcon={<ArrowForwardRounded />}
                    sx={{
                      flex: 1,
                      py: 1.55,
                      borderRadius: '16px',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: '#2E3B55',
                      background: 'linear-gradient(135deg, #B0CDE6 0%, #9BB8D4 100%)',
                      boxShadow: '0 12px 26px rgba(176,205,230,0.45)',
                      '&:hover': { background: '#946D6D', color: '#fff' }
                    }}
                  >
                    Devam et
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    endIcon={loading ? null : <ArrowForwardRounded />}
                    sx={{
                      flex: 1,
                      py: 1.55,
                      borderRadius: '16px',
                      fontWeight: 800,
                      fontSize: '1rem',
                      background: 'linear-gradient(135deg, #946D6D 0%, #A290B7 100%)',
                      color: '#fff',
                      boxShadow: '0 14px 28px rgba(148,109,109,0.32)',
                      '&:hover': { background: '#6E5252' },
                      '&.Mui-disabled': { background: 'rgba(148,109,109,0.28)', color: 'rgba(255,255,255,0.7)' }
                    }}
                  >
                    {loading ? 'Kaydediliyor...' : 'Başvuruyu gönder'}
                  </Button>
                )}
              </Box>

              {!loggedIn && (
                <Typography variant="body2" sx={{ mt: 2.2, textAlign: 'center', color: '#6E5252', fontWeight: 600 }}>
                  Zaten hesabın var mı?{' '}
                  <Box component={RouterLink} to="/auth" sx={{ color: '#946D6D', fontWeight: 800, textDecoration: 'none' }}>
                    Giriş yap
                  </Box>
                </Typography>
              )}
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}
