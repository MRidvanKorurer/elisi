import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Modal,
  Skeleton,
  Snackbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined';
import { motion, useReducedMotion } from 'framer-motion';
import { productService } from '../api/productService';
import { adsService } from '../api/adsService';
import { cartService } from '../api/cartServices';
import { imgBagOrange } from '../assets/media';
import { formatTRY, salePriceOf } from '../utils/price';
import { FEATURED_SLOTS } from '../utils/featured';
import LoadingButton from './LoadingButton';
import { nextVisibleCount } from '../hooks/useProductGridPageSize';

export default function FeaturedModal({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  const pageSize = isMd ? 3 : isSm ? 2 : 1;
  const reducedMotion = useReducedMotion();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true);
    setVisibleCount(0);
    productService.getSponsoredProducts()
      .then((data) => {
        if (!active) return;
        const list = data?.products || [];
        setProducts(list);
        if (list.length) {
          adsService.track(list.map((product) => ({
            type: 'impression',
            surface: 'featured',
            product: product._id || product.id,
            seller: product.seller
          })));
        }
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    if (!open || loading || !products.length) return;
    setVisibleCount((prev) => nextVisibleCount(prev, pageSize));
  }, [open, loading, products.length, pageSize]);

  const handleQuickAdd = async (event, product) => {
    event.stopPropagation();
    const productId = product._id || product.id;
    if (!productId || addingId) return;
    setAddingId(productId);
    try {
      const response = await cartService.addToCart({
        productId,
        name: product.title || product.name,
        price: salePriceOf(product),
        image: product.image || (product.images && product.images[0]) || imgBagOrange,
        quantity: 1
      });
      if (!response?.success) throw new Error(response?.message || 'Ürün sepete eklenemedi.');
      window.dispatchEvent(new Event('cartUpdated'));
      setToast({ open: true, message: 'Ürün sepete eklendi.', severity: 'success' });
    } catch (error) {
      const unauthorized = error?.status === 401 || /token/i.test(error?.mesaj || '');
      setToast({
        open: true,
        message: unauthorized ? 'Sepete eklemek için giriş yapmalısınız.' : 'Ürün sepete eklenemedi.',
        severity: unauthorized ? 'warning' : 'error'
      });
    } finally {
      setAddingId(null);
    }
  };

  const openProduct = (product) => {
    const productId = product._id || product.id;
    if (!productId) return;
    adsService.track({
      type: 'click',
      surface: 'featured',
      product: productId,
      seller: product.seller
    });
    onClose();
    navigate(`/urun/${productId}`);
  };

  const shown = visibleCount || pageSize;
  const visibleProducts = products.slice(0, shown);
  const hasMore = shown < products.length;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="featured-modal-title"
        closeAfterTransition
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(30, 39, 56, 0.55)',
              backdropFilter: 'blur(8px)'
            }
          }
        }}
      >
        <Box
          component={motion.div}
          initial={reducedMotion ? false : { opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.36, ease: [0.22, 0.61, 0.36, 1] }}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            translate: '-50% -50%',
            width: { xs: 'calc(100% - 24px)', sm: '86%', md: 860 },
            maxHeight: { xs: '92svh', md: '88vh' },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFFFFF',
            borderRadius: { xs: '24px', md: '30px' },
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 45px 90px -35px rgba(30,39,56,0.65)',
            overflow: 'hidden',
            outline: 'none'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              px: { xs: 2.5, md: 4 },
              pt: { xs: 3, md: 3.6 },
              pb: { xs: 2.6, md: 3.2 },
              color: '#FFFFFF',
              background: 'linear-gradient(125deg, #2E3B55 0%, #6E5252 55%, #946D6D 100%)'
            }}
          >
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                    px: 1.4,
                    py: 0.5,
                    mb: 1.4,
                    borderRadius: '999px',
                    backgroundColor: 'rgba(255,255,255,0.16)',
                    border: '1px solid rgba(255,255,255,0.28)'
                  }}
                >
                  <AutoAwesomeIcon sx={{ fontSize: '15px !important' }} />
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1.1 }}>
                    VİTRİN · {products.length}/{FEATURED_SLOTS}
                  </Typography>
                </Box>
                <Typography
                  id="featured-modal-title"
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.7px',
                    lineHeight: 1.12,
                    fontSize: { xs: '1.3rem', sm: '1.7rem', md: '1.95rem' }
                  }}
                >
                  {t('featured.title', { ns: 'catalog' })}
                </Typography>
                <Typography sx={{ mt: 1, maxWidth: 520, color: 'rgba(255,255,255,0.82)', fontWeight: 500, fontSize: { xs: '0.83rem', md: '0.92rem' } }}>
                  {t('featured.lead', { ns: 'catalog' })}
                </Typography>
              </Box>
              <IconButton
                onClick={onClose}
                aria-label={t('actions.close')}
                sx={{
                  flexShrink: 0,
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.24)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.26)' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              px: { xs: 2, md: 3.4 },
              py: { xs: 2.4, md: 3 },
              backgroundColor: '#FBF7EE',
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(148,109,109,0.35)', borderRadius: 8 }
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
                gap: { xs: 1.6, md: 2.2 }
              }}
            >
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Box key={`skeleton-${index}`} sx={{ borderRadius: '20px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid rgba(148,109,109,0.12)' }}>
                      <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '1 / 1' }} />
                      <Box sx={{ p: 1.8 }}>
                        <Skeleton width="45%" height={14} />
                        <Skeleton width="85%" height={22} sx={{ mt: 0.8 }} />
                        <Skeleton width="55%" height={30} sx={{ mt: 1.4 }} />
                      </Box>
                    </Box>
                  ))
                : visibleProducts.map((product, index) => {
                    const productId = product._id || product.id;
                    const productTitle = product.title || product.name;
                    const discount = Number(product.discountPercentage || 0);
                    const listPrice = Number(product.price || 0);
                    const finalPrice = salePriceOf(product);
                    const cover = product.image || (product.images && product.images[0]) || imgBagOrange;

                    return (
                      <Box
                        key={productId}
                        component={motion.div}
                        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.34, delay: 0.06 * Math.min(index, 5), ease: [0.22, 0.61, 0.36, 1] }}
                        onClick={() => openProduct(product)}
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid rgba(148,109,109,0.14)',
                          boxShadow: '0 12px 26px -18px rgba(46,59,85,0.45)',
                          transition: 'transform .4s cubic-bezier(.22,.61,.36,1), box-shadow .4s ease, border-color .3s ease',
                          '&:hover': {
                            transform: 'translateY(-6px)',
                            borderColor: 'rgba(148,109,109,0.4)',
                            boxShadow: '0 26px 44px -22px rgba(46,59,85,0.5)'
                          }
                        }}
                      >
                        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1.2 }}>
                          <Box
                            className="featured-cover"
                            component="img"
                            src={cover}
                            alt={productTitle}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = imgBagOrange;
                            }}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              objectPosition: 'center',
                              display: 'block'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 10,
                              left: 10,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1,
                              py: 0.4,
                              borderRadius: '999px',
                              backgroundColor: '#2E3B55',
                              color: '#fff',
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              letterSpacing: 0.4
                            }}
                          >
                            <AutoAwesomeIcon sx={{ fontSize: '13px !important' }} /> {t('featured.badge', { ns: 'catalog' })}
                          </Box>
                          {discount > 0 && (
                            <Chip
                              label={`%${discount}`}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                backgroundColor: '#946D6D',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '0.68rem'
                              }}
                            />
                          )}
                        </Box>
                        <Box sx={{ p: { xs: 1.6, md: 1.9 }, display: 'flex', flexDirection: 'column', gap: 0.4, flex: 1 }}>
                          <Typography sx={{ color: '#A290B7', fontWeight: 800, fontSize: '0.68rem', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                            {product.vendorName || product.vendor?.name || 'Onaylı atölye'}
                          </Typography>
                          <Typography
                            sx={{
                              color: '#2E3B55',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              lineHeight: 1.3,
                              minHeight: '2.6em',
                              overflow: 'hidden',
                              '&&': {
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }
                            }}
                          >
                            {productTitle}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.9, mt: 'auto', pt: 1.2 }}>
                            <Typography sx={{ color: '#946D6D', fontWeight: 800, fontSize: '1.12rem' }}>
                              ₺{formatTRY(finalPrice)}
                            </Typography>
                            {discount > 0 && (
                              <Typography sx={{ color: '#9C8B8B', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'line-through' }}>
                                ₺{formatTRY(listPrice)}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            fullWidth
                            variant="contained"
                            disableElevation
                            startIcon={<ShoppingBagOutlinedIcon />}
                            disabled={addingId === productId}
                            onClick={(event) => handleQuickAdd(event, product)}
                            sx={{
                              mt: 1.3,
                              borderRadius: '12px',
                              py: 0.9,
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              backgroundColor: '#2E3B55',
                              color: '#FFFFFF',
                              '&:hover': { backgroundColor: '#946D6D' },
                              '&.Mui-disabled': { backgroundColor: 'rgba(46,59,85,0.35)', color: '#fff' }
                            }}
                          >
                            {addingId === productId ? t('card.adding', { ns: 'catalog' }) : t('card.addToCart', { ns: 'catalog' })}
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
            </Box>

            {hasMore ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
                <LoadingButton
                  tone="outline"
                  onClick={() => setVisibleCount((prev) => (prev || pageSize) + pageSize)}
                  endIcon={<KeyboardArrowDownOutlined />}
                  sx={{ borderRadius: '16px', px: 3, py: 1.1 }}
                >
                  {t('actions.showMoreCount', { count: products.length - shown })}
                </LoadingButton>
              </Box>
            ) : null}

            {!loading && products.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: '#2E3B55', fontWeight: 800, mb: 0.6 }}>{t('featured.emptyTitle', { ns: 'catalog' })}</Typography>
                <Typography sx={{ color: '#6E5252', fontWeight: 500, fontSize: '0.9rem' }}>
                  {t('featured.emptyText', { ns: 'catalog' })}
                </Typography>
              </Box>
            ) : null}
          </Box>

          <Box
            sx={{
              px: { xs: 2, md: 3.4 },
              py: { xs: 1.6, md: 2 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              borderTop: '1px solid rgba(148,109,109,0.14)',
              backgroundColor: '#FFFFFF'
            }}
          >
            <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.82rem', display: { xs: 'none', sm: 'block' } }}>
              {t('featured.limit', { ns: 'catalog', count: FEATURED_SLOTS })}
            </Typography>
            <Button
              endIcon={<ArrowForward />}
              onClick={() => {
                onClose();
                navigate('/urunler');
              }}
              sx={{
                fontWeight: 800,
                color: '#2E3B55',
                borderRadius: '12px',
                px: 2,
                '&:hover': { backgroundColor: 'rgba(46,59,85,0.06)' }
              }}
            >
              {t('featured.seeAll', { ns: 'catalog' })}
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: '12px', fontWeight: 700 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
