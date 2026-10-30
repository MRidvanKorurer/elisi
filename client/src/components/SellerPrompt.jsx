import { useEffect, useState } from 'react';
import { Box, Button, Dialog, IconButton, Typography } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import { isSellerRole, isSuperAdmin } from '../utils/roles';
import { PATHS } from '../i18n/paths';

const HIDE_KEY = 'nikbag.sellerPrompt.never';
const SEEN_KEY = 'nikbag.sellerPrompt.at';
const INTERVAL_MS = 30 * 60 * 1000;
const FIRST_WAIT_MS = 20 * 1000;

const quietPath = (pathname = '') => {
  const clean = String(pathname).replace(/^\/en(?=\/|$)/, '') || '/';
  return clean === PATHS.becomeSeller
    || clean === PATHS.checkout
    || clean === PATHS.orderSuccess
    || clean === PATHS.paymentFailed;
};

const stored = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* gizli sekme */
  }
};

const neverHidden = () => stored(HIDE_KEY) === '1';

const seenAt = () => {
  const value = Number(stored(SEEN_KEY) || 0);
  return Number.isFinite(value) ? value : 0;
};

export default function SellerPrompt({ user }) {
  const { t } = useTranslation('common');
  const navigate = useLocaleNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const eligible = !isSellerRole(user?.rol) && !isSuperAdmin(user?.rol) && !quietPath(pathname) && !neverHidden();

  useEffect(() => {
    if (!eligible) {
      setOpen(false);
      return undefined;
    }
    const last = seenAt();
    const elapsed = last ? Date.now() - last : INTERVAL_MS;
    const wait = last ? Math.max(0, INTERVAL_MS - elapsed) : FIRST_WAIT_MS;
    const timer = window.setTimeout(() => {
      if (neverHidden()) return;
      write(SEEN_KEY, String(Date.now()));
      setOpen(true);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [eligible, open, pathname, user?.rol]);

  const close = () => setOpen(false);

  const never = () => {
    write(HIDE_KEY, '1');
    close();
  };

  const join = () => {
    close();
    navigate(PATHS.becomeSeller);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="xs"
      fullWidth
      aria-labelledby="seller-prompt-title"
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            bgcolor: '#FBF6EA',
            backgroundImage: 'none',
            px: { xs: 2.2, sm: 3 },
            pt: 1.2,
            pb: 2.6,
            border: '1px solid rgba(46,59,85,0.08)'
          }
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton aria-label={t('sellerPrompt.close')} onClick={close} sx={{ color: '#6E5252' }}>
          <CloseRounded />
        </IconButton>
      </Box>
      <Box sx={{ px: 0.6, textAlign: 'center' }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            mx: 'auto',
            mb: 1.6,
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#2E3B55',
            color: '#FDF4D2'
          }}
        >
          <StorefrontOutlined />
        </Box>
        <Typography id="seller-prompt-title" sx={{ color: '#2E3B55', fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.03em' }}>
          {t('sellerPrompt.title')}
        </Typography>
        <Typography sx={{ mt: 1.1, color: '#6E5252', fontWeight: 500, lineHeight: 1.65 }}>
          {t('sellerPrompt.text')}
        </Typography>
        <Button
          onClick={join}
          fullWidth
          sx={{
            mt: 2.4,
            py: 1.25,
            borderRadius: '14px',
            fontWeight: 800,
            color: '#FBF6EA',
            bgcolor: '#2E3B55',
            '&:hover': { bgcolor: '#946D6D' }
          }}
        >
          {t('sellerPrompt.join')}
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.6 }}>
          <Button onClick={close} sx={{ color: '#6E5252', fontWeight: 700 }}>
            {t('sellerPrompt.later')}
          </Button>
          <Button onClick={never} sx={{ color: '#946D6D', fontWeight: 700 }}>
            {t('sellerPrompt.never')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
