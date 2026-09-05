// import React, { useState } from 'react';
// import { Box, Typography, Container, Button, Grid } from '@mui/material';
// import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
// import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined';
// import ProductCard from './ProductCard';

// const mockBestSellers = [
//   { _id: 'mock1', baslik: 'El Yapımı Seramik Vazo', aciklama: 'Özel hamurdan elle şekillendirilmiş vazo.', fiyat: 450, kategori: 'Seramik', resimUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80' },
//   { _id: 'mock2', baslik: 'Dokuma Makrome Duvar Süsü', aciklama: '%100 pamuk iplikten doğal dokuma.', fiyat: 380, kategori: 'Makrome', resimUrl: 'https://images.unsplash.com/photo-1528458909336-e7a0adfac1d5?auto=format&fit=crop&w=600&q=80' },
//   { _id: 'mock3', baslik: 'Ahşap Oyma Sunum Tabağı', aciklama: 'Ceviz ağacından el oyması kahve tabağı.', fiyat: 290, kategori: 'Ahşap', resimUrl: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?auto=format&fit=crop&w=600&q=80' },
//   { _id: 'mock4', baslik: 'Aromaterapi Mum Seti', aciklama: 'Soya mumu ve lavanta özlü özel esans.', fiyat: 220, kategori: 'Mum', resimUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80' },
//   { _id: 'mock5', baslik: 'Özel Tasarım Gümüş Kolye', aciklama: 'El işçiliği minimalist zarif tasarım.', fiyat: 520, kategori: 'Takı', resimUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80' },
//   { _id: 'mock6', baslik: 'Derili El Örgüsü Çanta', aciklama: 'Hasır ip ve hakiki deri detaylı.', fiyat: 640, kategori: 'Çanta', resimUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80' },
//   { _id: 'mock7', baslik: 'Toprak Sırlı Kupa Seti', aciklama: '2 adet yüksek derecede pişirilmiş seramik kupa.', fiyat: 310, kategori: 'Seramik', resimUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
//   { _id: 'mock8', baslik: 'El Yapımı Ahşap Abajur', aciklama: 'Doğal kütükten sıcak aydınlatma.', fiyat: 780, kategori: 'Ahşap', resimUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80' },
// ];

// export default function BestSellers({ products = [] }) {
//   const [visibleCount, setVisibleCount] = useState(4);

//   const sourceProducts = products.length > 0 ? products : mockBestSellers;
//   const currentProducts = sourceProducts.slice(0, visibleCount);
//   const hasMore = visibleCount < sourceProducts.length;

//   const handleLoadMore = () => {
//     setVisibleCount((prev) => prev + 4);
//   };

//   return (
//     <Container maxWidth="lg" sx={{ mb: 8, mt: 2 }}>
//       {/* KATEGORİLER GİBİ SOLA HİZALANMIŞ BAŞLIK ALANI */}
//       <Box sx={{ textAlign: 'left', mb: 3 }}>
//         <Typography 
//           variant="overline" 
//           sx={{ 
//             letterSpacing: 2, 
//             color: '#946D6D', 
//             fontWeight: 800, 
//             display: 'inline-flex', 
//             alignItems: 'center', 
//             gap: 0.5 
//           }}
//         >
//           <LocalFireDepartmentOutlined sx={{ fontSize: '18px', color: '#946D6D' }} />
//           HAFTANIN FAVORİLERİ
//         </Typography>
//         <Typography variant="h4" fontWeight="800" sx={{ color: '#2E3B55', letterSpacing: '-0.5px', mt: 0.2 }}>
//           En Çok Satan Ürünler
//         </Typography>
//       </Box>

//       {/* 4 EŞİT SÜTUNDAN OLUŞAN GRID */}
//       <Grid container spacing={3} justifyContent="flex-start">
//         {currentProducts.map((product, index) => (
//           <Grid item key={product._id || index} xs={12} sm={6} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
//             <ProductCard product={product} />
//           </Grid>
//         ))}
//       </Grid>

