

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, IconButton, CircularProgress,
  Modal, Grid, Card, CardMedia, CardContent, Chip
} from '@mui/material';
import CardGiftcard from '@mui/icons-material/CardGiftcard';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ArrowBackIosNewOutlined from '@mui/icons-material/ArrowBackIosNewOutlined';
import ArrowForwardIosOutlined from '@mui/icons-material/ArrowForwardIosOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Sabit yedek görselimiz
import main1 from '../../public/main1.jpeg';
import { bannerService } from '../api/bannerService';
import { productService } from '../api/productService'; 

export default function HeroBanner({ user, onNavigateAuth }) {
  const navigate = useNavigate();
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // SPONSORLU ÜRÜNLER MODAL STATE'LERİ
  const [openSponsoredModal, setOpenSponsoredModal] = useState(false);
  const [sponsoredProducts, setSponsoredProducts] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // 1. API'DEN BANNER GÖRSELLERİNİ ÇEKME
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const data = await bannerService.getActiveBanners();
        if (data && data.length > 0) {
          setHeroImages(data);
        } else {
          setHeroImages([{ _id: 'default', url: main1 }]);
        }
      } catch (error) {
        console.error("Banner resimleri getirilirken hata oluştu:", error);
        setHeroImages([{ _id: 'default', url: main1 }]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // 2. OTOMATİK AKICI GEÇİŞ
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroImages]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);

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
            image: main1
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ position: 'relative', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', height: '80vh', minHeight: '580px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDF4D2' }}>
        <CircularProgress sx={{ color: '#946D6D' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100vw',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        height: { xs: '70vh', md: '80vh' },
        minHeight: '520px',
        mt: 0,
        mb: 6,
        display: 'flex',
        alignItems: 'center',
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
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        >
          <Box
            component="img"
            src={heroImages[currentIndex]?.url}
            alt="Nik Bag Koleksiyon"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(30, 39, 56, 0.75) 0%, rgba(30, 39, 56, 0.3) 50%, rgba(0,0,0,0) 100%)',
              zIndex: 1
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* 2. SOL KART İÇERİĞİ (BOYUTU MİNİMALİZE EDİLDİ) */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '1200px',
          mx: 'auto',
          px: { xs: 2.5, sm: 5, md: 7 }
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ maxWidth: '420px' }} // Maksimum genişlik 500px'den 420px'e düşürüldü
        >
          <Box
            sx={{
              p: { xs: 2.5, sm: 3.5 }, // İç boşluk küçültüldü
              borderRadius: '20px',
              backgroundColor: 'rgba(253, 244, 210, 0.88)',
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
                fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.3rem' }, // Başlık boyutu küçültüldü
                fontWeight: 800,
                letterSpacing: '-1px',
                lineHeight: 1.05
              }}
            >
              Nik Bag.
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
                  href="#urunler"
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
        <Box sx={{ position: 'absolute', bottom: { xs: 16, md: 24 }, right: { xs: 16, md: 32 }, display: 'flex', gap: 1, zIndex: 10 }}>
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
      >
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '92%', sm: '80%', md: '750px' },
            maxHeight: '90vh',
            overflowY: 'auto',
            bgcolor: '#FDF4D2',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            p: { xs: 3, sm: 4 },
            border: '1.5px solid #A290B7',
            outline: 'none'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ color: '#946D6D' }} />
              <Typography id="sponsored-modal-title" variant="h5" fontWeight="800" sx={{ color: '#1E2738' }}>
                Öne Çıkan Tedarikçi Tasarımları
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenSponsoredModal(false)} sx={{ color: '#946D6D' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="body2" sx={{ color: '#6E5252', mb: 3 }}>
            Seçkin üreticilerimizin ve partner zanaatkarlarımızın öne çıkan özel parçalarını keşfedin.
          </Typography>

          {modalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#946D6D' }} />
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {sponsoredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product._id}>
                  <Card
                    sx={{
                      borderRadius: '16px',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      cursor: 'pointer',
                      position: 'relative',
                      border: '1px solid rgba(148, 109, 109, 0.15)',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 25px rgba(0,0,0,0.12)' }
                    }}
                    onClick={() => {
                      setOpenSponsoredModal(false);
                      navigate(`/product/${product._id}`);
                    }}
                  >
                    <Chip
                      label="Sponsorlu"
                      size="small"
                      icon={<AutoAwesomeIcon style={{ fontSize: '12px', color: '#FFF' }} />}
                      sx={{
                        position: 'absolute', top: 10, right: 10, zIndex: 2,
                        backgroundColor: '#946D6D', color: '#FFF', fontWeight: 700, fontSize: '0.7rem'
                      }}
                    />

                    <CardMedia
                      component="img"
                      height="180"
                      image={product.image || (product.images && product.images[0]) || main1}
                      alt={product.title || product.name}
                      sx={{ objectFit: 'cover' }}
                    />

                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 700, display: 'block', mb: 0.5 }}>
                        {product.vendorName || product.vendor?.name || 'Onaylı Tedarikçi'}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#1E2738', lineHeight: 1.2, mb: 1, height: '2.4em', overflow: 'hidden' }}>
                        {product.title || product.name}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                        <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D' }}>
                          ₺{product.price}
                        </Typography>
                        <IconButton size="small" sx={{ backgroundColor: '#B0CDE6', color: '#1E2738', '&:hover': { backgroundColor: '#946D6D', color: '#FFF' } }}>
                          <ShoppingBagOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Modal>

    </Box>
  );
}