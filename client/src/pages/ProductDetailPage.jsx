

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Button, IconButton, 
  CircularProgress, Rating, Divider, Accordion, AccordionSummary, 
  AccordionDetails, Chip, Breadcrumbs, Link, Paper, Grid, Snackbar, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom"; 

import productServiceDefault, { productService as productServiceNamed } from '../api/productService'; 
import cartServiceDefault, { cartService as cartServiceNamed } from '../api/cartServices'; // 's' HARFİ DÜZELTİLDİ
import ProductCard from '../components/ProductCard';

// Esnek servis içe aktarımları (named vs default)
const productService = productServiceNamed || productServiceDefault;
const cartService = cartServiceNamed || cartServiceDefault;

export default function ProductDetailPage({ onAddToCart }) {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Toast Bildirimi State'i
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Benzer Ürünler State'i
  const [similarProducts, setSimilarProducts] = useState([]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // URL'deki ID değiştiğinde sayfanın en üstüne kaydır
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Ana ürün ve benzer ürün verilerini çekme
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Ana ürünü çek
        const response = await productService.getProductById(id);
        const productData = response?.product || response?.data || response;

        if (!productData || (!productData._id && !productData.id)) {
          throw new Error("Ürün bulunamadı");
        }

        setProduct(productData);
        setActiveImage(productData.image || productData.gorsel || ''); 
        setQuantity(1);

        // 2. Benzer Ürünleri Çek
        try {
          const categoryParam = productData.category || productData.kategori;
          let similarList = [];

          if (productService.getFilteredProducts) {
            const similarRes = await productService.getFilteredProducts({
              category: categoryParam,
              limit: 5
            });
            const fetched = similarRes?.products || similarRes?.data || [];
            similarList = fetched.filter(p => (p._id || p.id) !== (productData._id || productData.id));
          } else {
            const allRes = await productService.getAllProducts();
            const allFetched = Array.isArray(allRes) ? allRes : (allRes?.products || []);
            similarList = allFetched
              .filter(p => (p.category === categoryParam || p.kategori === categoryParam) && (p._id || p.id) !== (productData._id || productData.id))
              .slice(0, 4);
          }

          setSimilarProducts(similarList.slice(0, 4));
        } catch (simErr) {
          console.warn("Benzer ürünler çekilemedi:", simErr);
          setSimilarProducts([]);
        }

      } catch (err) {
        console.error("Ürün detayı çekilirken hata:", err);
        setError("Ürün bulunamadı veya bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
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
        <Typography variant="h5" color="error" fontWeight="600">{error || "Ürün bulunamadı."}</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mt: 3, color: '#946D6D', borderColor: '#946D6D', textTransform: 'none', borderRadius: '12px' }}>Geri Dön</Button>
      </Box>
    );
  }

  // Resim dizisini güvenli oluşturma
  const additionalImgs = Array.isArray(product.additionalImages) ? product.additionalImages : [];
  const mainImg = product.image || product.gorsel || '';
  const allImages = [mainImg, ...additionalImgs].filter(Boolean);
  const lightboxSlides = allImages.map(img => ({ src: img }));
  
  // İndirimli Fiyat Hesabı
  const rawPrice = Number(product.price || product.fiyat || 0);
  const discountRate = Number(product.discountPercentage || product.indirimOrani || 0);
  const discountedPrice = discountRate > 0 
    ? rawPrice - (rawPrice * (discountRate / 100))
    : rawPrice;

  // --- SEPETE EKLEME İŞLEMİ (NAVBAR SAYACINI DİNAMİK ARTTIRAN YAPI) ---
  const handleAddToCart = async () => {
    setAddingToCart(true);

    const payload = {
      productId: product._id || product.id,
      name: product.title || product.name,
      price: discountedPrice,
      image: mainImg,
      quantity: quantity
    };

    try {
      // 1. Doğrudan cartService üzerinden istek at veya yerel sepete (localStorage) yaz
      await cartService.addToCart(payload);

      // 🚨 2. NAVBAR SAYACINI CANLI GÜNCELLEYEN OLAY (EVENT)
      window.dispatchEvent(new Event('cartUpdated'));

      // 3. Eğer üst bileşene (App.jsx vb.) bildirmek gerekiyorsa handler'ı çağır
      if (onAddToCart) {
        onAddToCart({
          ...product,
          quantity,
          finalPrice: discountedPrice
        });
      }

      setSnackbar({
        open: true,
        message: `${product.title || 'Ürün'} başarıyla sepete eklendi!`,
        severity: 'success'
      });
    } catch (err) {
      console.error("Sepete ekleme hatası:", err);
      setSnackbar({
        open: true,
        message: 'Ürün sepete eklenirken bir sorun oluştu.',
        severity: 'error'
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleOpenLightbox = () => {
    const idx = allImages.indexOf(activeImage);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(prev => !prev);
    setSnackbar({
      open: true,
      message: !isFavorite ? 'Ürün favorilere eklendi.' : 'Ürün favorilerden çıkarıldı.',
      severity: 'info'
    });
  };

  return (
    <Box sx={{ pt: { xs: 12, md: 15 }, pb: 10, minHeight: '100vh', backgroundColor: '#FDF4D2' }}>
      <Container maxWidth="lg">
        
        {/* BREADCRUMBS */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 4, color: '#A290B7', fontWeight: 500 }}>
          <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Anasayfa</Link>
          <Typography color="inherit" onClick={() => navigate('/products')} sx={{ textTransform: 'capitalize', cursor: 'pointer' }}>
            {product.category || 'Tüm Ürünler'}
          </Typography>
          <Typography sx={{ color: '#2E3B55', fontWeight: 700 }}>{product.title}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6, lg: 8 }, alignItems: 'start' }}>
          
          {/* RESİM GALERİSİ */}
          <Box sx={{ minWidth: 0, position: { md: 'sticky' }, top: 100 }}>
            <Box onClick={handleOpenLightbox} sx={{ width: '100%', aspectRatio: { xs: '1/1', md: '4/5' }, borderRadius: '24px', overflow: 'hidden', position: 'relative', backgroundColor: '#FFF', boxShadow: '0 12px 30px rgba(0,0,0,0.05)', cursor: 'zoom-in', '&:hover': { opacity: 0.95 }, transition: 'opacity 0.2s' }}>
              <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {product.isNewProduct && <Chip label="YENİ" sx={{ bgcolor: '#2E3B55', color: '#fff', fontWeight: 800, borderRadius: '8px' }} />}
                {discountRate > 0 && <Chip label={`%${discountRate} İNDİRİM`} sx={{ bgcolor: '#946D6D', color: '#fff', fontWeight: 800, borderRadius: '8px' }} />}
              </Box>
              <img src={activeImage || mainImg} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

          {/* ÜRÜN BİLGİLERİ & DETAYLARI */}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" fontWeight="800" sx={{ color: '#2E3B55', mb: 1.5, fontSize: { xs: '1.8rem', md: '2.3rem' }, lineHeight: 1.2 }}>
              {product.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Rating value={Number(product.rating || 5)} precision={0.1} readOnly sx={{ color: '#DDA15E' }} />
              <Typography variant="body2" sx={{ color: '#A290B7', fontWeight: 600 }}>({product.numReviews || 0} Değerlendirme)</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Typography variant="h3" fontWeight="800" sx={{ color: '#946D6D' }}>
                {discountedPrice.toLocaleString('tr-TR')} ₺
              </Typography>
              {discountRate > 0 && (
                <Typography variant="h5" sx={{ textDecoration: 'line-through', color: '#A290B7', fontWeight: 600 }}>
                  {rawPrice.toLocaleString('tr-TR')} ₺
                </Typography>
              )}
            </Box>

            <Divider sx={{ mb: 4, borderColor: 'rgba(148, 109, 109, 0.15)' }} />

            {/* ADET SEÇİMİ VE SEPETE EKLE BUTTON GRUBU */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'nowrap', gap: 2, mb: 4, width: '100%', alignItems: 'stretch' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid rgba(148, 109, 109, 0.2)', borderRadius: '16px', px: 1, height: '56px', width: { xs: '100%', sm: '120px' }, flexShrink: 0, bgcolor: '#FFF' }}>
                <IconButton onClick={() => setQuantity(q => Math.max(1, q - 1))} sx={{ color: '#2E3B55', padding: '5px' }}>
                  <RemoveIcon />
                </IconButton>
                <Typography fontWeight="800" sx={{ fontSize: '1.1rem', color: '#2E3B55' }}>{quantity}</Typography>
                <IconButton 
                  onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))} 
                  disabled={product.stock !== undefined && quantity >= product.stock} 
                  sx={{ color: '#2E3B55', padding: '5px' }}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              <Button 
                variant="contained" 
                onClick={handleAddToCart} 
                disabled={product.stock === 0 || addingToCart} 
                startIcon={addingToCart ? <CircularProgress size={20} color="inherit" /> : <ShoppingBagOutlinedIcon />} 
                sx={{ 
                  bgcolor: product.stock === 0 ? '#ccc' : '#946D6D', 
                  color: '#fff', 
                  height: '56px', 
                  borderRadius: '16px', 
                  fontWeight: 800, 
                  fontSize: '1.05rem', 
                  flexGrow: 1, 
                  flexShrink: 1, 
                  minWidth: 0, 
                  boxShadow: 'none', 
                  '&:hover': { bgcolor: '#7c5a5a', boxShadow: 'none' } 
                }}
              >
                {product.stock === 0 ? 'TÜKENDİ' : addingToCart ? 'EKLENİYOR...' : 'SEPETE EKLE'}
              </Button>

              <IconButton 
                onClick={handleToggleFavorite}
                sx={{ 
                  border: '2px solid rgba(148, 109, 109, 0.2)', 
                  borderRadius: '16px', 
                  height: '56px', 
                  width: { xs: '100%', sm: '56px' }, 
                  flexShrink: 0, 
                  bgcolor: '#FFF', 
                  '&:hover': { borderColor: '#946D6D' } 
                }}
              >
                {isFavorite ? <FavoriteIcon sx={{ color: '#946D6D' }} /> : <FavoriteBorderOutlinedIcon sx={{ color: '#946D6D' }} />}
              </IconButton>
            </Box>

            {/* KARGO VE ÜRETİM BİLGİ KARTI */}
            <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, mb: 4, borderRadius: '16px', bgcolor: '#FFF', border: '1px solid rgba(148, 109, 109, 0.15)' }}>
              <Box sx={{ color: '#DDA15E' }}>
                {product.immediateDelivery ? <LocalShippingOutlinedIcon fontSize="large" /> : <HandymanOutlinedIcon fontSize="large" />}
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#2E3B55' }}>
                  {product.immediateDelivery ? 'Hemen Teslim Edilebilir' : 'Kişiye Özel Üretim'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6E5252' }}>
                  {product.immediateDelivery 
                    ? 'Siparişiniz 24 saat içinde kargoya verilir.' 
                    : `Üretim ve kargo süresi: ${product.customProductionTime || '3-5 iş günü'}`}
                </Typography>
              </Box>
            </Paper>

            {/* AKORDİYON ALANLARI */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Accordion elevation={0} defaultExpanded sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography fontWeight="800" sx={{ color: '#2E3B55' }}>ÜRÜN ÖZELLİKLERİ</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px dashed rgba(162, 144, 183, 0.3)' }}>
                      <Typography variant="body2" fontWeight="700" color="#2E3B55">Ürün Kodu</Typography>
                      <Typography variant="body2" color="#6E5252" fontWeight="600">{product.productCode || product._id || product.id}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px dashed rgba(162, 144, 183, 0.3)' }}>
                      <Typography variant="body2" fontWeight="700" color="#2E3B55">Kategori</Typography>
                      <Typography variant="body2" color="#6E5252" sx={{ textTransform: 'capitalize' }}>{product.category || product.kategori || 'Genel'}</Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
              
              <Accordion elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography fontWeight="800" sx={{ color: '#2E3B55' }}>ÜRÜN AÇIKLAMASI</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 2, color: '#6E5252', lineHeight: 1.7 }}>
                  {product.description || product.aciklama || 'Bu ürün için henüz detaylı bir açıklama eklenmedi.'}
                </AccordionDetails>
              </Accordion>
            </Box>

          </Box>
        </Box>

        {/* BENZER ÜRÜNLER ALANI */}
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
                <Grid item xs={12} sm={6} md={4} lg={3} key={simProduct._id || simProduct.id}>
                  <ProductCard product={simProduct} onAddToCart={onAddToCart} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

      </Container>

      {/* GÖRSEL BÜYÜTME (LIGHTBOX) */}
      {allImages.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={lightboxSlides}
          plugins={[Zoom]} 
          styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.95)" } }}
        />
      )}

      {/* BİLDİRİM BARI (SNACKBAR) */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}