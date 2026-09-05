
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import HeroBanner from '../components/HeroBanner';
import BestSellers from '../components/BestSellers'; 
import CategoryProductList from '../components/CategoryProductList';
import API from '../api/api';

export default function HomePage({ 
    user, 
    searchQuery, 
    onNavigateAuth, // Çift yazım düzeltildi (Sadece 1 kere var)
    onAddToCart = (urun) => console.log("Sepete eklenen ürün:", urun),
    onToggleFavorite = (id) => console.log("Favori tıklanan id:", id),
    favorites = [] 
}) {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await API.get('/products');
                setProducts(res.data);
            } catch (err) {
                console.error('Ürünler çekilemedi:', err);
            }
        };
        fetchProducts();
    }, []);

    // SADECE ARAMA (SEARCH) FİLTRESİ
    // (Kategori filtrelemesini CategoryProductList kendi içinde yapıyor)
    const searchFilteredProducts = products.filter((product) => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
            product.baslik?.toLowerCase().includes(query) ||
            product.title?.toLowerCase().includes(query) || // Backend'den title mi baslik mi geliyor emin olmak için ikisini de ekledik
            product.kategori?.toLowerCase().includes(query) ||
            product.renk?.toLowerCase().includes(query)
        );
    });

    return (
        <Box sx={{ width: '100%', overflowX: 'hidden' }}>
            {/* 1. HERO BANNER */}
            <HeroBanner user={user} onNavigateAuth={onNavigateAuth} />

            {/* 2. KAYDIRILABİLİR EN ÇOK SATAN ÜRÜNLER (BEST SELLERS) */}
            <BestSellers products={products} onAddToCart={onAddToCart} />

            {/* 3. KATEGORİ BAR VE ÜRÜNLER VİTRİNİ (Hepsi Bir Arada) */}
            {/* Ürünleri manuel Grid ile basmak yerine akıllı bileşenimize gönderiyoruz */}
            <CategoryProductList
                products={searchFilteredProducts} // Navbar'dan arama yapıldıysa süzülmüş liste, yapılmadıysa tüm liste gider
                onAddToCart={onAddToCart}
                onToggleFavorite={onToggleFavorite}
                favorites={favorites}
            />
        </Box>
    );
}