//       {hasMore && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
//           <Button
//             variant="outlined"
//             size="large"
//             onClick={handleLoadMore}
//             endIcon={<KeyboardArrowDownOutlined />}
//             sx={{
//               borderRadius: '16px',
//               px: 4,
//               py: 1.4,
//               borderColor: '#A290B7',
//               color: '#946D6D',
//               fontWeight: 700,
//               fontSize: '0.95rem',
//               backgroundColor: 'rgba(253, 244, 210, 0.6)',
//               backdropFilter: 'blur(8px)',
//               '&:hover': {
//                 borderColor: '#946D6D',
//                 backgroundColor: '#946D6D',
//                 color: '#FFFFFF'
//               }
//             }}
//           >
//             Daha Fazla Ürün Göster ({sourceProducts.length - visibleCount} ürün kaldı)
//           </Button>
//         </Box>
//       )}
//     </Container>
//   );
// }



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Container, Button, Grid, CircularProgress } from '@mui/material';
import LocalFireDepartmentOutlined from '@mui/icons-material/LocalFireDepartmentOutlined';
import KeyboardArrowDownOutlined from '@mui/icons-material/KeyboardArrowDownOutlined';
import ProductCard from './ProductCard';
import { productService } from '../api/productService';

export default function BestSellers({ products = [] }) {
const [fetchedProducts, setFetchedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    if (products.length > 0) {
      setFetchedProducts(products);
      setLoading(false);
      return;
    }

    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        // Axios yerine doğrudan servisteki fonksiyonu çağırıyoruz
        const data = await productService.getBestSellers();
        setFetchedProducts(data);
      } catch (err) {
        console.error("En çok satanlar çekilemedi:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [products]);

  const currentProducts = fetchedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < fetchedProducts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
        <CircularProgress sx={{ color: '#946D6D' }} />
      </Box>
    );
  }

  if (error || fetchedProducts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', my: 10 }}>
        <Typography variant="h6" color="text.secondary">
          Şu an için favori ürün bulunmuyor.
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mb: 8, mt: 2 }}>
      <Box sx={{ textAlign: 'left', mb: 3 }}>
        <Typography 
          variant="overline" 
          sx={{ 
            letterSpacing: 2, 
            color: '#946D6D', 
            fontWeight: 800, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 0.5 
          }}
        >
          <LocalFireDepartmentOutlined sx={{ fontSize: '18px', color: '#946D6D' }} />
          HAFTANIN FAVORİLERİ
        </Typography>
        <Typography variant="h4" fontWeight="800" sx={{ color: '#2E3B55', letterSpacing: '-0.5px', mt: 0.2 }}>
          En Çok Satan Ürünler
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="flex-start">
        {currentProducts.map((product) => (
          <Grid item key={product._id} xs={12} sm={6} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
            <ProductCard 
              product={{
                ...product,
                // Modeldeki anahtarları ProductCard'ın beklediği formata eşliyoruz
                // Eğer ProductCard'ı modeline göre güncellediysen bu mapleme kısmına gerek kalmaz
                baslik: product.title,
                fiyat: product.price,
                resimUrl: product.image,
                kategori: product.category
              }} 
            />
          </Grid>
        ))}
      </Grid>

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={handleLoadMore}
            endIcon={<KeyboardArrowDownOutlined />}
            sx={{
              borderRadius: '16px',
              px: 4,
              py: 1.4,
              borderColor: '#A290B7',
              color: '#946D6D',
              fontWeight: 700,
              fontSize: '0.95rem',
              backgroundColor: 'rgba(253, 244, 210, 0.6)',
              backdropFilter: 'blur(8px)',
              '&:hover': {
                borderColor: '#946D6D',
                backgroundColor: '#946D6D',
                color: '#FFFFFF'
              }
            }}
          >
            Daha Fazla Ürün Göster ({fetchedProducts.length - visibleCount} ürün kaldı)
          </Button>
        </Box>
      )}
    </Container>
  );
}