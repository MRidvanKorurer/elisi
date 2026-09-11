

// // import React, { useState } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import {
// //   Card, CardMedia, CardContent, CardActions, Typography, Button,
// //   Chip, Box, Tooltip, Snackbar, Alert, CircularProgress
// // } from '@mui/material';
// // import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
// // import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
// // import { cartService } from '../api/cartServices'; // Backend Sepet Servisi
// // import { Favorite, FavoriteBorderOutlined } from '@mui/icons-material';
// // import userService from '../api/userService';

// // const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80';

// // export default function ProductCard({ product }) {
// //   const navigate = useNavigate();

// //   // Loading ve Toast State'leri
// //   const [loading, setLoading] = useState(false);
// //   const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

// //   const id = product?._id || product?.id;
// //   const title = product?.title || product?.baslik || 'Özel Tasarım Ürün';
// //   const image = product?.image || product?.resimUrl || FALLBACK_IMAGE;
// //   const description = product?.description || product?.aciklama || 'Geleneksel el işçiliği tasarımı.';
// //   const price = product?.price || product?.fiyat || 0;
// //   const category = product?.category || product?.kategori || 'Atölye';

// //   // Mevcut state'lerin altına:
// //   const [isFavorite, setIsFavorite] = useState(false);
// //   const [favLoading, setFavLoading] = useState(false);

// //   // İndirimli fiyat hesaplaması
// //   const finalPrice = product?.discountPercentage > 0
// //     ? (price - (price * (product.discountPercentage / 100)))
// //     : price;

// //   const handleCardClick = () => {
// //     if (id) navigate(`/product/${id}`);
// //   };

// //   // API İLE SEPETE EKLEME FONKSİYONU
// //   const handleAddToCart = async (e) => {
// //     e.stopPropagation(); // Karta tıklanıp detay sayfasına gitmesini engeller

// //     try {
// //       setLoading(true);

// //       const payload = {
// //         productId: id,
// //         name: title,
// //         price: finalPrice,
// //         image: image,
// //         quantity: 1
// //       };

// //       const response = await cartService.addToCart(payload);

// //       if (response.success) {
// //         setToast({ open: true, message: 'Ürün sepete eklendi!', severity: 'success' });

