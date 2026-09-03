

// import React from 'react';
// import { useNavigate } from 'react-router-dom'; // Yönlendirme için eklendi
// import { 
//   Card, CardMedia, CardContent, CardActions, Typography, Button, 
//   Chip, Box, Tooltip 
// } from '@mui/material';
// import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
// import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
// import { addToCart } from '../utils/cartHelper';

// const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80';

// export default function ProductCard({ product }) {
//   const navigate = useNavigate(); // Hook'u tanımladık
  
//   // Backend'den gelen İngilizce alanlar (Eski Türkçe propları da yedek olarak tuttuk)
//   const id = product?._id || product?.id;
//   const title = product?.title || product?.baslik || 'Özel Tasarım Ürün';
//   const image = product?.image || product?.resimUrl || FALLBACK_IMAGE;
//   const description = product?.description || product?.aciklama || 'Geleneksel el işçiliği tasarımı.';
//   const price = product?.price || product?.fiyat || 0;
//   const category = product?.category || product?.kategori || 'Atölye';

//   // Karta tıklandığında detay sayfasına git
//   const handleCardClick = () => {
//     if (id) {
//       navigate(`/product/${id}`);
//     }
//   };

//   return (
//     <Card 
//       onClick={handleCardClick} // Karta tıklama eklendi
//       sx={{ 
//         width: 260,
//         minWidth: 260,
//         maxWidth: 260,
//         height: 440,
//         display: 'flex', 
//         flexDirection: 'column', 
//         justifyContent: 'space-between',
//         overflow: 'hidden',
//         borderRadius: '24px',
//         cursor: 'pointer', // İmleci el işaretine çevirdik
//         backgroundColor: '#FFFFFF !important', 
//         border: '1px solid rgba(148, 109, 109, 0.15)',
//         boxShadow: '0 10px 25px -5px rgba(46, 59, 85, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
//         transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//         '&:hover': {
//           transform: 'translateY(-6px)',
//           boxShadow: '0 20px 35px -10px rgba(148, 109, 109, 0.22)',
//           borderColor: '#946D6D'
//         },
//         boxSizing: 'border-box',
//         mx: 'auto'
//       }}
//     >
//       {/* 1. GÖRSEL ALANI */}
//       <Box sx={{ position: 'relative', height: 190, minHeight: 190, width: '100%', overflow: 'hidden', backgroundColor: '#F8F5F0' }}>
//         <CardMedia
//           component="img"
//           height="190"
//           image={image}
//           alt={title}
//           onError={(e) => {
//             e.target.onerror = null;
//             e.target.src = FALLBACK_IMAGE;
//           }}
//           sx={{ 
//             objectFit: 'cover',
//             width: '100%',
//             height: '100%',
//             transition: 'transform 0.5s ease', 
//             '&:hover': { transform: 'scale(1.06)' } 
//           }}
//         />
        
//         <Chip 
//           label={category} 
//           size="small" 
//           sx={{ 
//             position: 'absolute', 
//             top: 10, 
//             left: 10, 
//             backgroundColor: 'rgba(255, 255, 255, 0.95)', 
//             color: '#2E3B55',
//             fontWeight: 800,
//             fontSize: '0.7rem',
//             textTransform: 'capitalize',
//             borderRadius: '8px',
//             boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
//           }} 
//         />

//         <Box
//           onClick={(e) => {
//             e.stopPropagation(); // Karta tıklanmasını engeller, sadece favoriye ekler
//             // onToggleFavorite(product._id); // İleride eklenecek favori fonksiyonu
//           }}
//           sx={{
//             position: 'absolute',
//             top: 10,
//             right: 10,
//             width: 32,
//             height: 32,
//             borderRadius: '50%',
//             backgroundColor: 'rgba(255, 255, 255, 0.95)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             cursor: 'pointer',
//             boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//             '&:hover': { backgroundColor: '#946D6D', color: '#FFF' }
//           }}
//         >
//           <FavoriteBorderOutlined sx={{ fontSize: '18px', color: 'inherit' }} />
//         </Box>
//       </Box>

//       {/* 2. İÇERİK ALANI */}
//       <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF' }}>
//         <Box>
//           <Tooltip title={title} arrow placement="top">
//             <Typography 
//               variant="h6" 
//               fontWeight="800" 
//               sx={{ 
//                 color: '#2E3B55', 
//                 fontSize: '0.92rem',
//                 lineHeight: 1.3,
//                 display: '-webkit-box',
//                 WebkitLineClamp: 2,
//                 WebkitBoxOrient: 'vertical',
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis',
//                 height: '2.6em'
//               }}
//             >
//               {title}
//             </Typography>
//           </Tooltip>

//           <Typography 
//             variant="body2" 
//             sx={{ 
//               fontSize: '0.75rem',
//               color: '#6E5252',
//               display: '-webkit-box',
//               WebkitLineClamp: 1,
//               WebkitBoxOrient: 'vertical',
//               overflow: 'hidden',
//               textOverflow: 'ellipsis',
//               mt: 0.8,
//               height: '1.4em'
//             }}
//           >
//             {description}
//           </Typography>
//         </Box>

//         <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 1 }}>
//           <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 700, fontSize: '0.7rem' }}>
//             ÖZEL FİYAT
//           </Typography>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             {/* İndirim varsa eski fiyatı üstü çizili göster */}
//             {product?.discountPercentage > 0 && (
//                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#B0CDE6', fontWeight: 600 }}>
//                  ₺{price}
//                </Typography>
//             )}
//             <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', fontSize: '1.2rem' }}>
//               ₺{product?.discountPercentage > 0 ? (price - (price * (product.discountPercentage / 100))) : price}
//             </Typography>
//           </Box>
//         </Box>
//       </CardContent>

