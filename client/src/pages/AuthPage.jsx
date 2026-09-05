


import { useState } from 'react';
import { 
  Box, Container, Card, Typography, TextField, Button, Tabs, Tab, 
  InputAdornment, IconButton, Alert 
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import ChangeHistoryRounded from '@mui/icons-material/ChangeHistoryRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/api';

export default function AuthPage({ onLoginSuccess }) {
  const [tab, setTab] = useState(0); // 0: Giriş, 1: Kayıt
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       if (tab === 0) {
//         // GİRİŞ YAP İSTEĞİ
//         const res = await API.post('/auth/login', { email, sifre: password });
        
//         // Backend'den gelen veri yapısını esnek karşıla
//         const userData = res.data.user || res.data;
//         const token = res.data.token || res.data.accessToken;

//         localStorage.setItem('token', token);
//         localStorage.setItem('user', JSON.stringify(userData));

//         // Üst bileşene haber ver
//         if (onLoginSuccess) {
//           onLoginSuccess(userData);
//         }
//       } else {
//         // KAYIT OL İSTEĞİ
//         const res = await API.post('/auth/register', { adSoyad, email, sifre: password });

//         const userData = res.data.user || res.data;
//         const token = res.data.token || res.data.accessToken;

//         localStorage.setItem('token', token);
//         localStorage.setItem('user', JSON.stringify(userData));

//         if (onLoginSuccess) {
//           onLoginSuccess(userData);
//         }
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
//     } finally {
//       setLoading(false);
//     }
//   };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const endpoint = tab === 0 ? '/auth/login' : '/auth/register';
    const payload = tab === 0 ? { email, sifre: password } : { adSoyad, email, sifre: password };

    const res = await API.post(endpoint, payload);

    // Backend'den gelen kullanici verisini ilet
    const userData = res.data.kullanici || res.data.user;

    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }
  } catch (err) {
    setError(err.response?.data?.mesaj || err.response?.data?.message || 'Bir sorun oluştu. Lütfen tekrar deneyin.');
  } finally {
    setLoading(false);
  }
};
  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 100
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1920&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.85) blur(20px)',
          transform: 'scale(1.1)',
          zIndex: 0
        }}
      />
      <Box 
        sx={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(135deg, rgba(253, 244, 210, 0.8) 0%, rgba(162, 144, 183, 0.55) 100%)',
          zIndex: 1 
        }} 
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card 
            elevation={0}
            sx={{ 
              p: { xs: 4, sm: 6 },
              borderRadius: '36px',
              background: 'rgba(255, 255, 255, 0.75) !important',
              backdropFilter: 'blur(30px) saturate(180%)',
              border: '2px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 30px 70px -15px rgba(46, 59, 85, 0.28)'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #B0CDE6 0%, #A290B7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(162, 144, 183, 0.4)',
                  mb: 2
                }}
              >
                <ChangeHistoryRounded sx={{ color: '#2E3B55', fontSize: '38px' }} />
              </Box>
              <Typography variant="h3" fontWeight="800" sx={{ color: '#946D6D', letterSpacing: '-1.5px' }}>
                Nik Bag
              </Typography>
              <Typography variant="body1" sx={{ color: '#6E5252', fontWeight: 600, mt: 0.8 }}>
                {tab === 0 ? 'Hesabınıza giriş yapın' : 'Aramıza katılın & fırsatları yakalayın'}
              </Typography>
            </Box>

            <Tabs 
              value={tab} 
              onChange={(_, newValue) => { setTab(newValue); setError(''); }}
              variant="fullWidth"
              sx={{ 
                mb: 4, 
                minHeight: 52,
                backgroundColor: 'rgba(253, 244, 210, 0.75)', 
                borderRadius: '18px',
                p: 0.6,
                '& .MuiTabs-indicator': { backgroundColor: '#FFFFFF', height: '100%', borderRadius: '14px' }
              }}
            >
              <Tab label="Giriş Yap" sx={{ zIndex: 1, fontWeight: 800, color: tab === 0 ? '#946D6D !important' : '#2E3B55' }} />
              <Tab label="Kayıt Ol" sx={{ zIndex: 1, fontWeight: 800, color: tab === 1 ? '#946D6D !important' : '#2E3B55' }} />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, x: tab === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                  {tab === 1 && (
                    <TextField
                      fullWidth
                      label="Ad Soyad"
                      variant="outlined"
                      value={adSoyad}
                      onChange={(e) => setAdSoyad(e.target.value)}
                      required
                      sx={{ mb: 2.8 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineOutlined sx={{ color: '#946D6D', fontSize: '26px', mr: 1 }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.9)', py: 0.5 }
                      }}
                    />
                  )}

                  <TextField
                    fullWidth
                    label="E-Posta Adresi"
                    type="email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{ mb: 2.8 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined sx={{ color: '#946D6D', fontSize: '26px', mr: 1 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.9)', py: 0.5 }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Şifre"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    sx={{ mb: 4 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: '#946D6D', fontSize: '26px', mr: 1 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#946D6D' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.9)', py: 0.5 }
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    endIcon={<ArrowForwardRounded sx={{ fontSize: '26px !important' }} />}
                    sx={{
                      py: 1.8,
                      borderRadius: '18px',
                      backgroundColor: '#B0CDE6',
                      color: '#2E3B55',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      boxShadow: '0 10px 28px rgba(176, 205, 230, 0.55)',
                      '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF' }
                    }}
                  >
                    {loading ? 'İşleniyor...' : tab === 0 ? 'GİRİŞ YAP' : 'KAYIT OL & BAŞLA'}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </form>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}