import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import LocaleLink from '../i18n/LocaleLink';
import { categoryLabel } from '../utils/categories';
import { 
  Card, CardMedia, CardContent, CardActions, Typography, Button, 
  Chip, Box, Tooltip, Snackbar, Alert, CircularProgress 
} from '@mui/material';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Favorite, FavoriteBorderOutlined } from '@mui/icons-material';

import { cartService } from '../api/cartServices';
import userService from '../api/userService';
import { adsService } from '../api/adsService';
import { imgBagOrange } from '../assets/media';
import {
  FAVORITES_UPDATED,
  isProductFavorite,
  setProductFavorite
} from '../utils/favoritesStore';
import { salePriceOf } from '../utils/price';
import { money } from '../utils/currency';

const FALLBACK_IMAGE = imgBagOrange;

export const PRODUCT_CARD_WIDTH = 280;
/** Kare görsel (280) + içerik + buton */
export const PRODUCT_CARD_HEIGHT = 540;
/** Mobilde ızgarayla aynı: iki eşit kart. Geniş ekranda sabit kart. */
export const productCardSlotSx = {
  flex: { xs: '0 0 calc((100% - 12px) / 2)', md: `0 0 ${PRODUCT_CARD_WIDTH}px` },
  width: { xs: 'calc((100% - 12px) / 2)', md: `${PRODUCT_CARD_WIDTH}px` },
  maxWidth: '100%',
  minWidth: 0,
  scrollSnapAlign: 'start'
};

export const productCardGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(2, minmax(0, 1fr))',
    sm: 'repeat(auto-fill, minmax(200px, 1fr))',
    md: 'repeat(auto-fill, minmax(240px, 1fr))',
    lg: 'repeat(auto-fill, minmax(260px, 1fr))'
  },
  justifyContent: 'stretch',
  gap: { xs: 1.5, sm: 2, md: 3 },
  '& > *': { minWidth: 0 }
};

