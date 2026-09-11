import React from 'react';
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
import { isSuperAdmin } from '../utils/roles';

export default function HomePage({
    user,
    onNavigateAuth,
    onAddToCart = (urun) => console.log("Sepete eklenen ürün:", urun),
    onToggleFavorite = (id) => console.log("Favori tıklanan id:", id),
    favorites = []
}) {
    return (
        <Box sx={{ width: '100%', overflowX: 'hidden', pb: { xs: 2, md: 0 } }}>
            <Seo
                path="/"
                description="Giyim, çanta, mum, takı, seramik, ahşap ve ev dekorasyonu dahil 19 el yapımı kategoride sınırlı sayıda tasarım. Nik Bag atölyesinden keşfedin: güvenli ödeme, hızlı kargo, 14 gün içinde iade."
            />

            <HeroBanner user={user} onNavigateAuth={onNavigateAuth} />

            <CategoryProductList
                onAddToCart={onAddToCart}
                onToggleFavorite={onToggleFavorite}
                favorites={favorites}
            />

            <Reveal>
                <NewArrivals onAddToCart={onAddToCart} />
            </Reveal>

            <AtelierLookbook />

            <Reveal>
                <BestSellers />
            </Reveal>

            <HowItWorks />

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
