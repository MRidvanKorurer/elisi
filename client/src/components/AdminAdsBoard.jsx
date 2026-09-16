import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import CampaignOutlined from '@mui/icons-material/CampaignOutlined';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import { PanelCard } from './PanelShell';
import { T, money, when } from '../utils/panel';
import { FEATURED_PACKAGES } from '../utils/featured';
import { adminService } from '../api/adminService';

const headCell = {
  fontWeight: 800,
  color: T.muted,
  fontSize: '0.72rem',
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  borderBottom: `1px solid ${T.line}`,
  bgcolor: T.surfaceSoft
};
const bodyCell = { borderBottom: `1px solid ${T.line}`, color: T.navy, py: 1.2 };

function Stat({ label, value, hint }) {
  return (
    <PanelCard sx={{ py: 1.8 }}>
      <Typography sx={{ color: T.muted, fontWeight: 800, fontSize: 12 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 900, color: T.navy, fontSize: '1.35rem', mt: 0.3 }}>{value}</Typography>
      {hint ? <Typography sx={{ color: T.muted, fontSize: 12, mt: 0.3 }}>{hint}</Typography> : null}
    </PanelCard>
  );
}

function ProductThumb({ item }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', minWidth: 0 }}>
      <Box
        component="img"
        src={item.image || ''}
        alt=""
        sx={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover', bgcolor: T.surfaceSoft, flexShrink: 0 }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 800, color: T.navy, fontSize: 13 }}>{item.title}</Typography>
        <Typography noWrap sx={{ color: T.muted, fontSize: 12 }}>
          {item.categoryLabel || item.category} · {money(item.price)}
        </Typography>
      </Box>
    </Box>
  );
}

