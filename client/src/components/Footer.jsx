import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, IconButton,
  Link, TextField, Button, Divider, SvgIcon, Snackbar, Alert
} from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import Logo from '../assets/logo.svg?react';
import { CATEGORY_OPTIONS } from '../utils/categories';

const EtsyIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M9.195 5.517c-1.353 0-1.895.385-1.895 1.55v1.275h3.692c1.233 0 1.638-.346 1.638-1.393h.648v4.062h-.648c0-1.045-.405-1.391-1.638-1.391H7.3v3.947c0 1.348.653 1.849 2.158 1.849 1.455 0 2.226-.412 2.766-1.579h.73l-1.066 3.013H4.498v-.541c1.226-.11 1.442-.486 1.442-1.603V8.127c0-1.117-.216-1.493-1.442-1.603v-.542h5.58c1.378 0 2.148.243 2.593 1.12h-.648c-.283-.756-.917-1.585-2.828-1.585zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18.5c-4.694 0-8.5-3.806-8.5-8.5S7.306 3.5 12 3.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5z" />
  </SvgIcon>
);

const socialLinks = {
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  etsy: 'https://etsy.com/'
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const handleSubscribe = (event) => {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setToast({ open: true, message: 'Geçerli bir e-posta girin.', severity: 'warning' });
      return;
    }
    setEmail('');
    setToast({ open: true, message: 'Bültene kaydınız alındı.', severity: 'success' });
  };

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate',
        overflow: 'hidden',
        mt: { xs: 6, md: 10 },
        pt: { xs: 5, md: 7 },
        pb: { xs: 4, md: 4.5 },
        background: 'linear-gradient(180deg, #FDF4D2 0%, #F3E4C4 55%, #E8D4C8 100%)',
        borderTop: '1px solid rgba(148, 109, 109, 0.18)'
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1.4fr 0.85fr 0.95fr 1.15fr' },
            gap: { xs: 4, md: 5 },
            alignItems: 'start'
          }}
        >
          <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1', lg: 'auto' } }}>
            <Box
              component={RouterLink}
              to="/"
              aria-label="NikBag anasayfa"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
                mb: 2,
                '& svg': {
                  width: { xs: '132px', md: '152px' },
                  height: 'auto',
                  maxHeight: { xs: '44px', md: '52px' },
                  display: 'block'
                }
              }}
            >
              <Logo />
            </Box>

            <Typography variant="body2" sx={{ color: '#6E5252', mb: 2.5, lineHeight: 1.75, maxWidth: 360, fontWeight: 600 }}>
              Evinize ve ruhunuza dokunan, tamamen el yapımı tasarım ürünleri. Geleneksel yöntemleri modern bir dille yeniden yorumluyoruz.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.2 }}>
              <IconButton href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" sx={socialIconSx}>
                <InstagramIcon />
              </IconButton>
              <IconButton href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" sx={socialIconSx}>
                <FacebookIcon />
              </IconButton>
              <IconButton href={socialLinks.etsy} target="_blank" rel="noopener noreferrer" aria-label="Etsy Mağazamız" sx={socialIconSx}>
                <EtsyIcon />
              </IconButton>
            </Box>
          </Box>

          <Box>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              Keşfet
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link component={RouterLink} to="/" sx={footerLinkSx}>Anasayfa</Link>
              <Link component={RouterLink} to="/products" sx={footerLinkSx}>Tüm Ürünler</Link>
              <Link component={RouterLink} to="/satici-ol" sx={footerLinkSx}>Satıcı Ol</Link>
              <Link component={RouterLink} to="/auth" rel="nofollow" sx={footerLinkSx}>Giriş / Kayıt</Link>
            </Box>
          </Box>

          <Box>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              Yardım
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link href="mailto:info@nikbag.com" sx={footerLinkSx}>İletişim</Link>
              <Typography sx={{ ...footerLinkSx, cursor: 'default', '&:hover': { color: '#6E5252', transform: 'none' } }}>Kargo ve teslimat</Typography>
              <Typography sx={{ ...footerLinkSx, cursor: 'default', '&:hover': { color: '#6E5252', transform: 'none' } }}>İade ve değişim</Typography>
              <Typography sx={{ ...footerLinkSx, cursor: 'default', '&:hover': { color: '#6E5252', transform: 'none' } }}>Gizlilik</Typography>
            </Box>
          </Box>

          <Box>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              Bize ulaşın
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 3 }}>
              <Typography variant="body2" sx={contactRowSx}>
                <EmailOutlinedIcon fontSize="small" sx={{ color: '#946D6D' }} />
                info@nikbag.com
              </Typography>
              <Typography variant="body2" sx={contactRowSx}>
                <PhoneOutlinedIcon fontSize="small" sx={{ color: '#946D6D' }} />
                +90 555 123 45 67
              </Typography>
            </Box>

            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 1.4, fontSize: '0.95rem' }}>
              Bülten
            </Typography>
            <Box component="form" onSubmit={handleSubscribe} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                size="small"
                type="email"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    '& fieldset': { borderColor: 'rgba(148, 109, 109, 0.28)' },
                    '&:hover fieldset': { borderColor: '#946D6D' },
                    '&.Mui-focused fieldset': { borderColor: '#946D6D', borderWidth: '1.5px' }
                  },
                  '& input::placeholder': { fontSize: '0.85rem' }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                aria-label="Bültene abone ol"
                sx={{
                  backgroundColor: '#946D6D',
                  color: '#FFF',
                  minWidth: 50,
                  borderRadius: '14px',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#7c5a5a', boxShadow: 'none' }
                }}
              >
                <SendOutlinedIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: { xs: 4, md: 5 } }}>
          <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 1.6, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
            Kategoriler
          </Typography>
          <Box
            component="nav"
            aria-label="Kategoriler"
            sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.8, md: 1 } }}
          >
            {CATEGORY_OPTIONS.map((item) => (
              <Link
                key={item.value}
                component={RouterLink}
                to={`/products?category=${encodeURIComponent(item.value)}`}
                sx={{
                  color: '#6E5252',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  px: 1.15,
                  py: 0.55,
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255,255,255,0.62)',
                  border: '1px solid rgba(148, 109, 109, 0.16)',
                  transition: 'color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
                  '&:hover': {
                    color: '#946D6D',
                    borderColor: 'rgba(148, 109, 109, 0.36)',
                    backgroundColor: '#FFFFFF'
                  }
                }}
              >
                {item.label}
              </Link>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: { xs: 3.5, md: 4.5 }, borderColor: 'rgba(148, 109, 109, 0.18)' }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography variant="body2" sx={{ color: '#6E5252', fontWeight: 600, textAlign: { xs: 'center', md: 'left' } }}>
            © {new Date().getFullYear()} NikBag. Tüm hakları saklıdır.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            {['VISA', 'MasterCard', 'TROY', 'IYZICO'].map((label) => (
              <Box
                key={label}
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  border: '1px solid rgba(148, 109, 109, 0.22)',
                  borderRadius: '8px',
                  px: 1.15,
                  py: 0.45,
                  color: label === 'IYZICO' ? '#FFF' : '#946D6D',
                  backgroundColor: label === 'IYZICO' ? '#946D6D' : '#FFFFFF',
                  letterSpacing: '0.4px'
                }}
              >
                {label}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={2800}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ borderRadius: '12px', fontWeight: 700 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const footerLinkSx = {
  color: '#6E5252',
  display: 'inline-block',
  mb: 1.15,
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'color 0.2s ease, transform 0.2s ease',
  '&:hover': { color: '#946D6D', transform: 'translateX(3px)' }
};

const socialIconSx = {
  color: '#946D6D',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 4px 10px rgba(148, 109, 109, 0.12)',
  border: '1px solid rgba(148, 109, 109, 0.18)',
  '&:hover': {
    backgroundColor: '#946D6D',
    color: '#FFF'
  }
};

const contactRowSx = {
  color: '#6E5252',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  fontWeight: 600
};
