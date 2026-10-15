import { useEffect, useState } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import LocaleLink from '../i18n/LocaleLink';
import SiteContainer from './SiteContainer';
import { homeEyebrowSx, homeSubtitleSx, homeTitleSx } from './homeType';
import ProductCard from './ProductCard';
import { productService } from '../api/productService';
import { categoryService } from '../api/categoryService';
import { imgBagOrange } from '../assets/media';

const RANK_COLORS = ['#2E3B55', '#946D6D', '#A290B7'];

function CategoryPanel({ group, t }) {
  const link = `/kategori/${encodeURIComponent(group.categoryId)}`;
  const count = Number(group.productCount) || 0;

  return (
    <Box
      sx={{
        position: 'relative',
        minWidth: 0,
        p: { xs: 1.4, sm: 1.8 },
        borderRadius: '24px',
        bgcolor: '#FFFFFF',
        border: '1px solid rgba(46,59,85,0.08)',
        boxShadow: '0 14px 34px -24px rgba(46,59,85,0.35)',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 4,
          background: 'linear-gradient(90deg, #2E3B55, #946D6D 55%, #A290B7)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, mb: { xs: 1.6, sm: 1.8 } }}>
        <Box
          component={LocaleLink}
          to={link}
          aria-label={group.name}
          sx={{
            width: { xs: 48, sm: 54 },
            height: { xs: 48, sm: 54 },
            flexShrink: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            bgcolor: '#FDF4D2',
            border: '2px solid #FDF4D2',
            boxShadow: '0 0 0 1px rgba(148,109,109,0.25)'
          }}
        >
          <Box
            component="img"
            src={group.image || imgBagOrange}
            alt=""
            loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            component="h3"
            sx={{
              color: '#2E3B55',
              fontWeight: 800,
              fontSize: { xs: '1rem', sm: '1.08rem' },
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {group.name}
          </Typography>
          <Typography sx={{ color: '#A290B7', fontWeight: 700, fontSize: 12, mt: 0.3 }}>
            {t('categoryRails.top3')}
            {count > 0 ? ` · ${t('categoryRails.products', { count })}` : ''}
          </Typography>
        </Box>

        <Box
          component={LocaleLink}
          to={link}
          sx={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: { xs: 1, sm: 1.4 },
            py: 0.7,
            borderRadius: 999,
            bgcolor: '#FDF4D2',
            color: '#2E3B55',
            fontWeight: 800,
            fontSize: 12.5,
            textDecoration: 'none',
            transition: 'background-color .2s ease, color .2s ease',
            '&:hover': { bgcolor: '#2E3B55', color: '#FDF4D2' }
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {t('categoryRails.seeAll')}
          </Box>
          <ArrowForwardRounded sx={{ fontSize: 16 }} />
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: 'flex', sm: 'grid' },
          gridTemplateColumns: { sm: 'repeat(3, minmax(0, 1fr))' },
          gap: { xs: 1.2, sm: 1.4 },
          overflowX: { xs: 'auto', sm: 'visible' },
          scrollSnapType: { xs: 'x mandatory', sm: 'none' },
          WebkitOverflowScrolling: 'touch',
          mx: { xs: -1.4, sm: 0 },
          px: { xs: 1.4, sm: 0 },
          pt: 1.2,
          pb: 0.6,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {(group.products || []).slice(0, 3).map((product, index) => (
          <Box
            key={product._id || product.id}
            sx={{
              position: 'relative',
              flex: { xs: '0 0 156px', sm: 'initial' },
              minWidth: 0,
              scrollSnapAlign: 'start'
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: -10,
                left: 10,
                zIndex: 2,
                minWidth: 26,
                height: 26,
                px: 0.8,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                bgcolor: RANK_COLORS[index] || '#2E3B55',
                color: '#FDF4D2',
                fontWeight: 800,
                fontSize: 12,
                border: '2px solid #FFFFFF',
                boxShadow: '0 6px 12px -6px rgba(46,59,85,0.6)',
                pointerEvents: 'none'
              }}
            >
              {index + 1}
            </Box>
            <ProductCard product={product} compact />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function PanelSkeleton() {
  return (
    <Box sx={{ p: { xs: 1.4, sm: 1.8 }, borderRadius: '24px', bgcolor: '#FFFFFF' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, mb: 2 }}>
        <Skeleton variant="rounded" width={54} height={54} sx={{ borderRadius: '16px' }} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="45%" />
          <Skeleton width="30%" />
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.4 }}>
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} variant="rounded" sx={{ borderRadius: '18px', aspectRatio: '3 / 4', height: 'auto' }} />
        ))}
      </Box>
    </Box>
  );
}

export default function CategoryBestsellers() {
  const { t } = useTranslation('home');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fromFilter = async () => {
      const data = await categoryService.getAllCategories();
      const cats = (data?.categories || []).filter((item) => Number(item.productCount) > 0);
      const rows = await Promise.all(cats.map(async (cat) => {
        const id = cat.categoryId || cat.id;
        if (!id) return null;
        try {
          const response = await productService.getFilteredProducts({
            category: id,
            sort: 'popular',
            page: 1,
            limit: 3
          });
          const products = response?.products || [];
          if (!products.length) return null;
          return {
            categoryId: id,
            name: cat.name || id,
            image: cat.image || products[0].image || '',
            productCount: cat.productCount,
            products
          };
        } catch {
          return null;
        }
      }));
      return rows.filter(Boolean);
    };

    productService.getCategoryHighlights()
      .then((data) => (data?.highlights?.length ? data.highlights : fromFilter()))
      .catch(() => fromFilter())
      .then((rows) => {
        if (!cancelled) setGroups(Array.isArray(rows) ? rows : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (!loading && !groups.length) return null;

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 3.5, md: 5 },
        background: 'linear-gradient(180deg, #FDF4D2 0%, rgba(176,205,230,0.18) 100%)'
      }}
    >
      <SiteContainer sx={{ px: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
            gap: 1,
            mb: { xs: 2.4, md: 3 }
          }}
        >
          <Box>
            <Typography sx={homeEyebrowSx}>
              {t('categoryRails.eyebrow')}
            </Typography>
            <Typography component="h2" sx={homeTitleSx}>
              {t('categoryRails.title')}
            </Typography>
          </Box>
          <Typography sx={{ ...homeSubtitleSx, maxWidth: 380, mt: { xs: 0.8, md: 0 } }}>
            {t('categoryRails.subtitle')}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
            gap: { xs: 2, md: 2.4 }
          }}
        >
          {loading
            ? [0, 1].map((key) => <PanelSkeleton key={key} />)
            : groups.map((group) => <CategoryPanel key={group.categoryId} group={group} t={t} />)}
        </Box>
      </SiteContainer>
    </Box>
  );
}
