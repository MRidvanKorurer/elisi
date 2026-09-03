
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Container, Typography, Grid, Button, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryBar from './CategoryBar';
import ProductCard from './ProductCard';
import { productService } from '../api/productService'; 
import { motion } from 'framer-motion';

// İKONLAR (Kategori Başlıkları İçin)
import ColorLensOutlined from '@mui/icons-material/ColorLensOutlined';
import WavesOutlined from '@mui/icons-material/WavesOutlined';
import ForestOutlined from '@mui/icons-material/ForestOutlined';
import DiamondOutlined from '@mui/icons-material/DiamondOutlined';
import SelfImprovementOutlined from '@mui/icons-material/SelfImprovementOutlined';
import ContentCutOutlined from '@mui/icons-material/ContentCutOutlined';

// 1. KATEGORİ DETAYLARI (Dinamik Başlık Alanı İçin Renk ve Metinler)
const CATEGORY_INFO = {
  'all': { name: 'Tüm Koleksiyon', desc: 'Atölyemizin tüm özgün tasarımları', icon: <ContentCutOutlined fontSize="large" />, color: '#946D6D', bg: 'rgba(148, 109, 109, 0.12)' },
  'seramik': { name: 'Seramik & Obje', desc: 'El şekillendirmesi özgün formlar', icon: <ColorLensOutlined fontSize="large" />, color: '#7A9EBD', bg: 'rgba(122, 158, 189, 0.15)' },
  'makrome': { name: 'Örgü & Makrome', desc: 'Sıcak dokumalar ve bohem detaylar', icon: <WavesOutlined fontSize="large" />, color: '#A290B7', bg: 'rgba(162, 144, 183, 0.15)' },
  'ahsap': { name: 'Ahşap Tasarım', desc: 'Doğadan ilham alan ince işçilik', icon: <ForestOutlined fontSize="large" />, color: '#DDA15E', bg: 'rgba(221, 161, 94, 0.15)' },
  'taki': { name: 'Takı & Aksesuar', desc: 'Kişiye özel zarif dokunuşlar', icon: <DiamondOutlined fontSize="large" />, color: '#E29578', bg: 'rgba(226, 149, 120, 0.15)' },
  'mum': { name: 'Mum & Aromaterapi', desc: 'Huzur veren doğal esanslar', icon: <SelfImprovementOutlined fontSize="large" />, color: '#81B29A', bg: 'rgba(129, 178, 154, 0.15)' },
};

export default function CategoryProductList({ onAddToCart, onToggleFavorite, favorites = [] }) {
  // 1. STATE'LER
  const [products, setProducts] = useState([]); // Veritabanından gelecek ürünler
  const [loading, setLoading] = useState(true); // Yüklenme durumu
  const [error, setError] = useState(null); // Hata durumu
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(8);

  // 2. COMPONENT YÜKLENDİĞİNDE ÜRÜNLERİ BACKEND'DEN ÇEK
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAllProducts();
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error("Ürünler getirilirken hata:", err);
        setError("Ürünler yüklenirken bir sorun oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 3. KATEGORİYE GÖRE FİLTRELEME (Client-Side)
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    
    return products.filter((product) => {
      return product.category?.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [selectedCategory, products]);

  // 4. KATEGORİ SEÇİMİ (CategoryBar'dan Tetiklenir)
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setVisibleCount(8); 
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  // 5. AKTİF KATEGORİ BİLGİSİNİ ÇEK (Başlık İçin)
  const activeCatInfo = CATEGORY_INFO[selectedCategory] || CATEGORY_INFO['all'];

  return (
    <Box sx={{ pb: 8 }}>
      {/* KATEGORİ BAR */}
      <CategoryBar 
        selectedCategory={selectedCategory} 
        onSelectCategory={handleSelectCategory} 
      />

      {/* ÜRÜN LİSTESİ VE BAŞLIK ALANI */}
      <Container maxWidth="lg" sx={{ mt: 1 }}>

        {/* ========================================================= */}
        {/* ŞIK KATEGORİ BAŞLIĞI (Sadece yükleme bittiyse görünür) */}
        {/* ========================================================= */}
        {!loading && !error && (
          <motion.div
            key={selectedCategory} // Kategori değiştikçe animasyonu tetikler
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2.5, 
                mb: 4, 
                p: 2.5, 
                borderRadius: '24px', 
                backgroundColor: '#FFFFFF', 
                border: '1.5px solid rgba(148, 109, 109, 0.08)', 
                boxShadow: '0 12px 35px rgba(46, 59, 85, 0.04)' 
              }}
            >
              {/* İkon Kutusu (Kategoriye Özel Renkli) */}
              <Box 
                sx={{ 
                  width: 68, 
                  height: 68, 
                  borderRadius: '18px', 
                  backgroundColor: activeCatInfo.bg, 
                  color: activeCatInfo.color, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {activeCatInfo.icon}
              </Box>

              {/* Metin Alanı */}
              <Box>
                <Typography variant="h5" fontWeight="800" sx={{ color: '#2E3B55', letterSpacing: '-0.5px' }}>
                  {activeCatInfo.name}
                </Typography>
                <Typography variant="body2" fontWeight="600" sx={{ color: '#6E5252', mt: 0.5 }}>
                  {activeCatInfo.desc} <span style={{ opacity: 0.5, margin: '0 6px' }}>•</span> 
                  <span style={{ color: activeCatInfo.color, fontWeight: 800 }}>{filteredProducts.length}</span> ürün
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}
        {/* ========================================================= */}

        
        {/* Yükleniyor Durumu */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#946D6D' }} />
          </Box>
        ) : error ? (
          /* Hata Durumu */
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 600 }}>
              {error}
            </Typography>
          </Box>
        ) : displayedProducts.length > 0 ? (
          /* Ürünler Varsa Grid Halinde Göster */
          <Grid container spacing={3.5}>
            {displayedProducts.map((product) => (
              <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
                <ProductCard 
                  product={product} 
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={favorites.includes(product._id)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          /* Ürün Yoksa Bilgi Ver */
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#6E5252', fontWeight: 600 }}>
              Bu kategoride henüz ürün bulunmamaktadır.
            </Typography>
          </Box>
        )}

        {/* DAHA FAZLA GÖR BUTONU */}
        {!loading && hasMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              endIcon={<ExpandMoreIcon />}
              sx={{
                px: 4, py: 1.5, borderRadius: '20px',
                borderColor: '#946D6D', color: '#946D6D',
                fontWeight: 800, fontSize: '0.98rem', borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px', borderColor: '#946D6D', backgroundColor: '#946D6D', color: '#FFFFFF'
                }
              }}
            >
              Daha Fazla Gör ({filteredProducts.length - visibleCount} ürün)
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}