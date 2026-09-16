import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Box, IconButton } from '@mui/material';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { scrollPageTop } from '../hooks/useSmoothScroll';
import HeroBanner from '../components/HeroBanner';
import CategoryProductList from '../components/CategoryProductList';
import DeferredMount from '../components/DeferredMount';
import Reveal from '../components/Reveal';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import { isSuperAdmin } from '../utils/roles';

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
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 420);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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

            <LazyBlock minHeight={240}>
                <WeeklyAteliers />
            </LazyBlock>

            <LazyBlock minHeight={280}>
                <Reveal>
                    <NewArrivals />
                </Reveal>
            </LazyBlock>

            <LazyBlock minHeight={360}>
                <AtelierLookbook />
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

            {showTop && (
                <IconButton
                    aria-label="En üste git"
                    onClick={() => scrollPageTop(false)}
                    sx={{
                        position: 'fixed',
                        left: 16,
                        bottom: { xs: 96, md: 28 },
                        zIndex: 25,
                        width: 48,
                        height: 48,
                        bgcolor: '#2E3B55',
                        color: '#FFFFFF',
                        boxShadow: '0 10px 24px -12px rgba(46,59,85,0.55)',
                        '&:hover': { bgcolor: '#946D6D', transform: 'translateY(-2px)' },
                        transition: 'transform 0.2s ease, background-color 0.2s ease'
                    }}
                >
                    <KeyboardArrowUpRoundedIcon />
                </IconButton>
            )}
        </Box>
    );
}
