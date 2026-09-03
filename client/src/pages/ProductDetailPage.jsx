

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { 
//   Box, Container, Typography, Button, IconButton, 
//   CircularProgress, Rating, Divider, Accordion, AccordionSummary, 
//   AccordionDetails, Chip, Breadcrumbs, Link, Paper 
// } from '@mui/material';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import AddIcon from '@mui/icons-material/Add';
// import RemoveIcon from '@mui/icons-material/Remove';
// import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
// import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
// import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
// import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
// import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// // YENİ KURDUĞUMUZ HARİKA LIGHTBOX PAKETİ
// import Lightbox from "yet-another-react-lightbox";
// import "yet-another-react-lightbox/styles.css";
// import Zoom from "yet-another-react-lightbox/plugins/zoom"; // Yakınlaştırma eklentisi

// import { productService } from '../api/productService'; 

// export default function ProductDetailPage({ onAddToCart }) {
//   const { id } = useParams(); 
//   const navigate = useNavigate();

//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [activeImage, setActiveImage] = useState('');
//   const [quantity, setQuantity] = useState(1);

//   // Lightbox State
//   const [lightboxOpen, setLightboxOpen] = useState(false);
//   const [lightboxIndex, setLightboxIndex] = useState(0);

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         setLoading(true);
//         const data = await productService.getProductById(id);
//         setProduct(data);
//         setActiveImage(data.image); 
//       } catch (err) {
//         setError("Ürün bulunamadı veya bir hata oluştu.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProduct();
//   }, [id]);

//   if (loading) {
//     return (
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
//         <CircularProgress sx={{ color: '#946D6D' }} />
//       </Box>
//     );
//   }

//   if (error || !product) {
//     return (
//       <Box sx={{ textAlign: 'center', py: 15 }}>
//         <Typography variant="h5" color="error" fontWeight="600">{error}</Typography>
//         <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 3, color: '#946D6D', borderColor: '#946D6D' }}>Geri Dön</Button>
//       </Box>
//     );
//   }

//   // Tüm görselleri topla ve Lightbox'ın istediği { src: 'url' } formatına çevir
//   const allImages = [product.image, ...(product.additionalImages || [])];
//   const lightboxSlides = allImages.map(img => ({ src: img }));
  
//   const discountedPrice = product.discountPercentage > 0 
//     ? product.price - (product.price * (product.discountPercentage / 100))
//     : product.price;

//   const handleAddToCart = () => {
//     const cartItem = { ...product, quantity, finalPrice: discountedPrice };
//     if (onAddToCart) onAddToCart(cartItem);
//   };

//   const handleOpenLightbox = () => {
//     setLightboxIndex(allImages.indexOf(activeImage));
//     setLightboxOpen(true);
//   };

//   return (
//     <Box sx={{ pt: { xs: 12, md: 15 }, pb: 10, minHeight: '100vh' }}>
//       <Container maxWidth="lg">
        
//         {/* ================= ÜST MENÜ ================= */}
//         <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 4, color: '#A290B7', fontWeight: 500 }}>
//           <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Anasayfa</Link>
//           <Typography color="inherit" sx={{ textTransform: 'capitalize' }}>{product.category}</Typography>
//           <Typography sx={{ color: '#2E3B55', fontWeight: 700 }}>{product.title}</Typography>
//         </Breadcrumbs>

//         {/* ================= KESİNLİKLE ALTA DÜŞMEYEN CSS GRID YAPISI ================= */}
//         <Box sx={{ 
//           display: 'grid', 
//           gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, // md ve sonrasında KESİN 2 kolon!
//           gap: { xs: 4, md: 6, lg: 8 }, 
//           alignItems: 'start'
//         }}>
          
//           {/* 1. KOLON: FOTOĞRAF GALERİSİ */}
//           <Box sx={{ minWidth: 0, position: { md: 'sticky' }, top: 100 }}>
            
//             <Box 
//               onClick={handleOpenLightbox}
//               sx={{ 
//                 width: '100%', aspectRatio: { xs: '1/1', md: '4/5' }, borderRadius: '24px', overflow: 'hidden',
//                 position: 'relative', backgroundColor: '#FFF', boxShadow: '0 12px 30px rgba(0,0,0,0.05)',
//                 cursor: 'zoom-in', '&:hover': { opacity: 0.95 }, transition: 'opacity 0.2s'
//               }}
//             >
//               <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
//                 {product.isNewProduct && <Chip label="YENİ" sx={{ bgcolor: '#2E3B55', color: '#fff', fontWeight: 800, borderRadius: '8px' }} />}
//                 {product.discountPercentage > 0 && <Chip label={`%${product.discountPercentage} İNDİRİM`} sx={{ bgcolor: '#946D6D', color: '#fff', fontWeight: 800, borderRadius: '8px' }} />}
//               </Box>

//               <img src={activeImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//             </Box>

//             {/* Küçük Görseller */}
//             {allImages.length > 1 && (
//               <Box sx={{ display: 'flex', gap: 2, mt: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
//                 {allImages.map((img, idx) => (
//                   <Box
//                     key={idx} onClick={() => setActiveImage(img)}
//                     sx={{
//                       width: 80, height: 80, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
//                       border: activeImage === img ? '2px solid #946D6D' : '2px solid transparent',
//                       opacity: activeImage === img ? 1 : 0.6
//                     }}
//                   >
//                     <img src={img} alt={`Görsel ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//                   </Box>
//                 ))}
//               </Box>
//             )}
//           </Box>

//           {/* 2. KOLON: İÇERİK VE BUTONLAR */}
//           <Box sx={{ minWidth: 0 }}>
            
//             <Typography variant="h3" fontWeight="800" sx={{ color: '#2E3B55', mb: 1.5, fontSize: { xs: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
//               {product.title}
//             </Typography>
            
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
//               <Rating value={product.rating} precision={0.1} readOnly sx={{ color: '#DDA15E' }} />
//               <Typography variant="body2" sx={{ color: '#A290B7', fontWeight: 600 }}>({product.numReviews} Değerlendirme)</Typography>
//             </Box>

//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
//               <Typography variant="h3" fontWeight="800" sx={{ color: '#946D6D' }}>{discountedPrice.toLocaleString('tr-TR')} ₺</Typography>
//               {product.discountPercentage > 0 && (
//                 <Typography variant="h5" sx={{ textDecoration: 'line-through', color: '#B0CDE6', fontWeight: 600 }}>{product.price.toLocaleString('tr-TR')} ₺</Typography>
//               )}
//             </Box>

//             <Divider sx={{ mb: 4, borderColor: 'rgba(148, 109, 109, 0.1)' }} />

//             {/* BUTON GRUBU (FlexWrap yasaklandı, her şey kilitli) */}
//             <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'nowrap', gap: 2, mb: 4, width: '100%', alignItems: 'stretch' }}>
//               <Box sx={{ 
//                 display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid rgba(148, 109, 109, 0.2)', 
//                 borderRadius: '16px', px: 1, height: '56px', width: { xs: '100%', sm: '120px' }, flexShrink: 0, bgcolor: '#FFF'
//               }}>
//                 <IconButton onClick={() => setQuantity(q => Math.max(1, q - 1))} sx={{ color: '#2E3B55', padding: '5px' }}><RemoveIcon /></IconButton>
//                 <Typography fontWeight="800" sx={{ fontSize: '1.1rem', color: '#2E3B55' }}>{quantity}</Typography>
//                 <IconButton onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock} sx={{ color: '#2E3B55', padding: '5px' }}><AddIcon /></IconButton>
//               </Box>

//               <Button 
//                 variant="contained" onClick={handleAddToCart} disabled={product.stock === 0} startIcon={<ShoppingBagOutlinedIcon />}
//                 sx={{ 
//                   bgcolor: product.stock === 0 ? '#ccc' : '#946D6D', color: '#fff', height: '56px', borderRadius: '16px', 
//                   fontWeight: 800, fontSize: '1.05rem', flexGrow: 1, flexShrink: 1, minWidth: 0, boxShadow: 'none',
//                   '&:hover': { bgcolor: '#7c5a5a', boxShadow: 'none' }
//                 }}
//               >
//                 {product.stock === 0 ? 'TÜKENDİ' : 'SEPETE EKLE'}
//               </Button>

//               <IconButton sx={{ border: '2px solid rgba(148, 109, 109, 0.2)', borderRadius: '16px', height: '56px', width: { xs: '100%', sm: '56px' }, flexShrink: 0, bgcolor: '#FFF', '&:hover': { borderColor: '#946D6D' } }}>
//                 <FavoriteBorderOutlinedIcon sx={{ color: '#946D6D' }} />
//               </IconButton>
//             </Box>

//             {/* TESLİMAT KUTUSU */}
//             <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, mb: 4, borderRadius: '16px', bgcolor: '#FFF', border: '1px solid rgba(148, 109, 109, 0.15)' }}>
//               <Box sx={{ color: '#DDA15E' }}>
//                 {product.immediateDelivery ? <LocalShippingOutlinedIcon fontSize="large" /> : <HandymanOutlinedIcon fontSize="large" />}
//               </Box>
//               <Box>
//                 <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#2E3B55' }}>
//                   {product.immediateDelivery ? 'Hemen Teslim Edilebilir' : 'Kişiye Özel Üretim'}
//                 </Typography>
//                 <Typography variant="body2" sx={{ color: '#6E5252' }}>
//                   {product.immediateDelivery ? 'Siparişiniz 24 saat içinde kargoya verilir.' : `Üretim ve kargo süresi: ${product.customProductionTime}`}
//                 </Typography>
//               </Box>
//             </Paper>

//             {/* AKORDİYONLAR */}
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
//               <Accordion elevation={0} defaultExpanded sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
//                 <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
//                   <Typography fontWeight="800" sx={{ color: '#2E3B55' }}>ÜRÜN ÖZELLİKLERİ</Typography>
//                 </AccordionSummary>
//                 <AccordionDetails sx={{ px: 0, pt: 2 }}>
//                   <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px dashed rgba(162, 144, 183, 0.3)' }}><Typography variant="body2" fontWeight="700" color="#2E3B55">Ürün Kodu</Typography><Typography variant="body2" color="#6E5252" fontWeight="600">{product.productCode}</Typography></Box>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px dashed rgba(162, 144, 183, 0.3)' }}><Typography variant="body2" fontWeight="700" color="#2E3B55">Kategori</Typography><Typography variant="body2" color="#6E5252" sx={{ textTransform: 'capitalize' }}>{product.category}</Typography></Box>
//                   </Box>
//                 </AccordionDetails>
//               </Accordion>
              
//               <Accordion elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
//                 <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}><Typography fontWeight="800" sx={{ color: '#2E3B55' }}>ÜRÜN AÇIKLAMASI</Typography></AccordionSummary>
//                 <AccordionDetails sx={{ px: 0, pt: 2, color: '#6E5252', lineHeight: 1.7 }}>{product.description}</AccordionDetails>
//               </Accordion>
//             </Box>

//           </Box>
//         </Box>
//       </Container>

//       {/* YENİ HARİKA LIGHTBOX (Tam Ekran Galeri) */}
//       <Lightbox
//         open={lightboxOpen}
//         close={() => setLightboxOpen(false)}
//         index={lightboxIndex}
//         slides={lightboxSlides}
//         plugins={[Zoom]} // Resme çift tıklayınca veya tekerlekle yakınlaştırır
//         styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.95)" } }}
//       />
//     </Box>
//   );
// }



import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Button, IconButton, 
  CircularProgress, Rating, Divider, Accordion, AccordionSummary, 
  AccordionDetails, Chip, Breadcrumbs, Link, Paper, Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom"; 

import { productService } from '../api/productService'; 
import ProductCard from '../components/ProductCard'; // BENZER ÜRÜNLER İÇİN EKLENDİ

export default function ProductDetailPage({ onAddToCart }) {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Benzer Ürünler State'i
  const [similarProducts, setSimilarProducts] = useState([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // URL'deki ID her değiştiğinde (Benzer ürüne tıklandığında) sayfanın en üstüne çıkması için
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        // 1. Ana ürünü çek
        const data = await productService.getProductById(id);
        setProduct(data);
        setActiveImage(data.image); 
        setQuantity(1); // Farklı ürüne geçince adedi sıfırla

        // 2. Tüm ürünleri çek ve kategoriye göre filtrele (Benzer Ürünler)
        const allProducts = await productService.getAllProducts();
        const filteredSimilar = allProducts
          .filter(p => p.category === data.category && p._id !== data._id)
          .slice(0, 4); // Sadece ilk 4 tanesini al
          
        setSimilarProducts(filteredSimilar);

      } catch (err) {
        setError("Ürün bulunamadı veya bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    fetchProductData();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress sx={{ color: '#946D6D' }} />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ textAlign: 'center', py: 15 }}>
        <Typography variant="h5" color="error" fontWeight="600">{error}</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 3, color: '#946D6D', borderColor: '#946D6D' }}>Geri Dön</Button>
      </Box>
    );
  }

  const allImages = [product.image, ...(product.additionalImages || [])];
  const lightboxSlides = allImages.map(img => ({ src: img }));
  
  const discountedPrice = product.discountPercentage > 0 
    ? product.price - (product.price * (product.discountPercentage / 100))
    : product.price;

  const handleAddToCart = () => {
    const cartItem = { ...product, quantity, finalPrice: discountedPrice };
    if (onAddToCart) onAddToCart(cartItem);
  };

  const handleOpenLightbox = () => {
    setLightboxIndex(allImages.indexOf(activeImage));
    setLightboxOpen(true);
  };

  return (
    <Box sx={{ pt: { xs: 12, md: 15 }, pb: 10, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 4, color: '#A290B7', fontWeight: 500 }}>
          <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Anasayfa</Link>
          <Typography color="inherit" sx={{ textTransform: 'capitalize', cursor: 'pointer' }}>{product.category}</Typography>
          <Typography sx={{ color: '#2E3B55', fontWeight: 700 }}>{product.title}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6, lg: 8 }, alignItems: 'start' }}>
          
          <Box sx={{ minWidth: 0, position: { md: 'sticky' }, top: 100 }}>
            <Box onClick={handleOpenLightbox} sx={{ width: '100%', aspectRatio: { xs: '1/1', md: '4/5' }, borderRadius: '24px', overflow: 'hidden', position: 'relative', backgroundColor: '#FFF', boxShadow: '0 12px 30px rgba(0,0,0,0.05)', cursor: 'zoom-in', '&:hover': { opacity: 0.95 }, transition: 'opacity 0.2s' }}>
              <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {product.isNewProduct && <Chip label="YENİ" sx={{ bgcolor: '#2E3B55', color: '#fff', fontWeight: 800, borderRadius: '8px' }} />}
                {product.discountPercentage > 0 && <Chip label={`%${product.discountPercentage} İNDİRİM`} sx={{ bgcolor: '#946D6D', color: '#fff', fontWeight: 800, borderRadius: '8px' }} />}
              </Box>
              <img src={activeImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>

            {allImages.length > 1 && (
              <Box sx={{ display: 'flex', gap: 2, mt: 2, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                {allImages.map((img, idx) => (
                  <Box key={idx} onClick={() => setActiveImage(img)} sx={{ width: 80, height: 80, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: activeImage === img ? '2px solid #946D6D' : '2px solid transparent', opacity: activeImage === img ? 1 : 0.6 }}>
                    <img src={img} alt={`Görsel ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" fontWeight="800" sx={{ color: '#2E3B55', mb: 1.5, fontSize: { xs: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>{product.title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Rating value={product.rating} precision={0.1} readOnly sx={{ color: '#DDA15E' }} />
              <Typography variant="body2" sx={{ color: '#A290B7', fontWeight: 600 }}>({product.numReviews} Değerlendirme)</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Typography variant="h3" fontWeight="800" sx={{ color: '#946D6D' }}>{discountedPrice.toLocaleString('tr-TR')} ₺</Typography>
              {product.discountPercentage > 0 && <Typography variant="h5" sx={{ textDecoration: 'line-through', color: '#B0CDE6', fontWeight: 600 }}>{product.price.toLocaleString('tr-TR')} ₺</Typography>}
            </Box>

            <Divider sx={{ mb: 4, borderColor: 'rgba(148, 109, 109, 0.1)' }} />

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'nowrap', gap: 2, mb: 4, width: '100%', alignItems: 'stretch' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid rgba(148, 109, 109, 0.2)', borderRadius: '16px', px: 1, height: '56px', width: { xs: '100%', sm: '120px' }, flexShrink: 0, bgcolor: '#FFF' }}>
                <IconButton onClick={() => setQuantity(q => Math.max(1, q - 1))} sx={{ color: '#2E3B55', padding: '5px' }}><RemoveIcon /></IconButton>
                <Typography fontWeight="800" sx={{ fontSize: '1.1rem', color: '#2E3B55' }}>{quantity}</Typography>
                <IconButton onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock} sx={{ color: '#2E3B55', padding: '5px' }}><AddIcon /></IconButton>
              </Box>

              <Button variant="contained" onClick={handleAddToCart} disabled={product.stock === 0} startIcon={<ShoppingBagOutlinedIcon />} sx={{ bgcolor: product.stock === 0 ? '#ccc' : '#946D6D', color: '#fff', height: '56px', borderRadius: '16px', fontWeight: 800, fontSize: '1.05rem', flexGrow: 1, flexShrink: 1, minWidth: 0, boxShadow: 'none', '&:hover': { bgcolor: '#7c5a5a', boxShadow: 'none' } }}>
                {product.stock === 0 ? 'TÜKENDİ' : 'SEPETE EKLE'}
              </Button>

              <IconButton sx={{ border: '2px solid rgba(148, 109, 109, 0.2)', borderRadius: '16px', height: '56px', width: { xs: '100%', sm: '56px' }, flexShrink: 0, bgcolor: '#FFF', '&:hover': { borderColor: '#946D6D' } }}>
                <FavoriteBorderOutlinedIcon sx={{ color: '#946D6D' }} />
              </IconButton>
            </Box>

            <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, mb: 4, borderRadius: '16px', bgcolor: '#FFF', border: '1px solid rgba(148, 109, 109, 0.15)' }}>
              <Box sx={{ color: '#DDA15E' }}>{product.immediateDelivery ? <LocalShippingOutlinedIcon fontSize="large" /> : <HandymanOutlinedIcon fontSize="large" />}</Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#2E3B55' }}>{product.immediateDelivery ? 'Hemen Teslim Edilebilir' : 'Kişiye Özel Üretim'}</Typography>
                <Typography variant="body2" sx={{ color: '#6E5252' }}>{product.immediateDelivery ? 'Siparişiniz 24 saat içinde kargoya verilir.' : `Üretim ve kargo süresi: ${product.customProductionTime}`}</Typography>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Accordion elevation={0} defaultExpanded sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}><Typography fontWeight="800" sx={{ color: '#2E3B55' }}>ÜRÜN ÖZELLİKLERİ</Typography></AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px dashed rgba(162, 144, 183, 0.3)' }}><Typography variant="body2" fontWeight="700" color="#2E3B55">Ürün Kodu</Typography><Typography variant="body2" color="#6E5252" fontWeight="600">{product.productCode}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px dashed rgba(162, 144, 183, 0.3)' }}><Typography variant="body2" fontWeight="700" color="#2E3B55">Kategori</Typography><Typography variant="body2" color="#6E5252" sx={{ textTransform: 'capitalize' }}>{product.category}</Typography></Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
              
              <Accordion elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}><Typography fontWeight="800" sx={{ color: '#2E3B55' }}>ÜRÜN AÇIKLAMASI</Typography></AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 2, color: '#6E5252', lineHeight: 1.7 }}>{product.description}</AccordionDetails>
              </Accordion>
            </Box>

          </Box>
        </Box>

        {/* ================= BENZER ÜRÜNLER (YENİ EKLENEN KISIM) ================= */}
        {similarProducts.length > 0 && (
          <Box sx={{ mt: 12, pt: 6, borderTop: '1px solid rgba(148, 109, 109, 0.15)' }}>
            <Typography variant="h4" fontWeight="800" sx={{ color: '#2E3B55', mb: 1, letterSpacing: '-0.5px' }}>
              Bunlar da İlginizi Çekebilir
            </Typography>
            <Typography variant="body1" sx={{ color: '#6E5252', mb: 4 }}>
              Aynı kategorideki diğer eşsiz tasarımlarımızı keşfedin.
            </Typography>
            
            <Grid container spacing={3}>
              {similarProducts.map(simProduct => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={simProduct._id}>
                  {/* Anasayfada kullandığımız ProductCard bileşenini doğrudan burada çağırıyoruz */}
                  <ProductCard product={simProduct} onAddToCart={onAddToCart} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

      </Container>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        plugins={[Zoom]} 
        styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.95)" } }}
      />
    </Box>
  );
}