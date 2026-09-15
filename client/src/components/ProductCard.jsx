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
import { formatTRY, salePriceOf } from '../utils/price';

const FALLBACK_IMAGE = imgBagOrange;

export const PRODUCT_CARD_WIDTH = 280;
export const PRODUCT_CARD_HEIGHT = 460;

export const productCardGridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  justifyContent: 'stretch',
  gap: { xs: 2, md: 3 },
  '& > *': { minWidth: 0 }
};

export default function ProductCard({ product, fullWidth = false }) {
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
    navigate(`/urun/${id}`);
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
          width: fullWidth ? '100%' : PRODUCT_CARD_WIDTH,
          minWidth: fullWidth ? 0 : PRODUCT_CARD_WIDTH,
          maxWidth: fullWidth ? '100%' : PRODUCT_CARD_WIDTH,
          height: fullWidth ? 'auto' : PRODUCT_CARD_HEIGHT,
          minHeight: fullWidth ? { xs: 0, md: PRODUCT_CARD_HEIGHT } : PRODUCT_CARD_HEIGHT,
          maxHeight: fullWidth ? 'none' : PRODUCT_CARD_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '22px',
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
          boxSizing: 'border-box'
        }}
      >
        <Box sx={{
          position: 'relative',
          height: fullWidth ? { xs: 140, sm: 170, md: 190 } : 190,
          minHeight: fullWidth ? { xs: 140, sm: 170, md: 190 } : 190,
          maxHeight: fullWidth ? { xs: 140, sm: 170, md: 190 } : 190,
          width: '100%',
          flexShrink: 0,
          overflow: 'hidden',
          backgroundColor: '#F8F5F0'
        }}>
          <CardMedia component="img" image={image} alt={title}
            loading="lazy"
            decoding="async"
            onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
            sx={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
              transition: 'transform .55s cubic-bezier(.22,.61,.36,1)',
              '.MuiCard-root:hover &': { transform: 'scale(1.06)' }
            }}
          />
          <Box sx={{ position: 'absolute', top: 10, left: 10, maxWidth: 'calc(100% - 52px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.6 }}>
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
          </Box>
          
          {/* FAVORÄ° BUTONU (KALP) */}
          <Box 
            onClick={handleToggleFavorite} 
            sx={{ 
                position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', 
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

        <CardContent sx={{ p: 2, flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF' }}>
          <Box>
            {/* BaÅŸlÄ±k gerÃ§ek bir baÄŸlantÄ±: arama motorlarÄ± Ã¼rÃ¼n sayfalarÄ±nÄ± buradan keÅŸfeder */}
            <Box component="h3" sx={{ m: 0 }}>
              <Tooltip title={title} arrow placement="top" enterDelay={200}>
                <Box
                  component={LocaleLink}
                  to={id ? `/urun/${id}` : '/urunler'}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    color: '#2E3B55',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    ...clampSx(2, '2.6em')
                  }}
                >
                  {title}
                </Box>
              </Tooltip>
            </Box>
            <Box sx={{ position: 'relative', mt: 0.8 }}>
              <Box
                ref={descRef}
                sx={{
                  fontSize: '0.75rem',
                  color: '#6E5252',
                  pr: descClipped ? 2.6 : 0,
                  ...clampSx(2, '2.6em')
                }}
              >
                {description}
              </Box>
              {descClipped ? (
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 700, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{t('card.specialPrice', { ns: 'catalog' })}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
              {product?.discountPercentage > 0 && (
                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#B0CDE6', fontWeight: 600, whiteSpace: 'nowrap' }}>₺{formatTRY(price)}</Typography>
              )}
              <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', fontSize: '1.15rem', whiteSpace: 'nowrap' }}>₺{formatTRY(finalPrice)}</Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2, pt: 0, flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          <Button 
            fullWidth variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ShoppingBagOutlined />} 
            onClick={handleAddToCart} 
            sx={{ borderRadius: '12px', py: 1, backgroundColor: '#A290B7', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', boxShadow: 'none', '&:hover': { backgroundColor: '#946D6D' } }}
          >
            {loading ? t('card.adding', { ns: 'catalog' }) : t('card.addToCart', { ns: 'catalog' })}
          </Button>
        </CardActions>
      </Card>
    </>
  );
}
