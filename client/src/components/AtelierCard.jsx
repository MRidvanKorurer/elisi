import React from 'react';
import { Avatar, Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import { mediaUrl } from '../api/lookbookService';
import { instagramHref, websiteHref } from '../utils/atelierLinks';

const initialsOf = (name = '') => String(name).trim().charAt(0).toUpperCase() || 'N';

export default function AtelierCard({ atelier, compact = false, showStoreButton = true }) {
  if (!atelier) return null;

  const storePath = atelier.slug && !atelier.isHouse ? `/atolye/${atelier.slug}` : '/products';
  const location = [atelier.ilce, atelier.sehir].filter(Boolean).join(', ');
  const ig = instagramHref(atelier.instagram);
  const site = websiteHref(atelier.website);
  const avatar = mediaUrl(atelier.avatarUrl);
  const countLabel = atelier.productCount > 0
    ? `${atelier.productCount} parça vitrinde`
    : 'Atölye vitrini';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 1.4, sm: 1.8 },
        p: compact ? { xs: 1.5, sm: 1.8 } : { xs: 1.7, sm: 2 },
        mb: 3,
        borderRadius: '20px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(148,109,109,0.14)',
        boxShadow: '0 16px 36px -26px rgba(46,59,85,0.4)'
      }}
    >
      <Avatar
        src={avatar || undefined}
        alt={atelier.magazaAdi}
        sx={{
          width: compact ? 56 : 64,
          height: compact ? 56 : 64,
          flexShrink: 0,
          bgcolor: '#B0CDE6',
          color: '#2E3B55',
          fontWeight: 800,
          fontSize: '1.2rem'
        }}
      >
        {initialsOf(atelier.magazaAdi)}
      </Avatar>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, flexWrap: 'wrap', mb: 0.35 }}>
          <Typography sx={{ color: '#A290B7', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Atölye
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, color: '#946D6D' }}>
            <VerifiedOutlined sx={{ fontSize: 15 }} />
            <Typography sx={{ fontWeight: 800, fontSize: '0.68rem' }}>
              {atelier.isHouse ? 'Nik Bag' : 'Onaylı üretici'}
            </Typography>
          </Box>
        </Box>

        <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: compact ? '1.02rem' : '1.12rem', letterSpacing: '-0.3px', wordBreak: 'break-word' }}>
          {atelier.magazaAdi}
        </Typography>

        <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.82rem', mt: 0.35, display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
          {location ? (
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35 }}>
              <PlaceOutlined sx={{ fontSize: 15 }} />
              {location}
            </Box>
          ) : null}
          {atelier.magazaTuruEtiket ? (
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35 }}>
              <StorefrontOutlined sx={{ fontSize: 15 }} />
              {atelier.magazaTuruEtiket}
            </Box>
          ) : null}
          <Box component="span">{countLabel}</Box>
          {atelier.sinceYear ? <Box component="span">{atelier.sinceYear} yılından beri</Box> : null}
        </Typography>

        {atelier.aciklama ? (
          <Typography sx={{ color: '#2E3B55', fontWeight: 600, fontSize: '0.86rem', lineHeight: 1.5, mt: 0.8, maxHeight: '3em', overflow: 'hidden' }}>
            {atelier.aciklama}
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0, flexWrap: 'wrap' }}>
        {ig ? (
          <Button
            component="a"
            href={ig}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            sx={{ minWidth: 44, width: 44, height: 44, borderRadius: '12px', color: '#946D6D', border: '1px solid rgba(148,109,109,0.2)', p: 0 }}
          >
            <InstagramIcon sx={{ fontSize: 20 }} />
          </Button>
        ) : null}
        {site ? (
          <Button
            component="a"
            href={site}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: { xs: 'none', md: 'inline-flex' }, minWidth: 0, height: 44, borderRadius: '12px', color: '#2E3B55', border: '1px solid rgba(148,109,109,0.2)', fontWeight: 800, fontSize: '0.78rem', px: 1.4 }}
          >
            Site
          </Button>
        ) : null}
        <Button
          component={RouterLink}
          to={storePath}
          endIcon={<ArrowForwardRounded />}
          sx={{
            display: showStoreButton ? 'inline-flex' : 'none',
            flexGrow: { xs: 1, sm: 0 },
            height: 44,
            borderRadius: '999px',
            px: 1.8,
            fontWeight: 800,
            fontSize: '0.82rem',
            color: '#FFFFFF',
            backgroundColor: '#2E3B55',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#946D6D' }
          }}
        >
          {atelier.isHouse ? 'Koleksiyon' : 'Atölyeyi gör'}
        </Button>
      </Box>
    </Box>
  );
}
