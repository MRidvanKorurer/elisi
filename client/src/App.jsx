import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Bileşen İçe Aktarımları
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SupportDock from './components/SupportDock';
import API from './api/api';
import './index.css';
import useSmoothScroll from './hooks/useSmoothScroll';
import { isSuperAdmin } from './utils/roles';
import { clearFavoriteCache, loadFavoriteIds } from './utils/favoritesStore';

// Ağır sayfalar yalnızca ziyaret edildiğinde indirilir
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ProfileDashboard = lazy(() => import('./components/ProfileDashboard'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const BecomeSellerPage = lazy(() => import('./pages/BecomeSellerPage'));
const AtelierPage = lazy(() => import('./pages/AtelierPage'));
const OrderResultPage = lazy(() => import('./pages/OrderResultPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const SellerPanel = lazy(() => import('./pages/SellerPanel'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const customTheme = createTheme({
  palette: {
    primary: { main: '#B0CDE6', contrastText: '#2E3B55' },
    secondary: { main: '#946D6D', contrastText: '#FFFFFF' },
    background: { default: '#FDF4D2', paper: '#FFFFFF' },
    text: { primary: '#2E3B55', secondary: '#6E5252' },
  },
  typography: { fontFamily: '"Plus Jakarta Sans", sans-serif', button: { textTransform: 'none' } },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        contained: {
          fontWeight: 800,
          boxShadow: 'none'
        },
        root: {
          transition: 'background-color .25s ease, color .25s ease, transform .25s cubic-bezier(.22,.61,.36,1)',
          '&:active': { transform: 'scale(0.97)' }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: { transition: 'transform .35s cubic-bezier(.22,.61,.36,1), box-shadow .35s ease' }
      }
    }
  }
});

const PageFade = ({ children, reduced }) => {
  if (reduced) return children;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const RouteFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress sx={{ color: '#946D6D' }} />
  </Box>
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useSmoothScroll(!isAdminRoute);

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

  useEffect(() => {
    if (loading) return;
    if (user) loadFavoriteIds(true);
    else clearFavoriteCache();
  }, [user, loading]);

  // Rota değişiminde sayfa başına dön
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

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

  const handleLoginSuccess = (userData, options = {}) => {
    setUser(userData);
    if (options.redirect !== false) {
      navigate('/');
    }
  };

  // UYUM SAĞLAYICI: Diğer componentlerdeki (Navbar, Footer vs.) setPage('home') komutlarını URL yönlendirmesine çevirir
  const handleSetPage = (pageName) => {
    if (pageName === 'home') navigate('/');
    else navigate(`/${pageName}`);
  };

  const routes = useMemo(() => (
    <Routes location={location} key={location.pathname}>
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
        element={<ProductDetailPage user={user} />}
      />

      <Route
        path="/profile"
        element={<ProfileDashboard />}
      />

      <Route path="/products" element={<ProductsPage />} />

      <Route
        path="/satici-ol"
        element={<BecomeSellerPage user={user} onLoginSuccess={handleLoginSuccess} />}
      />
      <Route path="/atolye/:slug" element={<AtelierPage />} />
      <Route
        path="/admin"
        element={
          isSuperAdmin(user?.rol)
            ? <AdminPanel user={user} handleLogout={handleLogout} />
            : <SellerPanel user={user} handleLogout={handleLogout} />
        }
      />
      <Route path="/siparis-basarili" element={<OrderResultPage success />} />
      <Route path="/odeme-basarisiz" element={<OrderResultPage success={false} />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [location, user]);

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
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'clip', backgroundColor: 'background.default' }}>

        {!isAdminRoute && (
          <Navbar
            setPage={handleSetPage}
            user={user}
            handleLogout={handleLogout}
          />
        )}

        {!isAdminRoute && <SupportDock />}

        <Box component="main" sx={{ flexGrow: 1, width: '100%', position: 'relative', zIndex: 0 }}>
          <Suspense fallback={<RouteFallback />}>
            <AnimatePresence mode="wait" initial={false}>
              <PageFade key={location.pathname} reduced={reduced}>
                {routes}
              </PageFade>
            </AnimatePresence>
          </Suspense>
        </Box>

        {/* DÜZELTİLEN KISIM: Eski setPage değişkeni yerine handleSetPage verildi */}
        {!isAdminRoute && <Footer setPage={handleSetPage} />}

      </Box>
    </ThemeProvider>
  );
}