//       {/* 3. BUTON ALANI */}
//       <CardActions sx={{ px: 2, pb: 2, pt: 0, backgroundColor: '#FFFFFF' }}>
//         <Button 
//           fullWidth 
//           variant="contained" 
//           startIcon={<ShoppingBagOutlined />} 
//           onClick={(e) => {
//             e.stopPropagation(); // Detay sayfasına gitmeyi engeller
//             addToCart(product);
//           }} 
//           sx={{ 
//             borderRadius: '12px', 
//             py: 1, 
//             backgroundColor: '#A290B7', 
//             color: '#FFFFFF', 
//             fontWeight: 700,
//             fontSize: '0.82rem',
//             boxShadow: 'none',
//             '&:hover': { backgroundColor: '#946D6D' }
//           }}
//         >
//           Sepete Ekle
//         </Button>
//       </CardActions>
//     </Card>
//   );
// }




import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardMedia, CardContent, CardActions, Typography, Button, 
  Chip, Box, Tooltip, Snackbar, Alert, CircularProgress 
} from '@mui/material';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
import { cartService } from '../api/cartServices'; // Backend Sepet Servisi

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  
  // Loading ve Toast State'leri
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const id = product?._id || product?.id;
  const title = product?.title || product?.baslik || 'Özel Tasarım Ürün';
  const image = product?.image || product?.resimUrl || FALLBACK_IMAGE;
  const description = product?.description || product?.aciklama || 'Geleneksel el işçiliği tasarımı.';
  const price = product?.price || product?.fiyat || 0;
  const category = product?.category || product?.kategori || 'Atölye';
  
  // İndirimli fiyat hesaplaması
  const finalPrice = product?.discountPercentage > 0 
    ? (price - (price * (product.discountPercentage / 100))) 
    : price;

  const handleCardClick = () => {
    if (id) navigate(`/product/${id}`);
  };

  // API İLE SEPETE EKLEME FONKSİYONU
  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Karta tıklanıp detay sayfasına gitmesini engeller
    
    try {
      setLoading(true);
      
      const payload = {
        productId: id,
        name: title,
        price: finalPrice,
        image: image,
        quantity: 1
      };

      const response = await cartService.addToCart(payload);
      
      if (response.success) {
        setToast({ open: true, message: 'Ürün sepete eklendi!', severity: 'success' });
        
        // KRİTİK NOKTA: Navbar'ın sayacı güncellemesi için global bir sinyal yayınlıyoruz
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      // Hata genelde 401 (Giriş Yapılmamış) olur
      if (error.mesaj === 'Yetkisiz erişim, token bulunamadı.' || error.status === 401) {
        setToast({ open: true, message: 'Sepete eklemek için giriş yapmalısınız.', severity: 'warning' });
      } else {
        setToast({ open: true, message: 'Ürün eklenemedi.', severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') return;
    setToast({ ...toast, open: false });
  };

  return (
    <>
      {/* BAŞARI/HATA BİLDİRİMİ */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Card 
        onClick={handleCardClick}
        sx={{ 
          width: 260, minWidth: 260, maxWidth: 260, height: 440,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          overflow: 'hidden', borderRadius: '24px', cursor: 'pointer',
          backgroundColor: '#FFFFFF !important', border: '1px solid rgba(148, 109, 109, 0.15)',
          boxShadow: '0 10px 25px -5px rgba(46, 59, 85, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 35px -10px rgba(148, 109, 109, 0.22)', borderColor: '#946D6D' },
          boxSizing: 'border-box', mx: 'auto'
        }}
      >
        {/* 1. GÖRSEL ALANI */}
        <Box sx={{ position: 'relative', height: 190, minHeight: 190, width: '100%', overflow: 'hidden', backgroundColor: '#F8F5F0' }}>
          <CardMedia component="img" height="190" image={image} alt={title}
            onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
            sx={{ objectFit: 'cover', width: '100%', height: '100%', transition: 'transform 0.5s ease', '&:hover': { transform: 'scale(1.06)' } }}
          />
          <Chip label={category} size="small" sx={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#2E3B55', fontWeight: 800, fontSize: '0.7rem', textTransform: 'capitalize', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
          <Box onClick={(e) => { e.stopPropagation(); }} sx={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', '&:hover': { backgroundColor: '#946D6D', color: '#FFF' } }}>
            <FavoriteBorderOutlined sx={{ fontSize: '18px', color: 'inherit' }} />
          </Box>
        </Box>

        {/* 2. İÇERİK ALANI */}
        <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF' }}>
          <Box>
            <Tooltip title={title} arrow placement="top">
              <Typography variant="h6" fontWeight="800" sx={{ color: '#2E3B55', fontSize: '0.92rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', height: '2.6em' }}>
                {title}
              </Typography>
            </Tooltip>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#6E5252', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', mt: 0.8, height: '1.4em' }}>
              {description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#A290B7', fontWeight: 700, fontSize: '0.7rem' }}>ÖZEL FİYAT</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {product?.discountPercentage > 0 && (
                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#B0CDE6', fontWeight: 600 }}>₺{price}</Typography>
              )}
              <Typography variant="h6" fontWeight="800" sx={{ color: '#946D6D', fontSize: '1.2rem' }}>₺{finalPrice}</Typography>
            </Box>
          </Box>
        </CardContent>

        {/* 3. BUTON ALANI */}
        <CardActions sx={{ px: 2, pb: 2, pt: 0, backgroundColor: '#FFFFFF' }}>
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