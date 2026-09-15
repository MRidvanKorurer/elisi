import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  CircularProgress,
  Stack,
  Link as MuiLink
} from '@mui/material';
import SiteContainer from '../components/SiteContainer';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/api';
import { authService } from '../api/authService';
import { imgMood1 } from '../assets/media';
import { SITE_CLIPS } from '../utils/siteVideos';
import Logo from '../assets/logo.svg?react';
import Seo from '../components/Seo';
import { requestGoogleAccessToken } from '../utils/googleAuth';

const NAVY = '#2E3B55';
const ROSE = '#946D6D';
const CREAM = '#FDF4D2';
const MUTED = '#6E5252';
const SKY = '#B0CDE6';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: { xs: '14px', sm: '16px' },
    backgroundColor: 'rgba(255,255,255,0.92)',
    transition: 'box-shadow .2s ease, border-color .2s ease',
    '& fieldset': { borderColor: 'rgba(46,59,85,0.12)' },
    '&:hover fieldset': { borderColor: 'rgba(148,109,109,0.45)' },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      boxShadow: '0 0 0 4px rgba(176,205,230,0.35)'
    },
    '&.Mui-focused fieldset': { borderColor: `${SKY} !important`, borderWidth: '1.5px' }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600,
    color: MUTED
  },
  '& .MuiInputLabel-root.Mui-focused': { color: ROSE }
};

const GoogleMark = () => (
  <Box
    component="svg"
    viewBox="0 0 48 48"
    aria-hidden
    sx={{ width: 20, height: 20, flexShrink: 0 }}
  >
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.3 4 24 4 16.1 4 9.2 8.5 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.1 39.5 16 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.1 6.6l.1.1 6.2 5.2C37.3 41.3 44 36 44 24c0-1.3-.1-2.5-.4-3.5z" />
  </Box>
);

const SegmentedTabs = ({ value, onChange, labels }) => (
  <Box
    role="tablist"
    sx={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 0.5,
      p: 0.5,
      mb: { xs: 2.5, sm: 3 },
      borderRadius: '14px',
      backgroundColor: 'rgba(46,59,85,0.06)'
    }}
  >
    {labels.map((label, index) => {
      const active = value === index;
      return (
        <Box
          key={label}
          component="button"
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(index)}
          sx={{
            appearance: 'none',
            border: 0,
            cursor: 'pointer',
            py: { xs: 1.15, sm: 1.25 },
            px: 1.5,
            borderRadius: '11px',
            fontFamily: 'inherit',
            fontWeight: 800,
            fontSize: { xs: '0.9rem', sm: '0.95rem' },
            color: active ? ROSE : NAVY,
            backgroundColor: active ? '#fff' : 'transparent',
            boxShadow: active ? '0 6px 18px rgba(46,59,85,0.1)' : 'none',
            transition: 'background-color .2s ease, color .2s ease, box-shadow .2s ease',
            '&:hover': { color: ROSE }
          }}
        >
          {label}
        </Box>
      );
    })}
  </Box>
);

