import { Avatar, Box, Button, Chip, Drawer, IconButton, InputAdornment, InputBase, Tooltip, Typography } from '@mui/material';
import MenuRounded from '@mui/icons-material/MenuRounded';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import Logo from '../assets/logo.svg?react';
import { T } from '../utils/panel';
import Seo from './Seo';

const SIDEBAR = 262;

export function PanelCard({ children, sx = {} }) {
  return (
    <Box
      sx={{
        bgcolor: T.surface,
        border: `1px solid ${T.line}`,
        borderRadius: '22px',
        p: 2.4,
        boxShadow: '0 18px 40px rgba(46,59,85,0.06)',
        ...sx
      }}
    >
      {children}
    </Box>
  );
}

export function SectionTitle({ overline, title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2.4 }}>
      <Box>
        {overline ? (
          <Typography sx={{ letterSpacing: 2, fontWeight: 800, fontSize: '0.7rem', color: T.lavender, mb: 0.4 }}>
            {overline}
          </Typography>
        ) : null}
        <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.3rem', md: '1.5rem' }, color: T.navy, lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle ? <Typography sx={{ color: T.muted, mt: 0.5, maxWidth: 620 }}>{subtitle}</Typography> : null}
      </Box>
      {action}
    </Box>
  );
}

const STATUS_COLORS = {
  processing: { bg: 'rgba(176,205,230,0.35)', color: '#2E3B55' },
  shipped: { bg: 'rgba(162,144,183,0.24)', color: '#5B4B72' },
  delivered: { bg: 'rgba(150,190,150,0.24)', color: '#3F6B47' },
  cancelled: { bg: 'rgba(190,90,90,0.16)', color: '#96393C' },
  pending: { bg: 'rgba(240,190,120,0.26)', color: '#8A5A21' },
  completed: { bg: 'rgba(150,190,150,0.24)', color: '#3F6B47' },
  failed: { bg: 'rgba(190,90,90,0.16)', color: '#96393C' },
  approved: { bg: 'rgba(150,190,150,0.24)', color: '#3F6B47' },
  rejected: { bg: 'rgba(190,90,90,0.16)', color: '#96393C' },
  suspended: { bg: 'rgba(240,190,120,0.26)', color: '#8A5A21' }
};

export function StatusChip({ map, value }) {
  const style = STATUS_COLORS[value] || { bg: 'rgba(148,109,109,0.12)', color: T.muted };
  return (
    <Chip
      size="small"
      label={map[value] || value}
      sx={{ fontWeight: 800, bgcolor: style.bg, color: style.color, borderRadius: '9px', border: 'none' }}
    />
  );
}

export const panelButton = {
  fontWeight: 800,
  borderRadius: '12px',
  textTransform: 'none'
};

export const primaryButton = {
  ...panelButton,
  bgcolor: T.navy,
  color: '#fff',
  px: 2.4,
  py: 1,
  boxShadow: '0 12px 24px rgba(46,59,85,0.18)',
  '&:hover': { bgcolor: T.navyDeep }
};

export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '14px',
    backgroundColor: '#fff',
    '& fieldset': { borderColor: T.line },
    '&:hover fieldset': { borderColor: 'rgba(148,109,109,0.4)' },
    '&.Mui-focused fieldset': { borderColor: T.rose, borderWidth: '1.5px' }
  },
  '& .MuiInputLabel-root.Mui-focused': { color: T.rose }
};