// //         // KRİTİK NOKTA: Navbar'ın sayacı güncellemesi için global bir sinyal yayınlıyoruz
// //         window.dispatchEvent(new Event('cartUpdated'));
// //       }
// //     } catch (error) {
// //       // Hata genelde 401 (Giriş Yapılmamış) olur
// //       if (error.mesaj === 'Yetkisiz erişim, token bulunamadı.' || error.status === 401) {
// //         setToast({ open: true, message: 'Sepete eklemek için giriş yapmalısınız.', severity: 'warning' });
// //       } else {
// //         setToast({ open: true, message: 'Ürün eklenemedi.', severity: 'error' });
// //       }
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleCloseToast = (event, reason) => {
// //     if (reason === 'clickaway') return;
// //     setToast({ ...toast, open: false });
// //   };



// //   const handleToggleFavorite = async (e) => {
// //     e.stopPropagation(); // Kart detayına gitmeyi engelle

// //     // Zaten işlem yapılıyorsa veya id yoksa dur
// //     if (favLoading || !id) return;

// //     setFavLoading(true);
// //     try {
// //       if (isFavorite) {
// //         // Favoriden Çıkar
// //         await userService.removeFavorite(id);
// //         setIsFavorite(false);
// //         setToast({ open: true, message: 'Ürün favorilerden çıkarıldı.', severity: 'info' });
// //       } else {
// //         // Favoriye Ekle
// //         await userService.addFavorite(id);
// //         setIsFavorite(true);
// //         setToast({ open: true, message: 'Ürün favorilere eklendi!', severity: 'success' });
// //       }
// //     } catch (error) {
// //       if (error.response?.status === 401 || error.message.includes('token')) {
// //         setToast({ open: true, message: 'Favorilere eklemek için giriş yapmalısınız.', severity: 'warning' });
// //       } else {
// //         setToast({ open: true, message: 'İşlem başarısız oldu.', severity: 'error' });
// //       }
// //     } finally {
// //       setFavLoading(false);
// //     }
// //   };

// //   return (
// //     <>
// //       {/* BAŞARI/HATA BİLDİRİMİ */}
// //       <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
// //         <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 600 }}>
// //           {toast.message}
// //         </Alert>
// //       </Snackbar>

// //       <Card
// //         onClick={handleCardClick}
// //         sx={{
// //           width: 260, minWidth: 260, maxWidth: 260, height: 440,
// //           display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
// //           overflow: 'hidden', borderRadius: '24px', cursor: 'pointer',
// //           backgroundColor: '#FFFFFF !important', border: '1px solid rgba(148, 109, 109, 0.15)',
// //           boxShadow: '0 10px 25px -5px rgba(46, 59, 85, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
// //           transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
// //           '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 35px -10px rgba(148, 109, 109, 0.22)', borderColor: '#946D6D' },
// //           boxSizing: 'border-box', mx: 'auto'
// //         }}
// //       >
// //         {/* 1. GÖRSEL ALANI */}
// //         <Box sx={{ position: 'relative', height: 190, minHeight: 190, width: '100%', overflow: 'hidden', backgroundColor: '#F8F5F0' }}>
// //           <CardMedia component="img" height="190" image={image} alt={title}
// //             onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
// //             sx={{ objectFit: 'cover', width: '100%', height: '100%', transition: 'transform 0.5s ease', '&:hover': { transform: 'scale(1.06)' } }}
// //           />
// //           <Chip label={category} size="small" sx={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#2E3B55', fontWeight: 800, fontSize: '0.7rem', textTransform: 'capitalize', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
// //           <Box onClick={(e) => { e.stopPropagation(); }} sx={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', '&:hover': { backgroundColor: '#946D6D', color: '#FFF' } }}>
// //             <FavoriteBorderOutlined sx={{ fontSize: '18px', color: 'inherit' }} />
// //           </Box>
// //         </Box>

// //         {/* 2. İÇERİK ALANI */}
// //         <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF' }}>
// //           <Box>
// //             <Tooltip title={title} arrow placement="top">
// //               <Typography variant="h6" fontWeight="800" sx={{ color: '#2E3B55', fontSize: '0.92rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', height: '2.6em' }}>
// //                 {title}
// //               </Typography>
// //             </Tooltip>
// //             <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6E5252', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', mt: 0.8, height: '1.4em' }}>
// //               {description}
// //             </Typography>
// //           </Box>
// //           <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 1 }}>
// //             <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 700, fontSize: '0.7rem' }}>ÖZEL FİYAT</Typography>
// //             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
// //               {product?.discountPercentage > 0 && (
// //                 <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#B0CDE6', fontWeight: 600 }}>₺{price}</Typography>
// //               )}
// //               <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', fontSize: '1.2rem' }}>₺{finalPrice}</Typography>
// //             </Box>
// //           </Box>
// //         </CardContent>

// //         {/* 3. BUTON ALANI */}
// //         <CardActions sx={{ px: 2, pb: 2, pt: 0, backgroundColor: '#FFFFFF' }}>
// //           <Button
// //             fullWidth variant="contained"
// //             disabled={loading}
// //             startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ShoppingBagOutlined />}
// //             onClick={handleAddToCart}
// //             sx={{ borderRadius: '12px', py: 1, backgroundColor: '#A290B7', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', boxShadow: 'none', '&:hover': { backgroundColor: '#946D6D' } }}
// //           >
// //             {loading ? 'Ekleniyor...' : 'Sepete Ekle'}
// //           </Button>
// //         </CardActions>
// //       </Card>
// //     </>
// //   );
// // }




// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card, CardMedia, CardContent, CardActions, Typography, Button,
//   Chip, Box, Tooltip, Snackbar, Alert, CircularProgress
// } from '@mui/material';
// import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
// import { Favorite, FavoriteBorderOutlined } from '@mui/icons-material';

// import { cartService } from '../api/cartServices';
// import userService from '../api/userService';

// const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80';

// export default function ProductCard({ product }) {
//   const navigate = useNavigate();

//   // State'ler
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
//   // Mevcut Hali: const [isFavorite, setIsFavorite] = useState(false);
//   // Yeni Hali:
//   const [isFavorite, setIsFavorite] = useState(product?.isFavorite || false);
//   const [favLoading, setFavLoading] = useState(false);

//   const id = product?._id || product?.id;
//   const title = product?.title || product?.baslik || 'Özel Tasarım Ürün';
//   const image = product?.image || product?.resimUrl || (product?.images && product.images[0]) || FALLBACK_IMAGE;
//   const description = product?.description || product?.aciklama || 'Geleneksel el işçiliği tasarımı.';
//   const price = product?.price || product?.fiyat || 0;
//   const category = product?.category || product?.kategori || 'Atölye';

//   const finalPrice = product?.discountPercentage > 0
//     ? (price - (price * (product.discountPercentage / 100)))
//     : price;

//   // Sayfa yüklendiğinde veya kullanıcı giriş yaptığında favori kontrolü (Opsiyonel ama önerilir)
//   // Eğer backend'den gelen product objesinin içinde "isFav" gibi bir değer varsa onu da kullanabilirsin.
//   // setIsFavorite(product?.isFavorite || false);

//   const handleCardClick = () => {
//     if (id) navigate(`/product/${id}`);
//   };

//   const handleAddToCart = async (e) => {
//     e.stopPropagation();
//     try {
//       setLoading(true);
//       const payload = { productId: id, name: title, price: finalPrice, image: image, quantity: 1 };
//       const response = await cartService.addToCart(payload);

//       if (response.success) {
//         setToast({ open: true, message: 'Ürün sepete eklendi!', severity: 'success' });
//         window.dispatchEvent(new Event('cartUpdated'));
//       }
//     } catch (error) {
//       if (error.mesaj === 'Yetkisiz erişim, token bulunamadı.' || error.status === 401) {
//         setToast({ open: true, message: 'Sepete eklemek için giriş yapmalısınız.', severity: 'warning' });
//       } else {
//         setToast({ open: true, message: 'Ürün eklenemedi.', severity: 'error' });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- FAVORİ EKLE/ÇIKAR FONKSİYONU ---
//   const handleToggleFavorite = async (e) => {
//     e.stopPropagation();
//     if (favLoading || !id) return;

//     setFavLoading(true);
//     try {
//       if (isFavorite) {
//         await userService.removeFavorite(id);
//         setIsFavorite(false);
//         setToast({ open: true, message: 'Ürün favorilerden çıkarıldı.', severity: 'info' });
//       } else {
//         await userService.addFavorite(id);
//         setIsFavorite(true);
//         setToast({ open: true, message: 'Ürün favorilere eklendi!', severity: 'success' });
//       }
//     } catch (error) {
//       if (error.response?.status === 401 || error.message.includes('token') || error.message.includes('Giriş')) {
//         setToast({ open: true, message: 'Favorilere eklemek için giriş yapmalısınız.', severity: 'warning' });
//       } else {
//         setToast({ open: true, message: error.response?.data?.message || 'İşlem başarısız.', severity: 'error' });
//       }
//     } finally {
//       setFavLoading(false);
//     }
//   };

//   const handleCloseToast = (event, reason) => {
//     if (reason === 'clickaway') return;
//     setToast({ ...toast, open: false });
//   };

//   return (
//     <>
//       <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//         <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 600 }}>
//           {toast.message}
//         </Alert>
//       </Snackbar>

//       <Card
//         onClick={handleCardClick}
//         sx={{
//           width: 260, minWidth: 260, maxWidth: 260, height: 440,
//           display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
//           overflow: 'hidden', borderRadius: '24px', cursor: 'pointer',
//           backgroundColor: '#FFFFFF !important', border: '1px solid rgba(148, 109, 109, 0.15)',
//           boxShadow: '0 10px 25px -5px rgba(46, 59, 85, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
//           transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//           '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 35px -10px rgba(148, 109, 109, 0.22)', borderColor: '#946D6D' },
//           boxSizing: 'border-box', mx: 'auto'
//         }}
//       >
//         <Box sx={{ position: 'relative', height: 190, minHeight: 190, width: '100%', overflow: 'hidden', backgroundColor: '#F8F5F0' }}>
//           <CardMedia component="img" height="190" image={image} alt={title}
//             onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
//             sx={{ objectFit: 'cover', width: '100%', height: '100%', transition: 'transform 0.5s ease', '&:hover': { transform: 'scale(1.06)' } }}
//           />
//           <Chip label={category} size="small" sx={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#2E3B55', fontWeight: 800, fontSize: '0.7rem', textTransform: 'capitalize', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />

//           {/* FAVORİ BUTONU (KALP) */}
//           <Box
//             onClick={handleToggleFavorite}
//             sx={{
//               position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%',
//               backgroundColor: 'rgba(255, 255, 255, 0.95)', display: 'flex', alignItems: 'center',
//               justifyContent: 'center', cursor: favLoading ? 'wait' : 'pointer',
//               boxShadow: '0 2px 8px rgba(0,0,0,0.1)',

//               // Favoriyse belirgin Kırmızı (#D32F2F), değilse gri/kahve tonu (#6E5252)
//               color: isFavorite ? '#D32F2F' : '#6E5252',

//               transition: 'all 0.2s ease',
//               '&:hover': {
//                 // Üzerine gelince favoriyse daha koyu kırmızı, değilse tema rengi
//                 backgroundColor: isFavorite ? '#B71C1C' : '#946D6D',
//                 color: '#FFF',
//                 transform: 'scale(1.1)'
//               }
//             }}
//           >
//             {favLoading ? (
//               <CircularProgress size={16} color="inherit" />
//             ) : isFavorite ? (
//               <Favorite sx={{ fontSize: '18px', color: 'inherit' }} />
//             ) : (
//               <FavoriteBorderOutlined sx={{ fontSize: '18px', color: 'inherit' }} />
//             )}
//           </Box>
//         </Box>

//         <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF' }}>
//           <Box>
//             <Tooltip title={title} arrow placement="top">
//               <Typography variant="h6" fontWeight="800" sx={{ color: '#2E3B55', fontSize: '0.92rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', height: '2.6em' }}>
//                 {title}
//               </Typography>
//             </Tooltip>
//             <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6E5252', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', mt: 0.8, height: '1.4em' }}>
//               {description}
//             </Typography>
//           </Box>
//           <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 1 }}>
//             <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 700, fontSize: '0.7rem' }}>ÖZEL FİYAT</Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               {product?.discountPercentage > 0 && (
//                 <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#B0CDE6', fontWeight: 600 }}>₺{price}</Typography>
//               )}
//               <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', fontSize: '1.2rem' }}>₺{finalPrice}</Typography>
//             </Box>
//           </Box>
//         </CardContent>

//         <CardActions sx={{ px: 2, pb: 2, pt: 0, backgroundColor: '#FFFFFF' }}>
//           <Button
//             fullWidth variant="contained"
//             disabled={loading}
//             startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ShoppingBagOutlined />}
//             onClick={handleAddToCart}
//             sx={{ borderRadius: '12px', py: 1, backgroundColor: '#A290B7', color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', boxShadow: 'none', '&:hover': { backgroundColor: '#946D6D' } }}
//           >
//             {loading ? 'Ekleniyor...' : 'Sepete Ekle'}
//           </Button>
//         </CardActions>
//       </Card>
//     </>
//   );
// }










import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Card, CardMedia, CardContent, CardActions, Typography, Button, 
  Chip, Box, Tooltip, Snackbar, Alert, CircularProgress 
} from '@mui/material';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
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

