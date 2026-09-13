import React from 'react';
import { Box } from '@mui/material';
import HeroBanner from '../components/HeroBanner';
import WeeklyAteliers from '../components/WeeklyAteliers';
import BestSellers from '../components/BestSellers';
import CategoryProductList from '../components/CategoryProductList';
import NewArrivals from '../components/NewArrivals';
import AtelierLookbook from '../components/AtelierLookbook';
import HowItWorks from '../components/HowItWorks';
import SellerCtaBanner from '../components/SellerCtaBanner';
import TrustStrip from '../components/TrustStrip';
import Reveal from '../components/Reveal';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import { isSuperAdmin } from '../utils/roles';

export default function HomePage({
    user,
    onNavigateAuth,
    onAddToCart = (urun) => console.log("Sepete eklenen ürün:", urun),
    onToggleFavorite = (id) => console.log("Favori tıklanan id:", id),
    favorites = []
}) {
    const { t } = useTranslation('seo');
    return (
        <Box sx={{ width: '100%', overflowX: 'hidden', pb: { xs: 2, md: 0 } }}>
            <Seo
                path="/"
                description={t('homeDescription')}
            />

            <HeroBanner user={user} onNavigateAuth={onNavigateAuth} />

            <CategoryProductList
                onAddToCart={onAddToCart}
                onToggleFavorite={onToggleFavorite}
                favorites={favorites}
            />

            <WeeklyAteliers />

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
