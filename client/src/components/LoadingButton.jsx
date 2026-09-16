import { Box, Button, CircularProgress } from '@mui/material';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

const tones = {
  navy: {
    variant: 'contained',
    sx: {
      backgroundColor: '#2E3B55',
      color: '#FFFFFF',
      boxShadow: '0 8px 20px rgba(46, 59, 85, 0.16)',
      '&:hover': { backgroundColor: '#946D6D' },
      '&.Mui-disabled': { backgroundColor: 'rgba(46,59,85,0.45)', color: '#FFFFFF' }
    }
  },
  outline: {
    variant: 'outlined',
    sx: {
      borderColor: 'rgba(148,109,109,0.35)',
      color: '#946D6D',
      backgroundColor: 'rgba(253, 244, 210, 0.55)',
      '&:hover': { borderColor: '#946D6D', backgroundColor: '#946D6D', color: '#FFFFFF' },
      '&.Mui-disabled': { borderColor: 'rgba(148,109,109,0.2)', color: 'rgba(148,109,109,0.55)' }
    }
  },
  soft: {
    variant: 'contained',
    sx: {
      backgroundColor: '#FFFFFF',
      color: '#2E3B55',
      border: '1px solid rgba(148,109,109,0.2)',
      boxShadow: 'none',
      '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF' },
      '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.7)', color: 'rgba(46,59,85,0.4)' }
    }
  }
};

/**
 * Async / "daha fazla" aksiyonları için ortak yükleme butonu.
 * loading iken disabled + spinner + i18n metin.
 */
const LoadingButton = forwardRef(function LoadingButton(
  {
    loading = false,
    loadingLabel,
    tone = 'outline',
    endIcon,
    children,
    disabled,
    sx,
    ...props
  },
  ref
) {
  const { t } = useTranslation('common');
  const preset = tones[tone] || tones.outline;
  const busy = Boolean(loading);

  return (
    <Button
      ref={ref}
      variant={preset.variant}
      disabled={disabled || busy}
      endIcon={busy ? <CircularProgress size={16} color="inherit" thickness={5} /> : endIcon}
      sx={{
        borderRadius: '999px',
        px: { xs: 2.5, sm: 4 },
        py: 1.25,
        fontWeight: 800,
        textTransform: 'none',
        transition: 'background-color .2s ease, color .2s ease, border-color .2s ease, transform .15s ease',
        '&:active': { transform: busy ? 'none' : 'scale(0.98)' },
        ...preset.sx,
        ...sx
      }}
      {...props}
    >
      {busy ? (loadingLabel || t('actions.loading')) : children}
    </Button>
  );
});

export default LoadingButton;

export function PageSpinner({ minHeight = '40vh', size = 36 }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-busy="true"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight,
        width: '100%',
        py: 4
      }}
    >
      <CircularProgress size={size} thickness={4} sx={{ color: '#946D6D' }} />
    </Box>
  );
}

export function ProductGridSkeleton({ count = 4, height = 248 }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: { xs: 2, md: 3 }
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              height,
              borderRadius: '22px',
              bgcolor: 'rgba(148,109,109,0.1)',
              animation: 'softPulse 1.6s ease infinite'
            }}
          />
          <Box sx={{ mt: 1.5, height: 14, width: '70%', borderRadius: '8px', bgcolor: 'rgba(148,109,109,0.12)', animation: 'softPulse 1.6s ease infinite' }} />
          <Box sx={{ mt: 1, height: 12, width: '40%', borderRadius: '8px', bgcolor: 'rgba(148,109,109,0.1)', animation: 'softPulse 1.6s ease infinite' }} />
        </Box>
      ))}
    </Box>
  );
}

export function SectionSpinner({ label }) {
  const { t } = useTranslation('common');
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 5 }}>
      <CircularProgress size={28} thickness={4} sx={{ color: '#946D6D' }} />
      <Box component="span" sx={{ color: '#6E5252', fontWeight: 700, fontSize: '0.88rem' }}>
        {label || t('actions.loading')}
      </Box>
    </Box>
  );
}
