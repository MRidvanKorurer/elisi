

import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, Card, Container, IconButton, CircularProgress } from '@mui/material';
import ArrowBackIosNewOutlined from '@mui/icons-material/ArrowBackIosNewOutlined';
import ArrowForwardIosOutlined from '@mui/icons-material/ArrowForwardIosOutlined';
import { motion } from 'framer-motion';
import { categoryService } from '../api/categoryService';
import DynamicIcon from './DynamicIcon'; // Dinamik ikon renderlayıcımız

// Tümü butonu veritabanında olmadığı için Frontend'de manuel ekliyoruz
const ALL_CATEGORY_OPTION = { 
  categoryId: 'all', 
  name: 'Tümü', 
  description: 'Bütün Koleksiyon',
  iconName: 'ContentCutOutlined',
  bgGradient: 'linear-gradient(135deg, #B0CDE6 0%, #A290B7 100%)'
};

export default function CategoryBar({ selectedCategory, onSelectCategory, onCategoriesLoaded }) {
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const dbCategories = await categoryService.getAllCategories();
        const fullCategories = [ALL_CATEGORY_OPTION, ...dbCategories];
        setCategories(fullCategories);
        
        // Yüklenen kategorileri üst bileşene (CategoryProductList) gönderiyoruz ki başlık kısmı da bilsin
        if (onCategoriesLoaded) onCategoriesLoaded(fullCategories);
      } catch (error) {
        console.error("Kategoriler yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [onCategoriesLoaded]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mb: 7, mt: 3, position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: 2, color: '#A290B7', fontWeight: 800 }}>ÖZEL ATÖLYELER</Typography>
          <Typography variant="h4" fontWeight="800" sx={{ color: '#2E3B55', letterSpacing: '-0.5px' }}>Kategorilere Göre Keşfet</Typography>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1.5 }}>
          <IconButton onClick={() => handleScroll('left')} sx={{ backgroundColor: '#FFFFFF', border: '1.5px solid rgba(148, 109, 109, 0.2)', color: '#2E3B55' }}><ArrowBackIosNewOutlined fontSize="small" /></IconButton>
          <IconButton onClick={() => handleScroll('right')} sx={{ backgroundColor: '#FFFFFF', border: '1.5px solid rgba(148, 109, 109, 0.2)', color: '#2E3B55' }}><ArrowForwardIosOutlined fontSize="small" /></IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: '#A290B7' }} /></Box>
      ) : (
        <Box ref={scrollRef} sx={{ display: 'flex', gap: 2.5, overflowX: 'auto', scrollBehavior: 'smooth', py: 1.5, px: 0.5, WebkitOverflowScrolling: 'touch', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {categories.map((cat, idx) => {
            const isSelected = (selectedCategory || 'all') === cat.categoryId;

            return (
              <motion.div key={cat.categoryId} whileHover={{ y: -8, scale: 1.03 }} whileTap={{ scale: 0.97 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: idx * 0.06 }}>
                <Card onClick={() => onSelectCategory && onSelectCategory(cat.categoryId)} sx={{ minWidth: { xs: 170, sm: 200 }, height: 210, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', borderRadius: '28px', position: 'relative', overflow: 'hidden', background: isSelected ? '#946D6D' : 'rgba(253, 244, 210, 0.55)', backdropFilter: 'blur(16px)', border: isSelected ? '2px solid #946D6D' : '1px solid rgba(162, 144, 183, 0.3)', boxShadow: isSelected ? '0 18px 35px -10px rgba(148, 109, 109, 0.45)' : '0 8px 25px rgba(148, 109, 109, 0.06)', transition: 'all 0.35s ease', userSelect: 'none' }}>
                  <Box sx={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: cat.bgGradient || '#ccc', opacity: isSelected ? 0.35 : 0.25, filter: 'blur(12px)' }} />
                  <Box sx={{ width: 52, height: 52, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF', color: isSelected ? '#FFFFFF' : '#946D6D', transition: 'all 0.3s ease', '& svg': { fontSize: '28px' } }}>
                    <DynamicIcon iconName={cat.iconName} />
                  </Box>
                  <Box sx={{ zIndex: 1 }}>
                    <Typography variant="h6" fontWeight="800" sx={{ color: isSelected ? '#FFFFFF' : '#2E3B55', fontSize: '1.05rem', lineHeight: 1.2, mb: 0.5 }}>{cat.name}</Typography>
                    <Typography variant="caption" fontWeight="600" sx={{ color: isSelected ? 'rgba(255, 255, 255, 0.8)' : '#6E5252', fontSize: '0.78rem', display: 'block' }}>{cat.description}</Typography>
                  </Box>
                </Card>
              </motion.div>
            );
          })}
        </Box>
      )}
    </Container>
  );
}