export const PRODUCT_CARD_WIDTH = 260;
export const PRODUCT_CARD_HEIGHT = 440;

export const productCardGridSx = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, ${PRODUCT_CARD_WIDTH}px)`,
  justifyContent: 'center',
  gap: { xs: 2, md: 3 }
};

export default function ProductCard({ product, fullWidth = false }) {
  const navigate = useNavigate();
  
  // State'ler
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [isFavorite, setIsFavorite] = useState(false); // Başlangıçta false
  const [favLoading, setFavLoading] = useState(false);
  const [descClipped, setDescClipped] = useState(false);
  const descRef = useRef(null);

  const id = product?._id || product?.id;
  const title = product?.title || product?.baslik || 'Özel Tasarım Ürün';
  const image = product?.image || product?.resimUrl || (product?.images && product.images[0]) || FALLBACK_IMAGE;
  const description = product?.description || product?.aciklama || 'Geleneksel el işçiliği tasarımı.';
  const price = product?.price || product?.fiyat || 0;
  const category = product?.category || product?.kategori || 'Atölye';
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
    navigate(`/product/${id}`);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const payload = { productId: id, name: title, price: finalPrice, image: image, quantity: 1 };
      const response = await cartService.addToCart(payload);
      
      if (response.success) {
        setToast({ open: true, message: 'Ürün sepete eklendi!', severity: 'success' });
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      if (error.mesaj === 'Yetkisiz erişim, token bulunamadı.' || error.status === 401) {
        setToast({ open: true, message: 'Sepete eklemek için giriş yapmalısınız.', severity: 'warning' });
      } else {
        setToast({ open: true, message: 'Ürün eklenemedi.', severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- FAVORİ EKLE/ÇIKAR FONKSİYONU ---
  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (favLoading || !id) return;

    setFavLoading(true);
    try {
      if (isFavorite) {
        await userService.removeFavorite(id);
        setProductFavorite(id, false);
        setToast({ open: true, message: 'Ürün favorilerden çıkarıldı.', severity: 'info' });
      } else {
        try {
          await userService.addFavorite(id);
        } catch (addError) {
          if (addError?.response?.status !== 400) throw addError;
        }
        setProductFavorite(id, true);
        setToast({ open: true, message: 'Ürün favorilere eklendi!', severity: 'success' });
      }
    } catch (error) {
      if (error.response?.status === 401 || error.message?.includes('token') || error.message?.includes('Giriş')) {
        setToast({ open: true, message: 'Favorilere eklemek için giriş yapmalısınız.', severity: 'warning' });
      } else {
        setToast({ open: true, message: error.response?.data?.message || 'İşlem başarısız.', severity: 'error' });
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
          <Box sx={{ position: 'absolute', top: 10, left: 10, maxWidth: 'calc(100% - 52px)' }}>
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
          
          {/* FAVORİ BUTONU (KALP) */}
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
            {/* Başlık gerçek bir bağlantı: arama motorları ürün sayfalarını buradan keşfeder */}
            <Box component="h3" sx={{ m: 0 }}>
              <Tooltip title={title} arrow placement="top" enterDelay={200}>
                <Box
                  component={RouterLink}
                  to={id ? `/product/${id}` : '/products'}
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
                    aria-label="Açıklamanın devamını gör"
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
            <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 700, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>ÖZEL FİYAT</Typography>
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
            {loading ? 'Ekleniyor...' : 'Sepete Ekle'}
          </Button>
        </CardActions>
      </Card>
    </>
  );
}