export default function AuthPage({ onLoginSuccess }) {
  const { t } = useTranslation('auth');
  const navigate = useLocaleNavigate();
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [welcomeCode, setWelcomeCode] = useState('');
  const [copied, setCopied] = useState(false);
  const googleBusyRef = useRef(false);
  const busy = loading || googleLoading;

  const finishAuth = (userData, { isNewUser = false } = {}) => {
    if (isNewUser && userData?.kampanyaKodu) {
      if (onLoginSuccess) onLoginSuccess(userData, { redirect: false });
      setWelcomeCode(userData.kampanyaKodu);
      return;
    }
    if (onLoginSuccess) onLoginSuccess(userData);
  };

  const handleGoogleClick = async () => {
    if (googleBusyRef.current) return;
    googleBusyRef.current = true;
    setError('');
    setGoogleLoading(true);
    try {
      const accessToken = await requestGoogleAccessToken();
      const data = await authService.google({ accessToken });
      const userData = data.kullanici || data.user;
      finishAuth(userData, { isNewUser: Boolean(data.isNewUser) });
    } catch (err) {
      if (err?.code === 'MISSING_CLIENT_ID') {
        setError(t('googleUnavailable'));
      } else {
        setError(err.response?.data?.mesaj || err.response?.data?.message || err.message || t('googleFailed'));
      }
    } finally {
      googleBusyRef.current = false;
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = tab === 0 ? '/auth/login' : '/auth/register';
      const payload = tab === 0 ? { email, sifre: password } : { adSoyad, email, sifre: password };
      const res = await API.post(endpoint, payload);
      const userData = res.data.kullanici || res.data.user;
      finishAuth(userData, { isNewUser: tab === 1 });
    } catch (err) {
      setError(err.response?.data?.mesaj || err.response?.data?.message || t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  const copyWelcome = async () => {
    try {
      await navigator.clipboard.writeText(welcomeCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const switchTab = (next) => {
    setTab(next);
    setError('');
    setShowPassword(false);
  };

  const perks = [
    { icon: <VerifiedUserOutlined sx={{ fontSize: 18 }} />, text: t('panelHint').split(' · ')[0] },
    { icon: <LocalShippingOutlined sx={{ fontSize: 18 }} />, text: t('panelHint').split(' · ')[1] },
    { icon: <AutoAwesomeOutlined sx={{ fontSize: 18 }} />, text: t('panelHint').split(' · ')[2] }
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'center',
        overflow: 'hidden',
        // Fixed navbar (64 / 76) + nefes payı — içerik barın altına girmesin
        pt: { xs: 11, sm: 12, md: 14 },
        pb: { xs: 3, sm: 4, md: 5 },
        px: { xs: 1.5, sm: 2, md: 3 },
        boxSizing: 'border-box'
      }}
    >
      <Seo title={t('seoTitle')} path="/giris" noindex />

      {/* Ambient backdrop */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: {
            xs: `linear-gradient(165deg, ${CREAM} 0%, #f7ebe0 42%, #e8dce8 100%)`,
            md: `radial-gradient(1200px 600px at 15% 20%, rgba(176,205,230,0.55), transparent 55%),
                 radial-gradient(900px 500px at 90% 80%, rgba(162,144,183,0.35), transparent 50%),
                 linear-gradient(160deg, ${CREAM} 0%, #f3e8d8 55%, #ebe0ea 100%)`
          }
        }}
      />
      <Box
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: 0.18,
          backgroundImage: `url(${imgMood1})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'saturate(0.85)',
          maskImage: 'linear-gradient(90deg, black 0%, transparent 58%)',
          WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 58%)'
        }}
      />

      <SiteContainer
        disableGutters
        sx={{ position: 'relative', zIndex: 1, width: '100%' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.05fr) minmax(0, 0.95fr)' },
              gap: 0,
              borderRadius: { xs: '22px', sm: '28px', md: '32px' },
              overflow: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(22px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.85)',
              boxShadow: '0 28px 80px -28px rgba(46,59,85,0.38)',
              minHeight: { md: 620 }
            }}
          >
            {/* Brand / visual column */}
            <Box
              sx={{
                position: 'relative',
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: { md: 4.5, lg: 5.5 },
                color: '#fff',
                minHeight: 620,
                overflow: 'hidden'
              }}
            >
              <Box
                component="video"
                src={SITE_CLIPS.clutch}
                poster={imgMood1}
                autoPlay
                muted
                loop
                playsInline
                aria-hidden
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(160deg, rgba(46,59,85,0.72) 0%, rgba(148,109,109,0.55) 55%, rgba(46,59,85,0.78) 100%)'
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                  onClick={() => navigate('/')}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    mb: 2.5,
                    px: 1.75,
                    py: 1.15,
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.92)',
                    border: '1px solid rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 12px 28px rgba(20,24,32,0.22)',
                    '& svg': {
                      width: { md: 148, lg: 168 },
                      height: 'auto',
                      display: 'block'
                    }
                  }}
                  aria-label="Nik Bag"
                >
                  <Logo />
                </Box>
                <Typography sx={{ maxWidth: 340, fontWeight: 500, opacity: 0.95, fontSize: '1.05rem', lineHeight: 1.5 }}>
                  {t('brandTagline')}
                </Typography>
              </Box>

              <Stack spacing={1.25} sx={{ position: 'relative', zIndex: 1 }}>
                {perks.map((perk) => (
                  <Box
                    key={perk.text}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      px: 1.5,
                      py: 1.1,
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(10px)',
                      fontWeight: 600,
                      fontSize: '0.92rem'
                    }}
                  >
                    {perk.icon}
                    {perk.text}
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Form column */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                p: { xs: 2.25, sm: 3.5, md: 4.5, lg: 5 },
                background: {
                  xs: 'transparent',
                  md: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(253,244,210,0.35) 100%)'
                }
              }}
            >
              <Box
                sx={{
                  mb: { xs: 2, sm: 2.5 },
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  onClick={() => navigate('/')}
                  sx={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    '& svg': {
                      width: { xs: 132, sm: 148 },
                      height: 'auto',
                      maxHeight: 44,
                      display: 'block'
                    }
                  }}
                  aria-label="Nik Bag"
                >
                  <Logo />
                </Box>
              </Box>

              <Button
                type="button"
                onClick={() => navigate('/')}
                startIcon={<ArrowBackRounded sx={{ fontSize: '18px !important' }} />}
                sx={{
                  alignSelf: 'flex-start',
                  mb: { xs: 2, sm: 2.5 },
                  px: 0.5,
                  minWidth: 0,
                  color: MUTED,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  '&:hover': { backgroundColor: 'transparent', color: ROSE }
                }}
              >
                {t('backHome')}
              </Button>

              <AnimatePresence mode="wait">
                {welcomeCode ? (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    <Box sx={{ textAlign: 'center', py: { xs: 1, sm: 2 } }}>
                      <Box
                        sx={{
                          width: 68,
                          height: 68,
                          borderRadius: '20px',
                          mx: 'auto',
                          mb: 2,
                          display: 'grid',
                          placeItems: 'center',
                          background: `linear-gradient(135deg, ${SKY} 0%, #A290B7 100%)`,
                          boxShadow: '0 14px 32px rgba(162,144,183,0.35)'
                        }}
                      >
                        <CardGiftcardOutlined sx={{ color: NAVY, fontSize: 34 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 800, color: ROSE, fontSize: { xs: '1.35rem', sm: '1.55rem' }, letterSpacing: '-0.03em', mb: 0.75 }}>
                        {t('welcomeTitle')}
                      </Typography>
                      <Typography sx={{ color: MUTED, fontWeight: 600, mb: 0.5, fontSize: '0.92rem' }}>
                        {t('welcomeLead')}
                      </Typography>
                      <Typography sx={{ color: MUTED, fontWeight: 500, mb: 2.75, fontSize: '0.9rem', lineHeight: 1.55, maxWidth: 360, mx: 'auto' }}>
                        {t('welcomeText')}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                          mb: 2.75,
                          px: 1.75,
                          py: 1.35,
                          borderRadius: '16px',
                          backgroundColor: 'rgba(253,244,210,0.95)',
                          border: '1px dashed rgba(148,109,109,0.35)'
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: NAVY,
                            letterSpacing: 1.6,
                            fontSize: { xs: '1.05rem', sm: '1.2rem' },
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
                          }}
                        >
                          {welcomeCode}
                        </Typography>
                        <Button
                          onClick={copyWelcome}
                          size="small"
                          startIcon={copied ? <CheckRounded /> : <ContentCopyRounded />}
                          sx={{
                            borderRadius: '12px',
                            fontWeight: 800,
                            color: copied ? '#2e7d32' : ROSE,
                            backgroundColor: 'rgba(255,255,255,0.75)',
                            px: 1.5,
                            '&:hover': { backgroundColor: '#fff' }
                          }}
                        >
                          {copied ? t('copied') : t('copyCode')}
                        </Button>
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => navigate('/')}
                        endIcon={<ArrowForwardRounded />}
                        sx={{
                          py: 1.55,
                          borderRadius: '16px',
                          backgroundColor: SKY,
                          color: NAVY,
                          fontWeight: 800,
                          fontSize: '1rem',
                          boxShadow: '0 12px 28px rgba(176,205,230,0.45)',
                          '&:hover': { backgroundColor: ROSE, color: '#fff' }
                        }}
                      >
                        {t('startShopping')}
                      </Button>
                    </Box>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                  >
                    <Box sx={{ mb: { xs: 2, sm: 2.5 } }}>
                      <Typography
                        component="h2"
                        sx={{
                          fontWeight: 800,
                          color: NAVY,
                          letterSpacing: '-0.035em',
                          fontSize: { xs: '1.55rem', sm: '1.85rem' },
                          lineHeight: 1.15,
                          mb: 0.6
                        }}
                      >
                        {tab === 0 ? t('loginLead') : t('registerLead')}
                      </Typography>
                      <Typography sx={{ color: MUTED, fontWeight: 500, fontSize: { xs: '0.9rem', sm: '0.95rem' }, lineHeight: 1.45 }}>
                        {tab === 0 ? t('loginSub') : t('registerSub')}
                      </Typography>
                    </Box>

                    <SegmentedTabs
                      value={tab}
                      onChange={switchTab}
                      labels={[t('loginTab'), t('registerTab')]}
                    />

                    {error && (
                      <Alert
                        severity="error"
                        onClose={() => setError('')}
                        sx={{
                          mb: 2.25,
                          borderRadius: '14px',
                          alignItems: 'center',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          backgroundColor: 'rgba(211,47,47,0.08)',
                          border: '1px solid rgba(211,47,47,0.18)'
                        }}
                      >
                        {error}
                      </Alert>
                    )}

                    <Button
                      fullWidth
                      type="button"
                      variant="outlined"
                      disabled={busy}
                      onClick={handleGoogleClick}
                      startIcon={googleLoading ? <CircularProgress size={18} thickness={5} /> : <GoogleMark />}
                      sx={{
                        py: { xs: 1.35, sm: 1.45 },
                        mb: 2,
                        borderRadius: '15px',
                        borderColor: 'rgba(46,59,85,0.16)',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        color: NAVY,
                        fontWeight: 800,
                        fontSize: { xs: '0.92rem', sm: '0.96rem' },
                        gap: 0.5,
                        '&:hover': {
                          borderColor: ROSE,
                          backgroundColor: '#fff',
                          color: ROSE
                        }
                      }}
                    >
                      {googleLoading ? t('submitting') : tab === 0 ? t('googleLogin') : t('googleRegister')}
                    </Button>

                    <Divider
                      sx={{
                        mb: 2.25,
                        color: MUTED,
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        letterSpacing: '0.02em',
                        '&::before, &::after': { borderColor: 'rgba(46,59,85,0.12)' }
                      }}
                    >
                      {t('orDivider')}
                    </Divider>

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={tab}
                          initial={{ opacity: 0, x: tab === 0 ? -12 : 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: tab === 0 ? 12 : -12 }}
                          transition={{ duration: 0.22 }}
                        >
                          <Stack spacing={{ xs: 1.75, sm: 2 }}>
                            {tab === 1 && (
                              <TextField
                                fullWidth
                                label={t('name')}
                                autoComplete="name"
                                value={adSoyad}
                                onChange={(e) => setAdSoyad(e.target.value)}
                                required
                                disabled={busy}
                                sx={fieldSx}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <PersonOutlineOutlined sx={{ color: ROSE, fontSize: 22 }} />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            )}

                            <TextField
                              fullWidth
                              label={t('email')}
                              type="email"
                              autoComplete="email"
                              inputMode="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              disabled={busy}
                              sx={fieldSx}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <EmailOutlined sx={{ color: ROSE, fontSize: 22 }} />
                                  </InputAdornment>
                                )
                              }}
                            />

                            <TextField
                              fullWidth
                              label={t('password')}
                              type={showPassword ? 'text' : 'password'}
                              autoComplete={tab === 0 ? 'current-password' : 'new-password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              disabled={busy}
                              sx={fieldSx}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LockOutlined sx={{ color: ROSE, fontSize: 22 }} />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() => setShowPassword((v) => !v)}
                                      edge="end"
                                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                                      sx={{ color: ROSE }}
                                      disabled={busy}
                                    >
                                      {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                  </InputAdornment>
                                )
                              }}
                            />

                            <Button
                              type="submit"
                              fullWidth
                              variant="contained"
                              disabled={busy}
                              endIcon={
                                loading
                                  ? <CircularProgress size={18} thickness={5} sx={{ color: 'inherit' }} />
                                  : <ArrowForwardRounded sx={{ fontSize: '22px !important' }} />
                              }
                              sx={{
                                mt: 0.5,
                                py: { xs: 1.45, sm: 1.6 },
                                borderRadius: '15px',
                                backgroundColor: SKY,
                                color: NAVY,
                                fontWeight: 800,
                                fontSize: { xs: '0.98rem', sm: '1.02rem' },
                                boxShadow: '0 12px 28px rgba(176,205,230,0.45)',
                                '&:hover': { backgroundColor: ROSE, color: '#fff' },
                                '&.Mui-disabled': {
                                  backgroundColor: 'rgba(176,205,230,0.55)',
                                  color: 'rgba(46,59,85,0.55)'
                                }
                              }}
                            >
                              {loading ? t('submitting') : tab === 0 ? t('loginSubmit') : t('registerSubmit')}
                            </Button>
                          </Stack>
                        </motion.div>
                      </AnimatePresence>
                    </Box>

                    <Typography
                      sx={{
                        mt: { xs: 2.5, sm: 3 },
                        textAlign: 'center',
                        color: MUTED,
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      {tab === 0 ? t('switchToRegister') : t('switchToLogin')}{' '}
                      <MuiLink
                        component="button"
                        type="button"
                        underline="hover"
                        onClick={() => switchTab(tab === 0 ? 1 : 0)}
                        sx={{
                          color: ROSE,
                          fontWeight: 800,
                          fontSize: 'inherit',
                          verticalAlign: 'baseline',
                          cursor: 'pointer'
                        }}
                      >
                        {tab === 0 ? t('switchToRegisterCta') : t('switchToLoginCta')}
                      </MuiLink>
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Box>
        </motion.div>
      </SiteContainer>
    </Box>
  );
}
