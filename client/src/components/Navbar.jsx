


import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Button, Box, Badge, Container,
  InputBase, Paper, Menu, MenuItem, Avatar
} from '@mui/material';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import Logo from '../assets/logo.svg?react';
import { cartService } from '../api/cartServices';

export default function Navbar({ setPage, user, handleLogout, searchQuery, setSearchQuery }) {
  const [isFocused, setIsFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // SEPET VERİSİNİ ÇEKME
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const response = await cartService.getCart();
        if (response.success) {
          const totalQuantity = response.items.reduce((acc, item) => acc + item.quantity, 0);
          setCartCount(totalQuantity);
        }
      } catch (error) {
        setCartCount(0);
      }
    };

    fetchCartData();
    window.addEventListener('cartUpdated', fetchCartData);

    return () => window.removeEventListener('cartUpdated', fetchCartData);
  }, [user]);

  const handleOpenProfileMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseProfileMenu = () => setAnchorEl(null);

  const getUserName = () => {
    if (!user) return 'Hesabım';
    return user.adSoyad || user.name || user.email?.split('@')[0] || 'Hesabım';
  };

  const getAvatarLetter = () => {
    const name = getUserName();
    return name ? name[0].toUpperCase() : 'U';
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        // ARKA PLAN RENGİ SAKLANDI, ÜZERİNE HAFİF KARARTMA EKLENDİ
        background: scrolled
          ? 'linear-gradient(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08)), rgba(253, 244, 210, 0.95)'
          : 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'all 0.4s ease', top: 0, left: 0, right: 0, zIndex: 1100
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 }, minHeight: '74px !important', gap: 2 }}>

          {/* LOGO */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              flexShrink: 0,
              padding: '4px 8px',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.03)'
              },
              '& svg': {
                width: '160px',
                height: 'auto',
                maxHeight: '60px',
                display: 'block',
                filter: 'none', // Orijinal renkleri korumak için filtreler sıfırlandı
                transition: 'transform 0.3s ease'
              },
              '&:hover svg': {
                transform: 'rotate(4deg)'
              }
            }}
            onClick={() => setPage && setPage('home')}
          >
            <Logo />
          </Box>

          {/* ARAMA KUTUSU */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex', alignItems: 'center', width: { xs: '100%', sm: 300, md: 380 }, px: 2, py: 0.6, borderRadius: '20px',
              backgroundColor: scrolled ? (isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)') : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)', border: `1.5px solid ${isFocused ? '#A290B7' : 'transparent'}`,
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)', transition: 'all 0.3s ease'
            }}
          >
            <SearchIcon sx={{ color: '#946D6D', mr: 1 }} />
            <InputBase placeholder="Ürün, kategori veya renk ara..." value={searchQuery || ''} onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} sx={{ flex: 1, fontSize: '0.88rem', fontWeight: 600, color: '#2E3B55', '& input::placeholder': { color: '#6E5252', opacity: 0.7 } }} />
            {searchQuery && <ClearIcon onClick={() => setSearchQuery && setSearchQuery('')} sx={{ color: '#946D6D', fontSize: '18px', cursor: 'pointer' }} />}
          </Paper>

          {/* SAĞ BUTONLAR */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0 }}>

            {/* SEPETİM BUTONU */}
            <Button
              onClick={() => setPage && setPage('checkout')}
              startIcon={
                <Badge badgeContent={cartCount} color="error">
                  <ShoppingBagOutlined sx={{ color: scrolled ? '#2E3B55' : '#FFFFFF' }} />
                </Badge>
              }
              sx={{ color: scrolled ? '#2E3B55' : '#FFFFFF', fontWeight: 700, borderRadius: '12px', px: 1.5, mr: 1 }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sepetim</Box>
            </Button>

            {user ? (
              <>
                <Button
                  onClick={handleOpenProfileMenu}
                  startIcon={<Avatar sx={{ width: 28, height: 28, bgcolor: '#946D6D', fontSize: '0.85rem', fontWeight: 800 }}>{getAvatarLetter()}</Avatar>}
                  sx={{ backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(8px)', color: scrolled ? '#2E3B55' : '#FFFFFF', fontWeight: 800, borderRadius: '12px', px: 2, py: 0.8, '&:hover': { backgroundColor: scrolled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)' } }}
                >
                  {getUserName()}
                </Button>
                <Menu anchorEl={anchorEl} open={openMenu} onClose={handleCloseProfileMenu} PaperProps={{ sx: { mt: 1.5, borderRadius: '16px', minWidth: 180, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.05)' } }}>
                  <MenuItem onClick={() => { handleCloseProfileMenu(); setPage && setPage('profile'); }} sx={{ fontWeight: 600, gap: 1 }}><AccountCircleOutlined sx={{ color: '#946D6D' }} /> Profilim</MenuItem>
                  <MenuItem onClick={() => { handleCloseProfileMenu(); handleLogout(); }} sx={{ fontWeight: 600, color: '#d32f2f', gap: 1 }}><LogoutOutlined fontSize="small" /> Çıkış Yap</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button variant="outlined" onClick={() => setPage && setPage('auth')} sx={{ borderColor: scrolled ? 'rgba(46, 59, 85, 0.4)' : 'rgba(255, 255, 255, 0.6)', color: scrolled ? '#2E3B55' : '#FFFFFF', fontWeight: 700, borderRadius: '12px', px: { xs: 1.5, sm: 2.5 }, textTransform: 'none', display: { xs: 'none', sm: 'flex' }, '&:hover': { borderColor: scrolled ? '#2E3B55' : '#FFFFFF', backgroundColor: scrolled ? 'rgba(46, 59, 85, 0.05)' : 'rgba(255, 255, 255, 0.1)' } }}>
                  Giriş Yap
                </Button>
                <Button variant="contained" startIcon={<PersonOutlineOutlined />} onClick={() => setPage && setPage('auth')} sx={{ backgroundColor: '#B0CDE6', color: '#2E3B55', fontWeight: 800, borderRadius: '12px', px: { xs: 1.5, sm: 2.5 }, textTransform: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', '&:hover': { backgroundColor: '#9BBEDC' } }}>
                  Kayıt Ol
                </Button>
              </>
            )}
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}