

import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Button, IconButton, Skeleton,
  Modal, Chip, Snackbar, Alert
} from '@mui/material';
import CardGiftcard from '@mui/icons-material/CardGiftcard';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ArrowBackIosNewOutlined from '@mui/icons-material/ArrowBackIosNewOutlined';
import ArrowForwardIosOutlined from '@mui/icons-material/ArrowForwardIosOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../api/cartServices';

import {
  videoHero,
  imgBagOrange,
  imgBanner1,
  imgBanner2,
  imgBanner3,
  imgBanner4
} from '../assets/media';
import { productService } from '../api/productService';

const LOCAL_HERO_SLIDES = [
  { _id: 'hero-video', type: 'video', url: videoHero, poster: imgBanner1 },
  { _id: 'hero-banner1', url: imgBanner1 },
  { _id: 'hero-banner2', url: imgBanner2 },
  { _id: 'hero-banner3', url: imgBanner3 },
  { _id: 'hero-banner4', url: imgBanner4 }
];

export default function HeroBanner({ user, onNavigateAuth }) {
  const navigate = useNavigate();
  const [heroImages] = useState(LOCAL_HERO_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slide = heroImages[currentIndex];

  const stageRef = useRef(null);
  const [inView, setInView] = useState(true);

  // Hero ekrandan çıkınca slayt döngüsü durur, boşuna kare harcanmaz
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (heroImages.length <= 1 || !inView) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, slide?.type === 'video' ? 11000 : 7000);
    return () => clearInterval(timer);
  }, [heroImages.length, currentIndex, slide?.type, inView]);

  // Sıradaki görseli sessizce önden indir, geçiş anında bekleme olmasın
  useEffect(() => {
    const next = heroImages[(currentIndex + 1) % heroImages.length];
    if (!next || next.type === 'video' || !next.url) return;
    const preloader = new Image();
    preloader.src = next.url;
  }, [currentIndex, heroImages]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);

  // SPONSORLU ÜRÜNLER MODAL STATE'LERİ
  const reducedMotion = useReducedMotion();
  const [openSponsoredModal, setOpenSponsoredModal] = useState(false);
  const [sponsoredProducts, setSponsoredProducts] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Modaldan doğrudan sepete ekleme
  const handleQuickAdd = async (event, product) => {
    event.stopPropagation();
    const productId = product._id || product.id;
    if (!productId || addingId) return;

    const discount = Number(product.discountPercentage || 0);
    const listPrice = Number(product.price || 0);
    const finalPrice = discount > 0 ? listPrice - (listPrice * discount) / 100 : listPrice;

    setAddingId(productId);
    try {
      const response = await cartService.addToCart({
        productId,
        name: product.title || product.name,
        price: finalPrice,
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

  const handleOpenSponsored = async () => {
    setOpenSponsoredModal(true);
    setModalLoading(true);
    try {
      const response = await productService.getSponsoredProducts();
      if (response.success && response.products && response.products.length > 0) {
        setSponsoredProducts(response.products);
      } else {
        setSponsoredProducts([
          {
            _id: '65f1a2b3c4d5e6f7a8b9c0d1',
            title: 'El Şekillendirme Seramik Vazo',
            price: 450,
            image: imgBagOrange
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <Box
      ref={stageRef}
      sx={{
        position: 'relative',
        width: '100%',
        // Altın bölüm + pay; ilk ekranda alttaki bölümün başlığı görünsün
        height: 'min(calc(100svh / 1.6180339887 + 156px), calc(100svh - 108px))',
        minHeight: { xs: 520, md: 'unset' },
        mt: 0,
        mb: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'flex-end',
        overflow: 'hidden',
        backgroundColor: '#1E2738'
      }}
    >
      {/* 1. TÜM SAYFAYI KAPLAYAN ARKA PLAN GÖRSELİ */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.7, ease: 'easeOut' }, scale: { duration: 7, ease: 'linear' } }}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, willChange: 'opacity, transform' }}
        >
          {slide?.type === 'video' ? (
            <Box
              component="video"
              src={slide.url}
              poster={slide.poster || imgBagOrange}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              preload="metadata"
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover',
                objectPosition: 'center center',
                display: 'block'
              }}
            />
          ) : (
            <Box
              component="img"
              src={slide?.url}
              alt="Nik Bag Koleksiyon"
              decoding="async"
              fetchPriority={currentIndex === 0 ? 'high' : 'low'}
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover',
                objectPosition: 'center center',
                display: 'block'
              }}
            />
          )}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: {
                xs: 'linear-gradient(180deg, rgba(30, 39, 56, 0.18) 0%, rgba(30, 39, 56, 0.08) 38%, rgba(30, 39, 56, 0.72) 100%)',
                md: 'linear-gradient(180deg, rgba(30, 39, 56, 0.22) 0%, rgba(30, 39, 56, 0.05) 42%, rgba(30, 39, 56, 0.42) 100%)'
              },
              zIndex: 1
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* 2. SOL KART İÇERİĞİ (BOYUTU MİNİMALİZE EDİLDİ) */}
      <Box
        sx={{
          position: 'absolute',
          left: { xs: 16, md: 40 },
          right: { xs: 16, md: 'auto' },
          bottom: { xs: 64, md: 44 },
          zIndex: 5,
          width: { xs: 'auto', md: 380 },
          maxWidth: 400
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ width: '100%' }}
        >
          <Box
            sx={{
              p: { xs: 2, sm: 2.75 },
              borderRadius: '20px',
              backgroundColor: 'rgba(253, 244, 210, 0.78)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              boxShadow: '0 15px 30px rgba(0,0,0,0.12)'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#A290B7',
                fontWeight: 800,
                mb: 1,
                display: 'block',
                fontSize: '0.75rem', // Font boyutu küçültüldü
                letterSpacing: '2.5px',
                textTransform: 'uppercase'
              }}
            >
              Özel Koleksiyon
            </Typography>

            <Typography
              variant="h1"
              sx={{
                color: '#946D6D',
                mb: 1.5,
                fontSize: { xs: '2rem', sm: '2.6rem', md: '3.3rem' },
                fontWeight: 800,
                letterSpacing: '-1px',
                lineHeight: 1.05
              }}
            >
              Nik Bag.
              <Box
                component="span"
                sx={{
                  display: 'block',
                  mt: 0.6,
                  color: '#2E3B55',
                  fontSize: { xs: '0.82rem', md: '0.95rem' },
                  fontWeight: 700,
                  letterSpacing: '0.2px',
                  lineHeight: 1.35
                }}
              >
                El yapımı çanta ve tasarım atölyesi
              </Box>
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#6E5252',
                fontWeight: 500,
                mb: 2.5,
                fontSize: { xs: '0.85rem', md: '0.95rem' }, // Metin boyutu küçültüldü
                lineHeight: 1.5
              }}
            >
              {!user
                ? 'Geleneksel el işçiliğiyle modern çizgilerin buluştuğu eşsiz tasarımlar. Kayıt olarak size özel indirim kuponunu anında kullanın.'
                : 'Atölyemizin en yeni ve seçkin tasarımlarını hemen inceleyin.'}
            </Typography>

            {/* BUTONLAR (MİNİMAL ORANLAR) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, width: '100%' }}>
              <Button
                variant="contained"
                size="medium"
                startIcon={<AutoAwesomeIcon sx={{ color: '#1E2738', fontSize: '18px !important' }} />}
                onClick={handleOpenSponsored}
                fullWidth
                sx={{
                  borderRadius: '12px',
                  py: 1.1,
                  backgroundColor: '#B0CDE6', 
                  color: '#1E2738', 
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  letterSpacing: '0.5px',
                  boxShadow: '0 6px 16px rgba(176, 205, 230, 0.35)',
                  transition: 'all 0.3s',
                  '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF', transform: 'translateY(-2px)' }
                }}
              >
                Önerilen Ürünler
              </Button>

              <Box sx={{ display: 'flex', gap: 1.2 }}>
                {!user && (
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<CardGiftcard sx={{ fontSize: '18px !important' }} />}
                    onClick={onNavigateAuth}
                    fullWidth
                    sx={{
                      borderRadius: '12px',
                      py: 1,
                      backgroundColor: '#946D6D',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      boxShadow: 'none',
                      transition: 'all 0.3s',
                      '&:hover': { backgroundColor: '#A290B7' }
                    }}
                  >
                    Kayıt Ol
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="medium"
                  endIcon={<ArrowForward sx={{ fontSize: '18px !important' }} />}
                  onClick={() => navigate('/products')}
                  fullWidth
                  sx={{
                    borderRadius: '12px',
                    py: 1,
                    borderColor: '#A290B7',
                    color: '#946D6D',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    transition: 'all 0.3s',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    '&:hover': {
                      backgroundColor: '#A290B7',
                      color: '#FFFFFF',
                      borderColor: '#A290B7',
                    }
                  }}
                >
                  Keşfet
                </Button>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* 3. SAĞ ALT SLIDER YÖNLENDİRME BUTONLARI */}
      {heroImages.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: { xs: 18, md: 28 }, right: { xs: 14, md: 32 }, display: { xs: 'none', sm: 'flex' }, gap: 1, zIndex: 10 }}>
          <IconButton onClick={handlePrev} sx={{ width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, backgroundColor: 'rgba(253, 244, 210, 0.85)', color: '#946D6D', backdropFilter: 'blur(8px)', transition: 'all 0.3s', '&:hover': { backgroundColor: '#B0CDE6', color: '#1E2738' } }}>
            <ArrowBackIosNewOutlined sx={{ fontSize: '16px' }} />
          </IconButton>
          <IconButton onClick={handleNext} sx={{ width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, backgroundColor: '#A290B7', color: '#FFFFFF', transition: 'all 0.3s', '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF' } }}>
            <ArrowForwardIosOutlined sx={{ fontSize: '16px' }} />
          </IconButton>
        </Box>
      )}

      {/* 4. RESMİN ALT ORTASINDAKİ NAVİGASYON BARI */}
      {heroImages.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: { xs: 16, md: 22 },
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            zIndex: 10,
            px: 2,
            py: 1,
            borderRadius: '50px',
            backgroundColor: 'rgba(30, 39, 56, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          {heroImages.map((img, idx) => (
            <Box
              key={img._id || idx}
              onClick={() => setCurrentIndex(idx)}
              sx={{
                width: currentIndex === idx ? 30 : 10,
                height: 7,
                borderRadius: '10px',
                backgroundColor: currentIndex === idx ? '#FDF4D2' : 'rgba(253, 244, 210, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: currentIndex === idx ? '0 0 10px rgba(253, 244, 210, 0.8)' : 'none',
                '&:hover': {
                  backgroundColor: currentIndex === idx ? '#FDF4D2' : 'rgba(253, 244, 210, 0.65)',
                  transform: 'scale(1.1)'
                }
              }}
            />
          ))}
        </Box>
      )}

      {/* 5. ÖNERİLEN ÜRÜNLER MODALI */}
      <Modal
        open={openSponsoredModal}
        onClose={() => setOpenSponsoredModal(false)}
        aria-labelledby="sponsored-modal-title"
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
          {/* Başlık bandı */}
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
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0.35,
                background:
                  'radial-gradient(520px 200px at 88% -30%, rgba(176,205,230,0.75), transparent 70%), radial-gradient(420px 200px at 5% 130%, rgba(162,144,183,0.7), transparent 70%)',
                pointerEvents: 'none'
              }}
            />
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
                    SEÇKİ
                  </Typography>
                </Box>
                <Typography
                  id="sponsored-modal-title"
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.7px',
                    lineHeight: 1.12,
                    fontSize: { xs: '1.3rem', sm: '1.7rem', md: '1.95rem' }
                  }}
                >
                  Öne çıkan atölye tasarımları
                </Typography>
                <Typography sx={{ mt: 1, maxWidth: 520, color: 'rgba(255,255,255,0.82)', fontWeight: 500, fontSize: { xs: '0.83rem', md: '0.92rem' } }}>
                  Partner zanaatkârlarımızın sınırlı sayıda ürettiği parçalar. Beğendiğinizi doğrudan sepete ekleyebilirsiniz.
                </Typography>
              </Box>

              <IconButton
                onClick={() => setOpenSponsoredModal(false)}
                aria-label="Kapat"
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

          {/* Ürün listesi */}
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
              {modalLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Box key={`skeleton-${index}`} sx={{ borderRadius: '20px', overflow: 'hidden', bgcolor: '#fff', border: '1px solid rgba(148,109,109,0.12)' }}>
                      <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '4 / 3' }} />
                      <Box sx={{ p: 1.8 }}>
                        <Skeleton width="45%" height={14} />
                        <Skeleton width="85%" height={22} sx={{ mt: 0.8 }} />
                        <Skeleton width="55%" height={30} sx={{ mt: 1.4 }} />
                      </Box>
                    </Box>
                  ))
                : sponsoredProducts.map((product, index) => {
                    const productId = product._id || product.id;
                    const productTitle = product.title || product.name;
                    const discount = Number(product.discountPercentage || 0);
                    const listPrice = Number(product.price || 0);
                    const finalPrice = discount > 0 ? listPrice - (listPrice * discount) / 100 : listPrice;
                    const cover = product.image || (product.images && product.images[0]) || imgBagOrange;

                    return (
                      <Box
                        key={productId}
                        component={motion.div}
                        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.34, delay: 0.06 * index, ease: [0.22, 0.61, 0.36, 1] }}
                        onClick={() => {
                          setOpenSponsoredModal(false);
                          navigate(`/product/${productId}`);
                        }}
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
                          },
                          '&:hover .sponsored-cover': { transform: 'scale(1.07)' }
                        }}
                      >
                        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', backgroundColor: '#F2EADF' }}>
                          <Box
                            className="sponsored-cover"
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
                              objectFit: 'cover',
                              display: 'block',
                              transition: 'transform .55s cubic-bezier(.22,.61,.36,1)'
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
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              color: '#946D6D',
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              letterSpacing: 0.4
                            }}
                          >
                            <AutoAwesomeIcon sx={{ fontSize: '13px !important' }} /> Sponsorlu
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
                              ₺{finalPrice.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                            </Typography>
                            {discount > 0 && (
                              <Typography sx={{ color: '#9C8B8B', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'line-through' }}>
                                ₺{listPrice.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
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
                            {addingId === productId ? 'Ekleniyor…' : 'Sepete ekle'}
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
            </Box>

            {!modalLoading && sponsoredProducts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: '#2E3B55', fontWeight: 800, mb: 0.6 }}>Şu an öne çıkan ürün yok</Typography>
                <Typography sx={{ color: '#6E5252', fontWeight: 500, fontSize: '0.9rem' }}>
                  Koleksiyonun tamamına göz atarak yeni tasarımları keşfedebilirsiniz.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Alt bar */}
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
              Sınırlı sayıda üretim, stoklarla sınırlıdır.
            </Typography>
            <Button
              endIcon={<ArrowForward />}
              onClick={() => {
                setOpenSponsoredModal(false);
                navigate('/products');
              }}
              sx={{
                fontWeight: 800,
                color: '#2E3B55',
                borderRadius: '12px',
                px: 2,
                '&:hover': { backgroundColor: 'rgba(46,59,85,0.06)' }
              }}
            >
              Tüm koleksiyonu gör
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

    </Box>
  );
}