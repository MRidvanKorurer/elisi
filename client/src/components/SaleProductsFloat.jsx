import { useEffect, useState } from 'react';
import { Box, Button, Fade, IconButton, Modal, Skeleton, Typography } from '@mui/material';
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import { productService } from '../api/productService';
import { PATHS } from '../i18n/paths';
import { salePriceOf } from '../utils/price';
import { money } from '../utils/currency';
import { imgBagOrange } from '../assets/media';

const PAGE_LIMIT = 24;
const MAX_PAGES = 12;
const SOFT_EASE = [0.22, 0.61, 0.36, 1];

const loadSaleProducts = async () => {
  const all = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= MAX_PAGES) {
    const response = await productService.getFilteredProducts({
      onSale: '1',
      sort: 'discount',
      page,
      limit: PAGE_LIMIT
    });
    const list = response?.products || [];
    all.push(...list);
    totalPages = Number(response?.pagination?.totalPages) || 1;
    if (!list.length) break;
    page += 1;
  }
  return all;
};

function SaleModal({ open, onClose }) {
  const { t } = useTranslation('common');
  const navigate = useLocaleNavigate();
  const reduced = useReducedMotion();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true);
    loadSaleProducts()
      .then((list) => {
        if (active) setProducts(list);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [open]);

  const openProduct = (product) => {
    const id = product.slug || product._id || product.id;
    onClose();
    navigate(PATHS.product(id));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="sale-products-title"
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 480,
          sx: { backgroundColor: 'rgba(30, 39, 56, 0.4)' }
        }
      }}
    >
      <Fade in={open} timeout={reduced ? 0 : { enter: 520, exit: 320 }}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          translate: '-50% -50%',
          width: { xs: 'calc(100% - 24px)', sm: '86%', md: 860 },
          maxHeight: { xs: '92svh', md: '88vh' },
          outline: 'none'
        }}
      >
      <Box
        component={motion.div}
        initial={reduced ? false : { opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.52, ease: SOFT_EASE }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: { xs: '92svh', md: '88vh' },
          bgcolor: '#FBF6EA',
          borderRadius: { xs: '24px', md: '28px' },
          border: '1px solid rgba(46,59,85,0.08)',
          boxShadow: '0 32px 70px -32px rgba(30,39,56,0.55)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: { xs: 2.2, md: 3 }, pt: 2.2, pb: 1.6, bgcolor: '#2E3B55', color: '#FBF6EA' }}>
          <Box>
            <Typography id="sale-products-title" sx={{ fontWeight: 800, letterSpacing: '-0.03em', fontSize: { xs: '1.2rem', md: '1.45rem' } }}>
              {t('saleFloat.title')}
            </Typography>
            <Typography sx={{ mt: 0.4, color: 'rgba(251,246,234,0.78)', fontSize: '0.86rem' }}>
              {loading ? t('saleFloat.loading') : t('saleFloat.count', { count: products.length })}
            </Typography>
          </Box>
          <IconButton aria-label={t('actions.close', 'Kapat')} onClick={onClose} sx={{ color: '#FBF6EA' }}>
            <CloseRounded />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: { xs: 1.6, md: 2.4 }, py: 2 }}>
          {loading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.4 }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={92} sx={{ borderRadius: '16px' }} />
              ))}
            </Box>
          ) : products.length === 0 ? (
            <Typography sx={{ color: '#6E5252', textAlign: 'center', py: 6 }}>{t('saleFloat.empty')}</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2 }}>
              {products.map((product, index) => {
                const id = product._id || product.id;
                const title = product.title || product.name;
                const discount = Number(product.discountPercentage || 0);
                const cover = product.image || product.images?.[0] || imgBagOrange;
                return (
                  <Box
                    key={id}
                    component={motion.button}
                    type="button"
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.42, delay: reduced ? 0 : 0.04 * Math.min(index, 10), ease: SOFT_EASE }}
                    onClick={() => openProduct(product)}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '84px minmax(0, 1fr)',
                      gap: 1.2,
                      p: 1,
                      textAlign: 'left',
                      border: '1px solid rgba(46,59,85,0.08)',
                      borderRadius: '16px',
                      bgcolor: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      '&:hover': { borderColor: '#946D6D' }
                    }}
                  >
                    <Box
                      component="img"
                      src={cover}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = imgBagOrange;
                      }}
                      sx={{ width: 84, height: 84, objectFit: 'cover', borderRadius: '12px', bgcolor: '#F7EFE4' }}
                    />
                    <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography sx={{ color: '#2E3B55', fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mt: 0.6 }}>
                        <Typography sx={{ color: '#946D6D', fontWeight: 800 }}>{money(salePriceOf(product))}</Typography>
                        <Typography sx={{ color: '#A290B7', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'line-through' }}>
                          {money(product.price)}
                        </Typography>
                        {discount > 0 && (
                          <Typography sx={{ color: '#2E3B55', fontWeight: 800, fontSize: '0.75rem' }}>%{discount}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
      </Box>
      </Fade>
    </Modal>
  );
}

export default function SaleProductsFloat() {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        startIcon={<LocalOfferOutlined sx={{ fontSize: '16px !important' }} />}
        sx={{
          borderRadius: '999px',
          px: 1.5,
          py: 0.85,
          minHeight: 40,
          bgcolor: '#2E3B55',
          color: '#FBF6EA',
          fontWeight: 800,
          fontSize: '0.75rem',
          letterSpacing: '0.01em',
          boxShadow: '0 10px 24px -12px rgba(46,59,85,0.7)',
          '&:hover': { bgcolor: '#946D6D' }
        }}
      >
        {t('saleFloat.button')}
      </Button>
      <SaleModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
