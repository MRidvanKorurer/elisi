import React, { useEffect, useState } from 'react';
import { Box, IconButton } from '@mui/material';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { scrollPageTop } from '../hooks/useSmoothScroll';
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
        <Box sx={{ width: '100%', overflowX: 'hidden', pb: { xs: 2, md: 0 } }}>
            <Seo
                path="/"
                description={t('homeDescription')}
            />

            <HeroBanner user={user} onNavigateAuth={onNavigateAuth} />

            <CategoryProductList />

            <WeeklyAteliers />

            <Reveal>
                <NewArrivals />
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

            {showTop && (
                <IconButton
                    aria-label="En üste git"
                    onClick={() => scrollPageTop(false)}
                    sx={{
                        position: 'fixed',
                        left: 16,
                        bottom: 28,
                        zIndex: 1100,
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