export default function AdminAdsBoard({ query = '', onOpenFeatured, onGift }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [board, setBoard] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [filter, setFilter] = useState('eligible');
  const [giftDays, setGiftDays] = useState(3);
  const [giftingId, setGiftingId] = useState('');

  const load = async (withAi = false) => {
    setError('');
    try {
      const data = withAi
        ? await adminService.adsSuggest()
        : await adminService.adsBoard({ ai: 0 });
      setBoard(data.board || null);
      setSuggestions(data.suggestions || null);
    } catch (err) {
      setError(err.response?.data?.mesaj || err.message || 'Reklam panosu alınamadı.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  const q = String(query || '').trim().toLowerCase();
  const list = useMemo(() => {
    const source =
      filter === 'live' ? board?.live || []
        : filter === 'ads' ? board?.topAds || []
          : filter === 'best' ? board?.bestsellers || []
            : board?.eligible || [];
    if (!q) return source;
    return source.filter((item) =>
      `${item.title} ${item.categoryLabel} ${item.seller?.name || ''} ${item.reason || ''}`.toLowerCase().includes(q)
    );
  }, [board, filter, q]);

  const gift = async (productId) => {
    if (!onGift) return;
    setGiftingId(productId);
    try {
      await onGift({ productId, days: giftDays });
      await load(false);
    } finally {
      setGiftingId('');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: T.rose }} />
      </Box>
    );
  }

  return (
    <Box>
      {error ? (
        <Typography sx={{ color: T.rose, fontWeight: 700, mb: 1.5 }}>{error}</Typography>
      ) : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.4, mb: 2 }}>
        <Stat label="Boş vitrin" value={`${board?.slots?.free ?? 0}/${board?.slots?.total ?? 12}`} hint="Reklama açılabilecek slot" />
        <Stat label="Reklama uygun" value={board?.totals?.eligible ?? 0} hint="Yayında, stoklu, vitrinde değil" />
        <Stat label="30 gün CTR" value={`%${board?.totals?.ctr ?? 0}`} hint={`${board?.totals?.clicks || 0} tıklama · ${board?.totals?.impressions || 0} gösterim`} />
        <Stat label="Vitrinde" value={board?.slots?.live ?? 0} hint={board?.slots?.nextFreeAt ? `Sonraki boşluk ${when(board.slots.nextFreeAt)}` : 'Anlık doluluk'} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' }, gap: 1.6, mb: 2 }}>
        <PanelCard>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1.2 }}>
            <Box>
              <Typography sx={{ fontWeight: 900, color: T.navy, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <AutoAwesomeOutlined sx={{ color: T.rose, fontSize: 20 }} />
                Yapay zeka önerileri
              </Typography>
              <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.4 }}>
                {suggestions?.source === 'ai'
                  ? 'LLM ile katalog + pazar eğilimi birleştirildi.'
                  : board?.aiReady
                    ? 'Hızlı skor hazır. Daha zengin metin için “AI ile yenile”.'
                    : 'OPENAI_API_KEY veya GEMINI_API_KEY yoksa katalog skoruna göre öneri üretilir.'}
              </Typography>
            </Box>
            <Button
              onClick={async () => {
                setRefreshing(true);
                await load(true);
              }}
              disabled={refreshing}
              fullWidth
              startIcon={refreshing ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeOutlined />}
              sx={{
                fontWeight: 800,
                textTransform: 'none',
                borderRadius: '12px',
                bgcolor: T.navy,
                color: '#fff',
                px: 1.6,
                width: { xs: '100%', sm: 'auto' },
                '&:hover': { bgcolor: T.rose }
              }}
            >
              {refreshing ? 'Üretiliyor…' : 'AI ile yenile'}
            </Button>
          </Box>
          <Typography sx={{ color: T.navy, fontWeight: 650, lineHeight: 1.6, mb: 1.4 }}>
            {suggestions?.summary}
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {(suggestions?.picks || []).map((pick) => (
              <Box
                key={pick.productId}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1.2,
                  alignItems: { xs: 'stretch', sm: 'center' },
                  p: 1.1,
                  borderRadius: '14px',
                  border: `1px solid ${T.line}`,
                  bgcolor: T.surfaceSoft
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <Chip label={`#${pick.priority}`} size="small" sx={{ fontWeight: 800, bgcolor: T.navy, color: '#fff', flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 800, color: T.navy, fontSize: 13 }}>{pick.title}</Typography>
                    <Typography sx={{ color: T.muted, fontSize: 12 }}>{pick.reason}</Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  disabled={Boolean(giftingId) || (board?.slots?.free || 0) <= 0}
                  onClick={() => gift(pick.productId)}
                  sx={{ fontWeight: 800, textTransform: 'none', color: T.rose, alignSelf: { xs: 'flex-end', sm: 'center' } }}
                >
                  {giftingId === pick.productId ? '…' : 'Vitrine al'}
                </Button>
              </Box>
            ))}
            {!suggestions?.picks?.length ? (
              <Typography sx={{ color: T.muted, fontWeight: 700 }}>Öneri için uygun ürün bulunamadı.</Typography>
            ) : null}
          </Box>
        </PanelCard>

        <PanelCard>
          <Typography sx={{ fontWeight: 900, color: T.navy, display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
            <TrendingUpRounded sx={{ color: T.lavender }} />
            Diğer sitelerde öne çıkan eğilimler
          </Typography>
          <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.4 }}>
            Etsy, Trendyol ve Instagram Shop gibi pazarlardaki genel talep sinyalleri. Canlı rakip scrape değildir; AI + kategori bilgisiyle yorumlanır.
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.1 }}>
            {(suggestions?.marketTrends || []).map((trend) => (
              <Box key={trend.title} sx={{ p: 1.2, borderRadius: '14px', border: `1px solid ${T.line}` }}>
                <Typography sx={{ fontWeight: 800, color: T.navy, fontSize: 14 }}>{trend.title}</Typography>
                <Typography sx={{ color: T.muted, fontSize: 13, mt: 0.4, lineHeight: 1.55 }}>{trend.why}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.9 }}>
                  {(trend.platforms || []).map((platform) => (
                    <Chip
                      key={platform}
                      size="small"
                      icon={<StorefrontOutlined sx={{ fontSize: '14px !important' }} />}
                      label={platform}
                      sx={{ fontWeight: 700, bgcolor: 'rgba(176,205,230,0.35)', color: T.navy }}
                    />
                  ))}
                </Box>
                {trend.matchedTitle ? (
                  <Typography sx={{ color: T.rose, fontWeight: 700, fontSize: 12, mt: 0.8 }}>
                    Katalog eşleşmesi: {trend.matchedTitle}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Box>
        </PanelCard>
      </Box>

      {(board?.categories || []).length ? (
        <PanelCard sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1 }}>Kategori talebi</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {board.categories.map((row) => (
              <Chip
                key={row.category}
                label={`${row.category}: ${row.sold} satış · ${row.eligible} uygun · ${row.live} vitrinde`}
                sx={{ fontWeight: 700, bgcolor: T.surfaceSoft, color: T.navy }}
              />
            ))}
          </Box>
        </PanelCard>
      ) : null}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1.4 }}>
        {[
          ['eligible', 'Reklama uygun'],
          ['live', 'Vitrinde'],
          ['best', 'Çok satanlar'],
          ['ads', 'Reklam performansı']
        ].map(([id, label]) => (
          <Chip
            key={id}
            label={label}
            onClick={() => setFilter(id)}
            sx={{
              fontWeight: 800,
              cursor: 'pointer',
              bgcolor: filter === id ? T.navy : T.surface,
              color: filter === id ? '#fff' : T.navy,
              border: `1px solid ${T.line}`
            }}
          />
        ))}
        <Box sx={{ flex: 1 }} />
        <Select
          size="small"
          value={giftDays}
          onChange={(event) => setGiftDays(Number(event.target.value))}
          sx={{ minWidth: 120, bgcolor: '#fff', borderRadius: '12px' }}
        >
          {FEATURED_PACKAGES.map((pack) => (
            <MenuItem key={pack.days} value={pack.days}>{pack.label} hediye</MenuItem>
          ))}
        </Select>
        <Button
          onClick={() => onOpenFeatured?.()}
          startIcon={<CampaignOutlined />}
          sx={{ fontWeight: 800, textTransform: 'none', color: T.navy }}
        >
          Öne çıkan talepleri aç
        </Button>
      </Box>

      <PanelCard sx={{ p: 0, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headCell}>Ürün</TableCell>
              <TableCell sx={headCell}>Satış</TableCell>
              <TableCell sx={headCell}>Gösterim</TableCell>
              <TableCell sx={headCell}>Tıklama</TableCell>
              <TableCell sx={headCell}>CTR</TableCell>
              <TableCell sx={headCell}>Skor</TableCell>
              <TableCell sx={headCell}>Durum</TableCell>
              <TableCell sx={headCell} align="right">İşlem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={bodyCell}><ProductThumb item={item} /></TableCell>
                <TableCell sx={bodyCell}>{item.soldCount || 0}</TableCell>
                <TableCell sx={bodyCell}>{item.impressions || 0}</TableCell>
                <TableCell sx={bodyCell}>{item.clicks || 0}</TableCell>
                <TableCell sx={bodyCell}>%{item.ctr || 0}</TableCell>
                <TableCell sx={bodyCell}>{item.score || 0}</TableCell>
                <TableCell sx={bodyCell}>
                  <Chip
                    size="small"
                    label={item.isSponsored ? 'Vitrinde' : item.eligible ? 'Uygun' : 'Uygun değil'}
                    sx={{
                      fontWeight: 800,
                      bgcolor: item.isSponsored ? 'rgba(63,107,71,0.12)' : item.eligible ? 'rgba(176,205,230,0.45)' : T.surfaceSoft,
                      color: T.navy
                    }}
                  />
                  <Typography sx={{ color: T.muted, fontSize: 11, mt: 0.4, maxWidth: 180 }}>{item.reason}</Typography>
                </TableCell>
                <TableCell sx={bodyCell} align="right">
                  {item.eligible ? (
                    <Button
                      size="small"
                      disabled={Boolean(giftingId) || (board?.slots?.free || 0) <= 0}
                      onClick={() => gift(item.id)}
                      sx={{ fontWeight: 800, textTransform: 'none', color: '#fff', bgcolor: T.navy, borderRadius: '10px', px: 1.2, '&:hover': { bgcolor: T.rose } }}
                    >
                      {giftingId === item.id ? '…' : 'Vitrine al'}
                    </Button>
                  ) : (
                    <Typography sx={{ color: T.muted, fontWeight: 700, fontSize: 12 }}>—</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!list.length ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ ...bodyCell, py: 4, textAlign: 'center', color: T.muted, fontWeight: 700 }}>
                  Bu filtrede ürün yok.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </PanelCard>
    </Box>
  );
}
