import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import LocaleLink from '../i18n/LocaleLink';
import { categoryLabel } from '../utils/categories';
import {
  Box, Typography, IconButton,
  Link, TextField, Button, Divider, SvgIcon, Snackbar, Alert
} from '@mui/material';
import SiteContainer from './SiteContainer';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import Logo from '../assets/logo.svg?react';
import { CATEGORY_OPTIONS } from '../utils/categories';
import { getSitePublic, subscribeNewsletter } from '../api/siteService';
import LegalTextDialog from './LegalTextDialog';

const TikTokIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 2.31-4.64V9.4a6.34 6.34 0 1 0 6.34 6.34V8.7a8.18 8.18 0 0 0 4.65 1.44V6.7a4.84 4.84 0 0 1-2.2-.01z" />
  </SvgIcon>
);

const FOOTER_EMAIL = 'nikbagofficial@gmail.com';
const FOOTER_SOCIAL = {
  instagram: 'https://www.instagram.com/nikbagofficial',
  facebook: 'https://www.facebook.com/share/19fe1eojtZ/',
  tiktok: 'https://www.tiktok.com/@nikbagstore'
};

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [site, setSite] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [legalDoc, setLegalDoc] = useState('');
  const socialLinks = FOOTER_SOCIAL;

  useEffect(() => {
    getSitePublic().then(setSite);
  }, []);

  const handleSubscribe = async (event) => {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setToast({ open: true, message: t('footer.invalidEmail'), severity: 'warning' });
      return;
    }
    setEmail('');
    try {
      await subscribeNewsletter(value);
      setToast({ open: true, message: t('footer.subscribed'), severity: 'success' });
    } catch {
      setToast({ open: true, message: t('footer.invalidEmail'), severity: 'warning' });
    }
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
        pb: { xs: 'calc(88px + env(safe-area-inset-bottom, 0px))', md: 4.5 },
        background: 'linear-gradient(180deg, #FDF4D2 0%, #F3E4C4 55%, #E8D4C8 100%)',
        borderTop: '1px solid rgba(148, 109, 109, 0.18)'
      }}
    >
      <SiteContainer sx={{ px: { xs: 2, sm: 3 } }}>
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
              component={LocaleLink}
              to="/"
              aria-label={t('footer.homeAria')}
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
              {t('footer.blurb')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.2 }}>
              <IconButton href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" sx={socialIconSx}>
                <InstagramIcon />
              </IconButton>
              <IconButton href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" sx={socialIconSx}>
                <FacebookIcon />
              </IconButton>
              <IconButton href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label={t('footer.tiktok')} sx={socialIconSx}>
                <TikTokIcon />
              </IconButton>
            </Box>
          </Box>

          <Box>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              {t('footer.explore')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link component={LocaleLink} to="/" sx={footerLinkSx}>{t('footer.home')}</Link>
              <Link component={LocaleLink} to="/urunler" sx={footerLinkSx}>{t('footer.allProducts')}</Link>
              <Link component={LocaleLink} to="/atolyeler" sx={footerLinkSx}>{t('footer.ateliers')}</Link>
              <Link component={LocaleLink} to="/satici-ol" sx={footerLinkSx}>{t('footer.becomeSeller')}</Link>
              <Link component={LocaleLink} to="/giris" rel="nofollow" sx={footerLinkSx}>{t('footer.loginRegister')}</Link>
            </Box>
          </Box>

          <Box>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              {t('footer.help')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link href={`mailto:${FOOTER_EMAIL}`} sx={footerLinkSx}>{t('footer.contact')}</Link>
              <Box component="button" type="button" onClick={() => setLegalDoc('kargo')} sx={legalBtnSx}>{t('footer.shipping')}</Box>
              <Box component="button" type="button" onClick={() => setLegalDoc('iade')} sx={legalBtnSx}>{t('footer.returns')}</Box>
              <Box component="button" type="button" onClick={() => setLegalDoc('gizlilik')} sx={legalBtnSx}>{t('footer.privacy')}</Box>
              <Box component="button" type="button" onClick={() => setLegalDoc('kvkk')} sx={legalBtnSx}>KVKK</Box>
              <Box component="button" type="button" onClick={() => setLegalDoc('mesafeli-satis')} sx={legalBtnSx}>Mesafeli satış</Box>
              <Box component="button" type="button" onClick={() => setLegalDoc('satici-sozlesmesi')} sx={legalBtnSx}>Satıcı sözleşmesi</Box>
            </Box>
          </Box>

          <Box>
            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 2, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
              {t('footer.reachUs')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 3 }}>
              <Link href={`mailto:${FOOTER_EMAIL}`} variant="body2" sx={{ ...contactRowSx, textDecoration: 'none' }}>
                <EmailOutlinedIcon fontSize="small" sx={{ color: '#946D6D' }} />
                {FOOTER_EMAIL}
              </Link>
              {site?.phone ? (
              <Typography variant="body2" sx={contactRowSx}>
                <PhoneOutlinedIcon fontSize="small" sx={{ color: '#946D6D' }} />
                {site.phone}
              </Typography>
              ) : null}
            </Box>

            <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 1.4, fontSize: '0.95rem' }}>
              {t('footer.newsletter')}
            </Typography>
            <Box component="form" onSubmit={handleSubscribe} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
              <TextField
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer.emailPlaceholder')}
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
                aria-label={t('footer.subscribeAria')}
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
            {t('footer.categories')}
          </Typography>
          <Box
            component="nav"
            aria-label={t('footer.categories')}
            sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.8, md: 1 } }}
          >
            {CATEGORY_OPTIONS.map((item) => (
              <Link
                key={item.value}
                component={LocaleLink}
                to={`/urunler?category=${encodeURIComponent(item.value)}`}
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
                {categoryLabel(item.value, t)}
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
            {t('footer.rights', { year: new Date().getFullYear() })}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            {/* Iyzico / kart rozetleri kapalı
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
            */}
            {['Havale / EFT', 'WhatsApp'].map((label) => (
              <Box
                key={label}
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  border: '1px solid rgba(148, 109, 109, 0.22)',
                  borderRadius: '8px',
                  px: 1.15,
                  py: 0.45,
                  color: '#946D6D',
                  backgroundColor: '#FFFFFF',
                  letterSpacing: '0.4px'
                }}
              >
                {label}
              </Box>
            ))}
          </Box>
        </Box>
      </SiteContainer>

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
      <LegalTextDialog
        open={Boolean(legalDoc)}
        slug={legalDoc}
        slugs={['kargo', 'iade', 'gizlilik', 'kvkk', 'mesafeli-satis', 'satici-sozlesmesi']}
        onClose={() => setLegalDoc('')}
      />
    </Box>
  );
}

const legalBtnSx = {
  color: '#6E5252',
  display: 'inline-block',
  mb: 1.15,
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
  textAlign: 'left',
  border: 0,
  background: 'none',
  p: 0,
  fontFamily: 'inherit',
  transition: 'color 0.2s ease, transform 0.2s ease',
  '&:hover': { color: '#946D6D', transform: 'translateX(3px)' }
};

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
