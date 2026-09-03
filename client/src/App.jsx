import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; // YÖNLENDİRME İÇİN EKLENDİ
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';

// Bileşen İçe Aktarımları
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import CheckoutPage from './pages/CheckoutPage';
import ProductDetailPage from './pages/ProductDetailPage'; // DETAY SAYFASI EKLENDİ
import WhatsAppWidget from './components/WhatsAppWidget';
import API from './api/api';
import './index.css';

const customTheme = createTheme({
  palette: {
    primary: { main: '#B0CDE6', contrastText: '#2E3B55' },
    secondary: { main: '#946D6D', contrastText: '#FFFFFF' },
    background: { default: '#FDF4D2', paper: '#FFFFFF' },
    text: { primary: '#2E3B55', secondary: '#6E5252' },
  },
  typography: { fontFamily: '"Plus Jakarta Sans", sans-serif', button: { textTransform: 'none' } },
  shape: { borderRadius: 16 },
});

export default function App() {
  const navigate = useNavigate(); // Yönlendirme kancası

  // Oturum ve Yükleme Stateleri
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // SAYFA YÜKLENDİĞİNDE DOĞRUDAN BACKEND'E /ME İSTEĞİ AT
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await API.get('/auth/me');
        setUser(response.data.kullanici || response.data.user || null);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  // Güvenli Çıkış (Backend Çerezini Temizler)
  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Çıkış hatası:', error);
    } finally {
      setUser(null);
      navigate('/'); // Çıkış yapınca Anasayfaya gönder
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    navigate('/'); // Giriş yapınca Anasayfaya gönder
  };

  // UYUM SAĞLAYICI: Diğer componentlerdeki (Navbar, Footer vs.) setPage('home') komutlarını URL yönlendirmesine çevirir
  const handleSetPage = (pageName) => {
    if (pageName === 'home') navigate('/');
    else navigate(`/${pageName}`);
  };

  // Oturum doğrulanırken kısa yüklenme ekranı
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#FDF4D2' }}>
        <CircularProgress sx={{ color: '#946D6D' }} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden', backgroundColor: 'background.default' }}>

        {/* Navbar'a adaptör fonksiyonumuzu veriyoruz */}
        <Navbar
          setPage={handleSetPage}
          user={user}
          handleLogout={handleLogout}
        />

        <WhatsAppWidget />

        <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
          {/* YENİ URL TABANLI YÖNLENDİRME SİSTEMİ (REACT ROUTER) */}
          <Routes>
            <Route
              path="/"
              element={<HomePage onNavigateAuth={() => navigate('/auth')} user={user} />}
            />

            <Route
              path="/auth"
              element={<AuthPage onLoginSuccess={handleLoginSuccess} />}
            />

            <Route
              path="/checkout"
              element={<CheckoutPage setPage={handleSetPage} user={user} />}
            />

            {/* Detay Sayfası Rotası */}
            <Route
              path="/product/:id"
              element={<ProductDetailPage />}
            />
          </Routes>
        </Box>

        {/* DÜZELTİLEN KISIM: Eski setPage değişkeni yerine handleSetPage verildi */}
        <Footer setPage={handleSetPage} />

      </Box>
    </ThemeProvider>
  );
}