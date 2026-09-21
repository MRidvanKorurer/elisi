import React, { Suspense, lazy } from 'react';
import { Box } from '@mui/material';
import HeroBanner from '../components/HeroBanner';
import CategoryProductList from '../components/CategoryProductList';
import DeferredMount from '../components/DeferredMount';
import Reveal from '../components/Reveal';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import { isSuperAdmin } from '../utils/roles';
import AtelierFilmSection from '../components/AtelierFilmSection';

const FeaturedShelf = lazy(() => import('../components/FeaturedShelf'));
const WeeklyAteliers = lazy(() => import('../components/WeeklyAteliers'));
const NewArrivals = lazy(() => import('../components/NewArrivals'));
const AtelierLookbook = lazy(() => import('../components/AtelierLookbook'));
const BestSellers = lazy(() => import('../components/BestSellers'));
const HowItWorks = lazy(() => import('../components/HowItWorks'));
const SellerCtaBanner = lazy(() => import('../components/SellerCtaBanner'));
const TrustStrip = lazy(() => import('../components/TrustStrip'));

const LazyBlock = ({ children, minHeight = 160 }) => (
    <DeferredMount minHeight={minHeight}>
        <Suspense fallback={<Box sx={{ minHeight }} />}>
            {children}
        </Suspense>
    </DeferredMount>
);

export default function HomePage({ user, onNavigateAuth }) {
    const { t } = useTranslation('seo');

    return (
        <Box sx={{ width: '100%', pb: { xs: 2, md: 0 } }}>
            <Seo
                path="/"
                description={t('homeDescription')}
            />

            <HeroBanner user={user} onNavigateAuth={onNavigateAuth} />

            <CategoryProductList />

            <LazyBlock minHeight={280}>
                <Reveal>
                    <FeaturedShelf />
                </Reveal>
            </LazyBlock>
            
            <LazyBlock minHeight={360}>
                <AtelierLookbook />
            </LazyBlock>

            <LazyBlock minHeight={240}>
                <WeeklyAteliers />
            </LazyBlock>

            <LazyBlock minHeight={280}>
                <Reveal>
                    <NewArrivals />
                </Reveal>
            </LazyBlock>

            <LazyBlock minHeight={360}>
                <AtelierFilmSection />
            </LazyBlock>



            <LazyBlock minHeight={280}>
                <Reveal>
                    <BestSellers />
                </Reveal>
            </LazyBlock>

            <LazyBlock minHeight={200}>
                <HowItWorks />
            </LazyBlock>

            {!isSuperAdmin(user?.rol) && (
                <LazyBlock minHeight={220}>
                    <Reveal>
                        <SellerCtaBanner user={user} />
                    </Reveal>
                </LazyBlock>
            )}

            <LazyBlock minHeight={140}>
                <Reveal>
                    <TrustStrip />
                </Reveal>
            </LazyBlock>
        </Box>
    );
}
