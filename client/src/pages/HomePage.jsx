import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import HeroBanner from '../components/HeroBanner';
import BestSellers from '../components/BestSellers';
import CategoryProductList from '../components/CategoryProductList';
import NewArrivals from '../components/NewArrivals';
import AtelierLookbook from '../components/AtelierLookbook';
import HowItWorks from '../components/HowItWorks';
import SellerCtaBanner from '../components/SellerCtaBanner';
import TrustStrip from '../components/TrustStrip';
import Reveal from '../components/Reveal';
import Seo from '../components/Seo';
import { itemListSchema } from '../utils/schema';
import API from '../api/api';
import { isSuperAdmin } from '../utils/roles';

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
            <Seo
                path="/"
                description="El örgüsü çantalar, ahşap saplı tasarımlar, makrome, seramik ve el yapımı takılar. Sınırlı sayıda üretilen tasarım parçaları Nik Bag atölyesinden keşfedin: güvenli ödeme, hızlı kargo, 14 gün içinde iade."
                jsonLd={products.length > 0 ? itemListSchema(products, { path: '/' }) : null}
            />

            <HeroBanner user={user} onNavigateAuth={onNavigateAuth} />

            <Reveal>
                <CategoryProductList
                    products={searchFilteredProducts}
                    onAddToCart={onAddToCart}
                    onToggleFavorite={onToggleFavorite}
                    favorites={favorites}
                />
            </Reveal>

            <Reveal>
                <NewArrivals products={searchFilteredProducts} onAddToCart={onAddToCart} />
            </Reveal>

            <AtelierLookbook />

            <Reveal>
                <BestSellers products={products} onAddToCart={onAddToCart} />
            </Reveal>

            <Reveal>
                <HowItWorks />
            </Reveal>

            {!isSuperAdmin(user?.rol) && (
                <Reveal>
                    <SellerCtaBanner user={user} />
                </Reveal>
            )}

            <Reveal>
                <TrustStrip />
            </Reveal>
        </Box>
    );
}
