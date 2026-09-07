import React, { useMemo } from 'react';
import { Box, Skeleton, Typography, useMediaQuery, useTheme } from '@mui/material';

const GROUPS = [
  { id: 'uzerine', title: 'Üzerine', ids: ['giyim', 'canta', 'taki', 'aksesuar'] },
  { id: 'eve', title: 'Eve', ids: ['banyo-tekstili', 'mum', 'ev-dekorasyon', 'mobilya', 'seramik', 'ahsap', 'mutfak-esyalari', 'evcil-hayvan'] },
  { id: 'atolye', title: 'Atölye', ids: ['hediye-kutulari', 'kisisellestirilebilir', 'kitap-kirtasiye', 'bebek-cocuk', 'parti-malzemeleri', 'kozmetik', 'epoksi', 'hobi-malzemeleri', 'makrome'] }
];

const groupedCategories = (categories = []) => {
  const byId = Object.fromEntries(categories.map((item) => [item.categoryId, item]));
  const seen = new Set();
  const groups = GROUPS.map((group) => {
    const items = group.ids.map((id) => byId[id]).filter(Boolean);
    items.forEach((item) => seen.add(item.categoryId));
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  const leftover = categories.filter((item) => !seen.has(item.categoryId));
  if (leftover.length) {
    const last = groups[groups.length - 1];
    if (last) last.items.push(...leftover);
    else groups.push({ id: 'diger', title: 'Diğer', items: leftover });
  }
  return groups;
};

function IndexRow({ label, count, selected, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.2,
        m: 0,
        px: 1.2,
        py: 0.85,
        border: 'none',
        borderRadius: '12px',
        backgroundColor: selected ? 'rgba(148,109,109,0.12)' : 'transparent',
        color: selected ? '#946D6D' : '#2E3B55',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        boxShadow: selected ? 'inset 3px 0 0 #946D6D' : 'inset 3px 0 0 transparent',
        transition: 'background-color 160ms ease, color 160ms ease',
        '&:hover': {
          backgroundColor: selected ? 'rgba(148,109,109,0.16)' : 'rgba(253,244,210,0.8)'
        }
      }}
    >
      <Typography sx={{ fontWeight: selected ? 800 : 650, fontSize: '0.86rem', lineHeight: 1.3 }}>
        {label}
      </Typography>
      {(count ?? 0) > 0 ? (
        <Typography sx={{ flexShrink: 0, color: selected ? '#946D6D' : '#8A7373', fontWeight: 700, fontSize: '0.72rem' }}>
          {count}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function CategoryBar({
  categories = [],
  totalProducts = 0,
  selectedCategory = 'all',
  onSelectCategory,
  loading = false
}) {
  const groups = useMemo(() => groupedCategories(categories), [categories]);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (loading) {
    return (
      <Box sx={shellSx}>
        <Skeleton width={88} height={18} />
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} height={34} sx={{ mt: 0.8, borderRadius: '10px' }} />
        ))}
      </Box>
    );
  }

  if (!isDesktop) {
    return (
      <Box component="nav" aria-label="Ürün kategorileri" sx={shellSx}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7, mb: 1.4 }}>
          <ChipLink
            label="Tüm koleksiyon"
            selected={selectedCategory === 'all'}
            onClick={() => onSelectCategory?.('all')}
          />
        </Box>
        {groups.map((group) => (
          <Box key={group.id} sx={{ mb: 1.3, '&:last-child': { mb: 0 } }}>
            <Typography sx={{ mb: 0.7, color: '#A290B7', fontWeight: 800, fontSize: '0.66rem', letterSpacing: 1.3 }}>
              {group.title.toLocaleUpperCase('tr-TR')}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
              {group.items.map((cat) => (
                <ChipLink
                  key={cat.categoryId}
                  label={cat.name}
                  selected={selectedCategory === cat.categoryId}
                  onClick={() => onSelectCategory?.(cat.categoryId)}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      aria-label="Ürün kategorileri"
      data-lenis-prevent
      sx={{
        ...shellSx,
        position: 'sticky',
        top: 96,
        maxHeight: 'calc(100vh - 128px)',
        overflowY: 'auto'
      }}
    >
      <Typography sx={{ px: 1.2, mb: 0.8, color: '#8A7373', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 1.5 }}>
        ATÖLYELER
      </Typography>

      <IndexRow
        label="Tüm koleksiyon"
        count={totalProducts}
        selected={selectedCategory === 'all'}
        onClick={() => onSelectCategory?.('all')}
      />

      {groups.map((group) => (
        <Box key={group.id} sx={{ mt: 1.6 }}>
          <Typography sx={{ px: 1.2, mb: 0.45, color: '#A290B7', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 1.3 }}>
            {group.title.toLocaleUpperCase('tr-TR')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.15 }}>
            {group.items.map((cat) => (
              <IndexRow
                key={cat.categoryId}
                label={cat.name}
                count={cat.productCount}
                selected={selectedCategory === cat.categoryId}
                onClick={() => onSelectCategory?.(cat.categoryId)}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function ChipLink({ label, selected, onClick }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        m: 0,
        px: 1.15,
        py: 0.55,
        borderRadius: '999px',
        border: selected ? 'none' : '1px solid rgba(148,109,109,0.18)',
        backgroundColor: selected ? '#946D6D' : '#FDF4D2',
        color: selected ? '#FFFFFF' : '#2E3B55',
        fontFamily: 'inherit',
        fontWeight: 700,
        fontSize: '0.78rem',
        cursor: 'pointer'
      }}
    >
      {label}
    </Box>
  );
}

const shellSx = {
  p: { xs: 1.4, md: 1.6 },
  borderRadius: '24px',
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(148,109,109,0.14)',
  boxShadow: '0 16px 36px -28px rgba(46,59,85,0.4)'
};
