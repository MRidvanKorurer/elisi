import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import HeroBanner from '../components/HeroBanner';
import BestSellers from '../components/BestSellers';
import CategoryProductList from '../components/CategoryProductList';
import NewArrivals from '../components/NewArrivals';
import HowItWorks from '../components/HowItWorks';
import SellerCtaBanner from '../components/SellerCtaBanner';
import TrustStrip from '../components/TrustStrip';
import API from '../api/api';

export default function HomePage({
    user,
    searchQuery,
    onNavigateAuth,
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

    const searchFilteredProducts = products.filter((product) => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        return (
            product.baslik?.toLowerCase().includes(query) ||
            product.title?.toLowerCase().includes(query) ||
            product.kategori?.toLowerCase().includes(query) ||
            product.renk?.toLowerCase().includes(query)
        );
    });

    return (
        <Box sx={{ width: '100%', overflowX: 'hidden', pb: { xs: 2, md: 0 } }}>
            <HeroBanner user={user} onNavigateAuth={onNavigateAuth} />

            <CategoryProductList
                products={searchFilteredProducts}
                onAddToCart={onAddToCart}
                onToggleFavorite={onToggleFavorite}
                favorites={favorites}
            />

            <NewArrivals products={searchFilteredProducts} onAddToCart={onAddToCart} />

            <BestSellers products={products} onAddToCart={onAddToCart} />

            <HowItWorks />

            <SellerCtaBanner user={user} />

            <TrustStrip />
        </Box>
    );
}
