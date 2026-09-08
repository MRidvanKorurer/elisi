import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Button, Box, Badge, Container,
  Menu, MenuItem, Avatar, IconButton, ClickAwayListener
} from '@mui/material';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CloseRounded from '@mui/icons-material/CloseRounded';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import AdminPanelSettingsOutlined from '@mui/icons-material/AdminPanelSettingsOutlined';
import Logo from '../assets/logo.svg?react';
import { cartService } from '../api/cartServices';
import NavSearch from './NavSearch';
import { isSellerRole, isSuperAdmin } from '../utils/roles';

const iconBtn = (solid) => ({
  color: solid ? '#2E3B55' : '#FFFFFF',
  backgroundColor: solid ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.16)',
  border: solid ? '1px solid rgba(148,109,109,0.14)' : '1px solid rgba(255,255,255,0.18)',
  width: 42,
  height: 42,
  '&:hover': {
    backgroundColor: solid ? '#FFFFFF' : 'rgba(255,255,255,0.28)'
  }
});

export default function Navbar({ setPage, user, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(!isHome);
  const solid = !isHome || scrolled;

  const [cartCount, setCartCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setScrolled(!isHome || window.scrollY > 16);

    // Kaydırma olayı her karede bir kez işlenir, state yalnızca eşik değişince güncellenir
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const next = !isHome || window.scrollY > 16;
        setScrolled((prev) => (prev === next ? prev : next));
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const response = await cartService.getCart();
        if (response.success) {
          const totalQuantity = response.items.reduce((acc, item) => acc + item.quantity, 0);
          setCartCount(totalQuantity);
        }
      } catch {
        setCartCount(0);
      }
    };
    fetchCartData();
    window.addEventListener('cartUpdated', fetchCartData);
    return () => window.removeEventListener('cartUpdated', fetchCartData);
  }, [user]);

  const go = (path) => {
    if (path === '/' || path === 'home') navigate('/');
    else if (path.startsWith('/')) navigate(path);
    else if (setPage) setPage(path);
    else navigate(`/${path}`);
  };

  const getUserName = () => {
    if (!user) return 'Hesabım';
    return user.adSoyad || user.name || user.email?.split('@')[0] || 'Hesabım';
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: solid
          ? 'rgba(253, 244, 210, 0.88)'
          : 'linear-gradient(to bottom, rgba(20,24,32,0.55) 0%, rgba(20,24,32,0) 100%)',
        backdropFilter: solid ? 'blur(18px) saturate(160%)' : 'none',
        borderBottom: solid ? '1px solid rgba(148,109,109,0.12)' : '1px solid transparent',
        boxShadow: solid ? '0 10px 30px -22px rgba(46,59,85,0.45)' : 'none',
        transition: 'background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
        top: 0, left: 0, right: 0, zIndex: 1100
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 }, minHeight: { xs: '64px !important', md: '76px !important' }, gap: { xs: 1, md: 2 } }}>
          <Box
            onClick={() => go('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              py: 0.5,
              '& svg': {
                width: { xs: '104px', sm: '132px', md: '152px' },
                height: 'auto',
                maxHeight: { xs: '40px', md: '52px' },
                display: 'block'
              }
            }}
          >
            <Logo />
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'block' }, flex: 1, maxWidth: 520 }}>
            <NavSearch solid={solid} />
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: 0.6, sm: 1 }, alignItems: 'center', flexShrink: 0 }}>
            <IconButton
              aria-label="Ara"
              onClick={() => setMobileOpen((v) => !v)}
              sx={{ ...iconBtn(solid), display: { xs: 'inline-flex', md: 'none' } }}
            >
              {mobileOpen ? <CloseRounded /> : <SearchIcon />}
            </IconButton>

            {isSuperAdmin(user?.rol) ? (
              <Button
                onClick={() => go('admin')}
                startIcon={<AdminPanelSettingsOutlined />}
                sx={{
                  display: { xs: 'none', lg: 'inline-flex' },
                  color: solid ? '#2E3B55' : '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: '12px',
                  px: 1.6,
                  '&:hover': { backgroundColor: solid ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.14)' }
                }}
              >
                Admin
              </Button>
            ) : (
              <Button
                onClick={() => go(isSellerRole(user?.rol) ? 'admin' : 'satici-ol')}
                startIcon={<StorefrontOutlined />}
                sx={{
                  display: { xs: 'none', lg: 'inline-flex' },
                  color: solid ? '#2E3B55' : '#FFFFFF',
                  fontWeight: 800,
                  borderRadius: '12px',
                  px: 1.6,
                  '&:hover': { backgroundColor: solid ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.14)' }
                }}
              >
                {isSellerRole(user?.rol) ? 'Mağazam' : 'Satıcı Ol'}
              </Button>
            )}

            <IconButton aria-label="Sepet" onClick={() => go('checkout')} sx={iconBtn(solid)}>
              <Badge badgeContent={cartCount} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }}>
                <ShoppingBagOutlined />
              </Badge>
            </IconButton>

            {user ? (
              <>
                <Button
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  startIcon={<Avatar src={user.avatarUrl || undefined} sx={{ width: 30, height: 30, bgcolor: '#946D6D', fontSize: '0.82rem', fontWeight: 800 }}>{getUserName()[0].toUpperCase()}</Avatar>}
                  sx={{
                    color: solid ? '#2E3B55' : '#FFFFFF',
                    backgroundColor: solid ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.18)',
                    fontWeight: 800,
                    borderRadius: '14px',
                    minWidth: { xs: 42, sm: 'auto' },
                    px: { xs: 0.6, sm: 1.6 },
                    py: 0.55,
                    '&:hover': { backgroundColor: solid ? '#fff' : 'rgba(255,255,255,0.3)' }
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getUserName()}
                  </Box>
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={openMenu}
                  onClose={() => setAnchorEl(null)}
                  slotProps={{ paper: { sx: { mt: 1.4, borderRadius: '16px', minWidth: 200, boxShadow: '0 16px 40px rgba(46,59,85,0.16)', border: '1px solid rgba(148,109,109,0.12)' } } }}
                >
                  <MenuItem onClick={() => { setAnchorEl(null); go('profile'); }} sx={{ fontWeight: 600, gap: 1 }}><AccountCircleOutlined sx={{ color: '#946D6D' }} /> Profilim</MenuItem>
                  {isSuperAdmin(user?.rol) && (
                    <MenuItem onClick={() => { setAnchorEl(null); go('admin'); }} sx={{ fontWeight: 600, gap: 1 }}>
                      <AdminPanelSettingsOutlined sx={{ color: '#946D6D' }} /> Admin paneli
                    </MenuItem>
                  )}
                  {!isSuperAdmin(user?.rol) && (
                    <MenuItem
                      onClick={() => { setAnchorEl(null); go(isSellerRole(user?.rol) ? 'admin' : 'satici-ol'); }}
                      sx={{ fontWeight: 600, gap: 1 }}
                    >
                      <StorefrontOutlined sx={{ color: '#946D6D' }} /> {isSellerRole(user?.rol) ? 'Mağazam' : 'Satıcı Ol'}
                    </MenuItem>
                  )}
                  <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }} sx={{ fontWeight: 600, color: '#d32f2f', gap: 1 }}><LogoutOutlined fontSize="small" /> Çıkış Yap</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => go('auth')}
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    borderColor: solid ? 'rgba(46,59,85,0.22)' : 'rgba(255,255,255,0.55)',
                    color: solid ? '#2E3B55' : '#FFFFFF',
                    fontWeight: 800,
                    borderRadius: '12px',
                    px: 2,
                    '&:hover': { borderColor: solid ? '#2E3B55' : '#fff', backgroundColor: solid ? 'rgba(46,59,85,0.05)' : 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Giriş
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonOutlineOutlined sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                  onClick={() => go('auth')}
                  sx={{
                    backgroundColor: '#B0CDE6',
                    color: '#2E3B55',
                    fontWeight: 800,
                    borderRadius: '12px',
                    px: { xs: 1.4, sm: 2.2 },
                    boxShadow: '0 6px 16px rgba(176,205,230,0.4)',
                    '&:hover': { backgroundColor: '#946D6D', color: '#fff' }
                  }}
                >
                  Kayıt Ol
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>

      {mobileOpen && (
        <ClickAwayListener onClickAway={() => setMobileOpen(false)}>
          <Box sx={{ display: { md: 'none' }, px: 2, pb: 1.5, pt: 0.5 }}>
            <NavSearch solid={solid} variant="mobile" onNavigate={() => setMobileOpen(false)} />
          </Box>
        </ClickAwayListener>
      )}
    </AppBar>
  );
}
