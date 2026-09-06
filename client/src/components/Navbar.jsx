import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Button, Box, Badge, Container,
  InputBase, Paper, Menu, MenuItem, Avatar, IconButton,
  ClickAwayListener, CircularProgress, Typography, Divider
} from '@mui/material';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CloseRounded from '@mui/icons-material/CloseRounded';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import Logo from '../assets/logo.svg?react';
import { cartService } from '../api/cartServices';
import { productService } from '../api/productService';
import useDebounce from '../hooks/useDebounce';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=200&q=60';

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

function SearchResults({ results, loading, query, onSelect, onSeeAll }) {
  if (!query || query.trim().length < 2) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 1,
        overflow: 'hidden',
        borderRadius: '20px',
        border: '1px solid rgba(148,109,109,0.14)',
        background: 'rgba(255,255,255,0.97)',
        boxShadow: '0 22px 50px -18px rgba(46,59,85,0.35)'
      }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.2, py: 2 }}>
          <CircularProgress size={18} sx={{ color: '#946D6D' }} />
          <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600 }}>Aranıyor...</Typography>
        </Box>
      ) : results.length === 0 ? (
        <Box sx={{ px: 2.2, py: 2.2 }}>
          <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.92rem' }}>Sonuç yok</Typography>
          <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600 }}>“{query}” ile eşleşen ürün bulunamadı.</Typography>
        </Box>
      ) : (
        <Box>
          {results.map((product) => {
            const title = product.title || product.baslik || 'Ürün';
            const image = product.image || product.resimUrl || FALLBACK_IMAGE;
            const price = product.finalPrice ?? product.price ?? product.fiyat ?? 0;
            return (
              <Box
                key={product._id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(product)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.6,
                  py: 1.15,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(176,205,230,0.28)' }
                }}
              >
                <Box
                  component="img"
                  src={image}
                  alt={title}
                  onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                  sx={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover', flexShrink: 0, bgcolor: '#F8F5F0' }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.88rem' }}>{title}</Typography>
                  <Typography noWrap variant="caption" sx={{ color: '#6E5252', fontWeight: 700, textTransform: 'capitalize' }}>
                    {product.category || 'Atölye'}
                  </Typography>
                </Box>
                <Typography fontWeight={800} sx={{ color: '#946D6D', fontSize: '0.9rem', flexShrink: 0 }}>
                  ₺{Number(price).toLocaleString('tr-TR')}
                </Typography>
              </Box>
            );
          })}
          <Divider />
          <Button
            fullWidth
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSeeAll}
            endIcon={<ArrowForwardRounded />}
            sx={{ py: 1.2, fontWeight: 800, color: '#2E3B55', borderRadius: 0, '&:hover': { backgroundColor: 'rgba(253,244,210,0.9)' } }}
          >
            Tüm sonuçları gör
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default function Navbar({ setPage, user, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  const isHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(!isHome);
  const solid = !isHome || scrolled;

  const [cartCount, setCartCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    setScrolled(!isHome || window.scrollY > 16);
    const onScroll = () => setScrolled(!isHome || window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    if (location.pathname === '/products') setQuery(q);
  }, [location.pathname, location.search]);

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

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);

    productService.getFilteredProducts({ search: term, limit: 6, page: 1, sort: 'newest' })
      .then((response) => {
        if (cancelled) return;
        const list = response?.products || (Array.isArray(response) ? response : []);
        setResults(list.slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const go = (path) => {
    if (path === '/' || path === 'home') navigate('/');
    else if (path.startsWith('/')) navigate(path);
    else if (setPage) setPage(path);
    else navigate(`/${path}`);
  };

  const submitSearch = () => {
    const term = query.trim();
    setFocused(false);
    setMobileOpen(false);
    if (!term) {
      navigate('/products');
      return;
    }
    navigate(`/products?q=${encodeURIComponent(term)}`);
  };

  const handleSelectProduct = (product) => {
    setFocused(false);
    setMobileOpen(false);
    setQuery('');
    navigate(`/product/${product._id}`);
  };

  const showPanel = (focused || mobileOpen) && query.trim().length >= 2;

  const getUserName = () => {
    if (!user) return 'Hesabım';
    return user.adSoyad || user.name || user.email?.split('@')[0] || 'Hesabım';
  };

  const searchField = (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        px: 1.6,
        py: 0.55,
        borderRadius: '18px',
        backgroundColor: focused ? '#FFFFFF' : (solid ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.9)'),
        border: `1.5px solid ${focused ? '#946D6D' : 'transparent'}`,
        boxShadow: focused ? '0 0 0 4px rgba(176,205,230,0.4)' : '0 6px 18px rgba(46,59,85,0.08)',
        transition: 'all 0.25s ease'
      }}
    >
      <SearchIcon sx={{ color: '#946D6D', mr: 1, fontSize: 22 }} />
      <InputBase
        placeholder="Ürün, kategori veya renk ara"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submitSearch();
          }
          if (e.key === 'Escape') {
            setFocused(false);
            setMobileOpen(false);
          }
        }}
        sx={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: '#2E3B55', '& input::placeholder': { color: '#6E5252', opacity: 0.72 } }}
      />
      {query && (
        <IconButton size="small" onClick={() => setQuery('')} sx={{ color: '#946D6D' }}>
          <CloseRounded fontSize="small" />
        </IconButton>
      )}
    </Paper>
  );

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

          <ClickAwayListener onClickAway={() => setFocused(false)}>
            <Box ref={searchRef} sx={{ display: { xs: 'none', md: 'block' }, flex: 1, maxWidth: 460, position: 'relative' }}>
              {searchField}
              {showPanel && !mobileOpen && (
                <Box sx={{ position: 'absolute', left: 0, right: 0, zIndex: 20 }}>
                  <SearchResults
                    results={results}
                    loading={searching}
                    query={query}
                    onSelect={handleSelectProduct}
                    onSeeAll={submitSearch}
                  />
                </Box>
              )}
            </Box>
          </ClickAwayListener>

          <Box sx={{ display: 'flex', gap: { xs: 0.6, sm: 1 }, alignItems: 'center', flexShrink: 0 }}>
            <IconButton
              aria-label="Ara"
              onClick={() => { setMobileOpen((v) => !v); setFocused(true); }}
              sx={{ ...iconBtn(solid), display: { xs: 'inline-flex', md: 'none' } }}
            >
              {mobileOpen ? <CloseRounded /> : <SearchIcon />}
            </IconButton>

            <Button
              onClick={() => go(user?.rol === 'seller' ? 'satici-ol' : 'satici-ol')}
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
              {user?.rol === 'seller' ? 'Mağazam' : 'Satıcı Ol'}
            </Button>

            <IconButton aria-label="Sepet" onClick={() => go('checkout')} sx={iconBtn(solid)}>
              <Badge badgeContent={cartCount} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }}>
                <ShoppingBagOutlined />
              </Badge>
            </IconButton>

            {user ? (
              <>
                <Button
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  startIcon={<Avatar sx={{ width: 30, height: 30, bgcolor: '#946D6D', fontSize: '0.82rem', fontWeight: 800 }}>{getUserName()[0].toUpperCase()}</Avatar>}
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
                  PaperProps={{ sx: { mt: 1.4, borderRadius: '16px', minWidth: 200, boxShadow: '0 16px 40px rgba(46,59,85,0.16)', border: '1px solid rgba(148,109,109,0.12)' } }}
                >
                  <MenuItem onClick={() => { setAnchorEl(null); go('profile'); }} sx={{ fontWeight: 600, gap: 1 }}><AccountCircleOutlined sx={{ color: '#946D6D' }} /> Profilim</MenuItem>
                  <MenuItem onClick={() => { setAnchorEl(null); go('satici-ol'); }} sx={{ fontWeight: 600, gap: 1 }}>
                    <StorefrontOutlined sx={{ color: '#946D6D' }} /> {user?.rol === 'seller' ? 'Mağazam' : 'Satıcı Ol'}
                  </MenuItem>
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
            {searchField}
            {showPanel && (
              <SearchResults
                results={results}
                loading={searching}
                query={query}
                onSelect={handleSelectProduct}
                onSeeAll={submitSearch}
              />
            )}
          </Box>
        </ClickAwayListener>
      )}
    </AppBar>
  );
}
