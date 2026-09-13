import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { trTR, enUS } from '@mui/material/locale';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import LocaleLayout from './i18n/LocaleLayout';
import { localeFromPath, withLocale } from './i18n/locale';

// Bileşen İçe Aktarımları
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import API from './api/api';
import './index.css';
import useSmoothScroll from './hooks/useSmoothScroll';
import { isSuperAdmin } from './utils/roles';
import { clearFavoriteCache, loadFavoriteIds } from './utils/favoritesStore';
import { clearSession, hasCachedSession, persistSession, readCachedUser } from './utils/session';

// Ağır sayfalar yalnızca ziyaret edildiğinde indirilir
const AuthPage = lazy(() => import('./pages/AuthPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ProfileDashboard = lazy(() => import('./components/ProfileDashboard'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const BecomeSellerPage = lazy(() => import('./pages/BecomeSellerPage'));
const AtelierPage = lazy(() => import('./pages/AtelierPage'));
const OrderResultPage = lazy(() => import('./pages/OrderResultPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const SellerPanel = lazy(() => import('./pages/SellerPanel'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SupportDock = lazy(() => import('./components/SupportDock'));

const themeOptions = {
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
};

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
  const { i18n } = useTranslation();
  const reduced = useReducedMotion();
  const locale = localeFromPath(location.pathname);
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const theme = useMemo(
    () => createTheme(themeOptions, i18n.language === 'en' ? enUS : trTR),
    [i18n.language]
  );

  useSmoothScroll(!isAdminRoute);

  // Oturum ve Yükleme Stateleri
  const [user, setUser] = useState(() => readCachedUser());

  useEffect(() => {
    if (!hasCachedSession()) {
      return undefined;
    }

    let cancelled = false;
    API.get('/auth/me')
      .then((response) => {
        if (cancelled) return;
        const nextUser = response.data.kullanici || response.data.user || null;
        setUser(nextUser);
        persistSession(nextUser);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        clearSession();
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (user) loadFavoriteIds(true);
    else clearFavoriteCache();
  }, [user]);

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
      clearSession();
      navigate(withLocale('/', locale));
    }
  };

  const handleLoginSuccess = (userData, options = {}) => {
    setUser(userData);
    persistSession(userData);
    if (options.redirect !== false) {
      navigate(withLocale('/', locale));
    }
  };

  const handleSetPage = (pageName) => {
    if (pageName === 'home') navigate(withLocale('/', locale));
    else if (pageName === 'admin') navigate('/admin');
    else navigate(withLocale(`/${pageName}`, locale));
  };

  const storefrontRoutes = () => (
    <>
      <Route
        index
        element={<HomePage onNavigateAuth={() => navigate(withLocale('/auth', locale))} user={user} />}
      />
      <Route path="auth" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="checkout" element={<CheckoutPage setPage={handleSetPage} user={user} />} />
      <Route path="product/:id" element={<ProductDetailPage user={user} />} />
      <Route path="profile" element={<ProfileDashboard />} />
      <Route path="products" element={<ProductsPage />} />
      <Route
        path="satici-ol"
        element={<BecomeSellerPage user={user} onLoginSuccess={handleLoginSuccess} />}
      />
      <Route path="atolye/:slug" element={<AtelierPage />} />
      <Route path="siparis-basarili" element={<OrderResultPage success />} />
      <Route path="odeme-basarisiz" element={<OrderResultPage success={false} />} />
      <Route path="gizlilik" element={<LegalPage />} />
      <Route path="kvkk" element={<LegalPage />} />
      <Route path="mesafeli-satis" element={<LegalPage />} />
      <Route path="on-bilgilendirme" element={<LegalPage />} />
      <Route path="iade" element={<LegalPage />} />
      <Route path="kargo" element={<LegalPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </>
  );

  const routes = useMemo(() => (
    <Routes location={location}>
      <Route
        path="admin"
        element={
          isSuperAdmin(user?.rol)
            ? <AdminPanel user={user} handleLogout={handleLogout} />
            : <SellerPanel user={user} handleLogout={handleLogout} />
        }
      />
      <Route path="en" element={<LocaleLayout />}>
        {storefrontRoutes()}
      </Route>
      <Route element={<LocaleLayout />}>
        {storefrontRoutes()}
      </Route>
    </Routes>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [location, user, locale]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'clip', backgroundColor: 'background.default' }}>

        {!isAdminRoute && (
          <Navbar
            setPage={handleSetPage}
            user={user}
            handleLogout={handleLogout}
          />
        )}

        {!isAdminRoute && (
          <Suspense fallback={null}>
            <SupportDock />
          </Suspense>
        )}

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