export default function PanelShell({
  nav,
  view,
  onView,
  user,
  roleLabel,
  handleLogout,
  query,
  setQuery,
  searchPlaceholder = 'Ara',
  mobileOpen,
  setMobileOpen,
  siteHref = '/',
  children
}) {
  const initial = (user?.adSoyad || user?.email || 'N').trim()[0]?.toUpperCase();

  const sidebar = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${T.navy} 0%, ${T.navyDeep} 100%)`,
        color: '#fff'
      }}
    >
      <Box sx={{ px: 2.6, py: 3, display: 'flex', alignItems: 'center', gap: 1.3 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '14px',
            bgcolor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.14)',
            display: 'grid',
            placeItems: 'center',
            '& svg': { width: 24, height: 24 }
          }}
        >
          <Logo />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: '1.02rem', lineHeight: 1.1, letterSpacing: 0.2 }}>NikBag</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'rgba(253,244,210,0.66)', fontWeight: 700 }}>{roleLabel}</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 1.6, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <Box
              key={item.id}
              onClick={() => onView(item.id)}
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 1.3,
                px: 1.6,
                py: 1.15,
                borderRadius: '14px',
                cursor: 'pointer',
                color: active ? '#FFF7E0' : 'rgba(255,255,255,0.7)',
                background: active
                  ? 'linear-gradient(90deg, rgba(148,109,109,0.55) 0%, rgba(162,144,183,0.3) 100%)'
                  : 'transparent',
                fontWeight: 800,
                fontSize: '0.9rem',
                transition: 'all .18s ease',
                '&:hover': { background: active ? undefined : 'rgba(255,255,255,0.07)', color: '#fff' },
                '&::before': active
                  ? {
                      content: '""',
                      position: 'absolute',
                      left: 4,
                      top: 10,
                      bottom: 10,
                      width: 3,
                      borderRadius: 3,
                      bgcolor: T.cream
                    }
                  : undefined
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
              {item.label}
              {item.badge ? (
                <Box
                  sx={{
                    ml: 'auto',
                    bgcolor: T.cream,
                    color: T.navy,
                    fontSize: 11,
                    fontWeight: 900,
                    minWidth: 20,
                    textAlign: 'center',
                    px: 0.7,
                    py: '1px',
                    borderRadius: '999px'
                  }}
                >
                  {item.badge}
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ p: 2, m: 1.6, borderRadius: '18px', bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: T.rose, fontWeight: 900 }}>{initial}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{user?.adSoyad || roleLabel}</Typography>
            <Typography noWrap sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.73rem' }}>{user?.email}</Typography>
          </Box>
        </Box>
        <Button
          fullWidth
          onClick={handleLogout}
          startIcon={<LogoutOutlined />}
          sx={{ ...panelButton, color: '#F7C9C9', justifyContent: 'flex-start', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
        >
          Çıkış yap
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: `linear-gradient(180deg, ${T.cream} 0%, ${T.creamDeep} 100%)`
      }}
    >
      <Seo title="Yönetim Paneli" path="/admin" noindex />
      <Box sx={{ width: SIDEBAR, flexShrink: 0, display: { xs: 'none', md: 'block' }, position: 'sticky', top: 0, height: '100vh' }}>
        {sidebar}
      </Box>
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: SIDEBAR, border: 'none' } }}>
        {sidebar}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            bgcolor: 'rgba(253,244,210,0.82)',
            backdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${T.line}`,
            px: { xs: 1.5, md: 3.5 },
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.2
          }}
        >
          <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' }, color: T.navy }}>
            <MenuRounded />
          </IconButton>
          <InputBase
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: T.rose }} /></InputAdornment>}
            sx={{
              flex: 1,
              maxWidth: 560,
              bgcolor: '#fff',
              border: `1px solid ${T.line}`,
              borderRadius: '14px',
              px: 1.6,
              py: 0.7,
              fontWeight: 600,
              boxShadow: '0 8px 20px rgba(46,59,85,0.05)'
            }}
          />
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Vitrini yeni sekmede aç">
            <Button
              onClick={() => window.open(siteHref, '_blank')}
              startIcon={<OpenInNewRounded />}
              sx={{ ...panelButton, display: { xs: 'none', sm: 'inline-flex' }, color: T.navy, border: `1px solid ${T.line}`, bgcolor: '#fff', px: 2 }}
            >
              Sitede gör
            </Button>
          </Tooltip>
          <Avatar sx={{ width: 38, height: 38, bgcolor: T.rose, fontWeight: 900, display: { xs: 'none', sm: 'flex' } }}>{initial}</Avatar>
        </Box>

        <Box sx={{ p: { xs: 1.6, md: 3.5 }, maxWidth: 1440, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
}