export default function ProductCard({ product, fullWidth = false, compact = false, brief = false }) {
  const fluid = fullWidth || compact || brief;
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();
  
  // State'ler
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [isFavorite, setIsFavorite] = useState(false); // BaÅŸlangÄ±Ã§ta false
  const [favLoading, setFavLoading] = useState(false);
  const [descClipped, setDescClipped] = useState(false);
  const descRef = useRef(null);

  const id = product?._id || product?.id;
  const href = `/urun/${encodeURIComponent(product?.slug || id || '')}`;
  const title = product?.title || product?.baslik || t('card.untitled', { ns: 'catalog' });
  const image = product?.image || product?.resimUrl || (product?.images && product.images[0]) || FALLBACK_IMAGE;
  const description = product?.description || product?.aciklama || t('card.defaultDescription', { ns: 'catalog' });
  const price = product?.price || product?.fiyat || 0;
  const category = categoryLabel(product?.category || product?.kategori, t) || t('card.atelier', { ns: 'catalog' });
  const finalPrice = salePriceOf(product);

  useEffect(() => {
    if (!id) return undefined;

    const sync = () => setIsFavorite(isProductFavorite(id));
    sync();

    const onUpdate = () => sync();
    window.addEventListener(FAVORITES_UPDATED, onUpdate);
    return () => window.removeEventListener(FAVORITES_UPDATED, onUpdate);
  }, [id]);

  useLayoutEffect(() => {
    const node = descRef.current;
    if (!node) return;
    setDescClipped(node.scrollHeight > node.clientHeight + 1);
  }, [description]);

  const handleCardClick = () => {
    if (!id) return;
    adsService.track({
      type: 'click',
      surface: product?.isSponsored ? 'featured' : 'product',
      product: id,
      seller: product?.seller
    });
    navigate(href);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const payload = { productId: id, name: title, price: finalPrice, image: image, quantity: 1 };
      const response = await cartService.addToCart(payload);
      
      if (response.success) {
        setToast({ open: true, message: t('card.added', { ns: 'catalog' }), severity: 'success' });
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      if (error.mesaj === 'Yetkisiz eriÅŸim, token bulunamadÄ±.' || error.status === 401) {
        setToast({ open: true, message: t('card.loginToCart', { ns: 'catalog' }), severity: 'warning' });
      } else {
        setToast({ open: true, message: t('card.addFailed', { ns: 'catalog' }), severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- FAVORÄ° EKLE/Ã‡IKAR FONKSÄ°YONU ---
  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (favLoading || !id) return;

    setFavLoading(true);
    try {
      if (isFavorite) {
        await userService.removeFavorite(id);
        setProductFavorite(id, false);
        setToast({ open: true, message: t('card.favRemoved', { ns: 'catalog' }), severity: 'info' });
      } else {
        try {
          await userService.addFavorite(id);
        } catch (addError) {
          if (addError?.response?.status !== 400) throw addError;
        }
        setProductFavorite(id, true);
        setToast({ open: true, message: t('card.favAdded', { ns: 'catalog' }), severity: 'success' });
      }
    } catch (error) {
      if (error.response?.status === 401 || error.message?.includes('token') || error.message?.includes('GiriÅŸ')) {
        setToast({ open: true, message: t('card.loginToFav', { ns: 'catalog' }), severity: 'warning' });
      } else {
        setToast({ open: true, message: error.response?.data?.message || t('card.failed', { ns: 'catalog' }), severity: 'error' });
      }
    } finally {
      setFavLoading(false);
    }
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') return;
    setToast({ ...toast, open: false });
  };

  const clampSx = (lines, height) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-word',
    height,
    lineHeight: 1.3,
    '&&': {
      display: '-webkit-box',
      WebkitLineClamp: lines,
      WebkitBoxOrient: 'vertical'
    }
  });

  return (
    <>
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Card 
        onClick={handleCardClick}
        sx={{ 
          width: fluid ? '100%' : PRODUCT_CARD_WIDTH,
          minWidth: fluid ? 0 : PRODUCT_CARD_WIDTH,
          maxWidth: fluid ? '100%' : PRODUCT_CARD_WIDTH,
          height: fluid ? 'auto' : PRODUCT_CARD_HEIGHT,
          minHeight: compact || brief ? 0 : fullWidth ? { xs: 0, md: PRODUCT_CARD_HEIGHT } : PRODUCT_CARD_HEIGHT,
          maxHeight: fluid ? 'none' : PRODUCT_CARD_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: compact || brief ? '18px' : '22px',
          cursor: 'pointer',
          backgroundColor: '#FFFFFF !important',
          border: '1px solid rgba(148, 109, 109, 0.15)',
          boxShadow: '0 10px 25px -5px rgba(46, 59, 85, 0.08)',
          transition: 'transform .4s cubic-bezier(.22,.61,.36,1), box-shadow 0.35s ease, border-color 0.3s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 22px 38px -12px rgba(148, 109, 109, 0.28)',
            borderColor: '#946D6D'
          },
          ...(compact ? {
            boxShadow: '0 6px 16px -8px rgba(46, 59, 85, 0.18)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 16px 28px -14px rgba(148, 109, 109, 0.4)',
              borderColor: '#946D6D'
            }
          } : null),
          boxSizing: 'border-box'
        }}
      >
        <Box sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          flexShrink: 0,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF'
        }}>
          <Box
            sx={{
              position: 'absolute',
              inset: compact ? 8 : { xs: 10, sm: 14 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CardMedia
              component="img"
              image={image}
              alt={title}
              loading="lazy"
              decoding="async"
              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block',
                transition: 'transform .55s cubic-bezier(.22,.61,.36,1)',
                '.MuiCard-root:hover &': { transform: 'scale(1.04)' }
              }}
            />
          </Box>
          <Box sx={{ position: 'absolute', top: 10, left: 10, maxWidth: 'calc(100% - 52px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.6, zIndex: 1 }}>
            {product?.isSponsored ? (
              <Chip
                icon={<AutoAwesomeOutlined sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                label={t('card.featured', { ns: 'catalog' })}
                size="small"
                sx={{
                  backgroundColor: '#2E3B55',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(46,59,85,0.28)',
                  '& .MuiChip-label': { px: 0.8 }
                }}
              />
            ) : null}
            {compact || brief ? null : (
            <Tooltip title={category} arrow placement="top" enterDelay={200}>
              <Chip
                label={category}
                size="small"
                sx={{
                  maxWidth: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#2E3B55',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  textTransform: 'capitalize',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '& .MuiChip-label': {
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    px: 1
                  }
                }}
              />
            </Tooltip>
            )}
          </Box>
          
          {/* FAVORÄ° BUTONU (KALP) */}
          <Box 
            onClick={handleToggleFavorite} 
            sx={{ 
                position: 'absolute', top: 8, right: 8, zIndex: 1, width: compact ? 32 : 40, height: compact ? 32 : 40, borderRadius: '50%', 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', cursor: favLoading ? 'wait' : 'pointer', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                color: isFavorite ? '#D32F2F' : '#6E5252', 
                transition: 'all 0.2s ease',
                '&:hover': { 
                    backgroundColor: isFavorite ? '#B71C1C' : '#946D6D', 
                    color: '#FFF'
                } 
            }}
          >
            {favLoading ? (
                <CircularProgress size={16} color="inherit" />
            ) : isFavorite ? (
                <Favorite sx={{ fontSize: '18px', color: 'inherit' }} />
            ) : (
                <FavoriteBorderOutlined sx={{ fontSize: '18px', color: 'inherit' }} />
            )}
          </Box>
        </Box>

        <CardContent sx={{ p: compact || brief ? 1.25 : 2, '&:last-child': { pb: compact || brief ? 1.25 : 2 }, flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF' }}>
          <Box>
            {/* BaÅŸlÄ±k gerÃ§ek bir baÄŸlantÄ±: arama motorlarÄ± Ã¼rÃ¼n sayfalarÄ±nÄ± buradan keÅŸfeder */}
            <Box component="h3" sx={{ m: 0 }}>
              <Tooltip title={title} arrow placement="top" enterDelay={200}>
                <Box
                  component={LocaleLink}
                  to={id ? href : '/urunler'}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    color: '#2E3B55',
                    fontWeight: 800,
                    fontSize: compact || brief ? '0.82rem' : '0.92rem',
                    textDecoration: 'none',
                    ...clampSx(brief ? 1 : 2, brief ? '1.3em' : '2.6em')
                  }}
                >
                  {title}
                </Box>
              </Tooltip>
            </Box>
            <Box sx={{ position: 'relative', mt: brief ? 0.45 : 0.8, display: compact ? 'none' : 'block' }}>
              <Box
                ref={descRef}
                sx={{
                  fontSize: '0.75rem',
                  color: '#6E5252',
                  pr: descClipped && !brief ? 2.6 : 0,
                  ...clampSx(brief ? 1 : 2, brief ? '1.3em' : '2.6em')
                }}
              >
                {description}
              </Box>
              {descClipped && !brief ? (
                <Tooltip
                  title={description}
                  arrow
                  placement="top"
                  enterDelay={120}
                  enterTouchDelay={0}
                  slotProps={{
                    tooltip: {
                      sx: {
                        maxWidth: 280,
                        bgcolor: '#2E3B55',
                        color: '#FDF4D2',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        lineHeight: 1.55,
                        px: 1.4,
                        py: 1,
                        borderRadius: '12px'
                      }
                    }
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    aria-label={t('card.moreDescription', { ns: 'catalog' })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    sx={{
                      position: 'absolute',
                      right: 0,
                      bottom: -1,
                      width: 22,
                      height: 22,
                      p: 0,
                      border: 0,
                      borderRadius: '999px',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'help',
                      fontFamily: 'inherit',
                      color: '#946D6D',
                      bgcolor: 'rgba(253,244,210,0.95)',
                      boxShadow: '-12px 0 12px #FFFFFF',
                      '&:hover': { bgcolor: '#946D6D', color: '#FDF4D2' }
                    }}
                  >
                    <InfoOutlined sx={{ fontSize: 15 }} />
                  </Box>
                </Tooltip>
              ) : null}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.6, mt: compact ? 0.6 : 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 700, fontSize: { xs: '0.62rem', sm: '0.7rem' }, whiteSpace: 'nowrap', display: compact || brief ? 'none' : { xs: 'none', sm: 'inline' } }}>{t('card.specialPrice', { ns: 'catalog' })}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0, ml: compact ? 0 : 'auto' }}>
              {product?.discountPercentage > 0 && (
                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#B0CDE6', fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>{money(price, { tryPrefix: true })}</Typography>
              )}
              <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', fontSize: compact ? '0.95rem' : { xs: '1rem', sm: '1.15rem' }, whiteSpace: 'nowrap' }}>{money(finalPrice, { tryPrefix: true })}</Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ px: compact || brief ? 1.25 : { xs: 1.2, sm: 2 }, pb: compact || brief ? 1.25 : { xs: 1.4, sm: 2 }, pt: 0, flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <Button 
            fullWidth variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ShoppingBagOutlined sx={{ display: compact ? 'none' : { xs: 'none', sm: 'inline-flex' } }} />} 
            onClick={handleAddToCart} 
            sx={{ borderRadius: compact || brief ? '10px' : '12px', py: compact || brief ? 0.55 : { xs: 0.85, sm: 1 }, backgroundColor: compact || brief ? '#2E3B55' : '#A290B7', color: '#FFFFFF', fontWeight: 700, fontSize: compact || brief ? '0.72rem' : { xs: '0.72rem', sm: '0.82rem' }, boxShadow: 'none', '&:hover': { backgroundColor: '#946D6D' } }}
          >
            {loading ? t('card.adding', { ns: 'catalog' }) : t('card.addToCart', { ns: 'catalog' })}
          </Button>
        </CardActions>
      </Card>
    </>
  );
}
