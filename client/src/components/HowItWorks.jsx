import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import SiteContainer from './SiteContainer';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';

const STEP_META = [
  { n: '01', Icon: TravelExploreOutlined, titleKey: 'how.s1Title', textKey: 'how.s1Text', tint: '#D7E7F4', ink: '#2E3B55' },
  { n: '02', Icon: ShoppingBagOutlined, titleKey: 'how.s2Title', textKey: 'how.s2Text', tint: '#E4DCF0', ink: '#6B5A82' },
  { n: '03', Icon: LocalShippingOutlined, titleKey: 'how.s3Title', textKey: 'how.s3Text', tint: '#EDD8D4', ink: '#946D6D' }
];

function StepCard({ step }) {
  const Icon = step.Icon;

  return (
    <Box
      sx={{
        minWidth: 0,
        height: '100%',
        p: { xs: 2.2, md: 2.6 },
        borderRadius: '22px',
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(148,109,109,0.12)',
        borderTop: `3px solid ${step.ink}`,
        boxShadow: '0 16px 36px -24px rgba(46,59,85,0.32)',
        transition: 'transform 220ms ease, box-shadow 220ms ease',
        '&:hover': {
          transform: { sm: 'translateY(-4px)' },
          boxShadow: '0 22px 40px -22px rgba(46,59,85,0.4)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4, mb: 1.8 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: step.tint,
            color: step.ink
          }}
        >
          <Icon sx={{ fontSize: 24 }} />
        </Box>
        <Typography
          component="span"
          sx={{
            color: step.ink,
            fontWeight: 800,
            fontSize: '0.78rem',
            letterSpacing: 1.6
          }}
        >
          {step.n}
        </Typography>
      </Box>

      <Typography
        component="h3"
        sx={{
          color: '#2E3B55',
          fontWeight: 800,
          fontSize: { xs: '1.05rem', md: '1.15rem' },
          letterSpacing: '-0.3px',
          mb: 0.7
        }}
      >
        {step.title}
      </Typography>
      <Typography sx={{ color: '#6E5252', fontWeight: 600, lineHeight: 1.65, fontSize: '0.88rem' }}>
        {step.text}
      </Typography>
    </Box>
  );
}

export default function HowItWorks() {
  const { t } = useTranslation('home');
  const steps = STEP_META.map((step) => ({ ...step, title: t(step.titleKey), text: t(step.textKey) }));
  return (
    <SiteContainer
      component="section"
      aria-labelledby="how-it-works-title"
      sx={{ mb: { xs: 6, md: 8 }, px: { xs: 2, sm: 3 } }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 800, color: '#A290B7' }}>
          {t('how.eyebrow')}
        </Typography>
        <Typography
          id="how-it-works-title"
          component="h2"
          variant="h4"
          fontWeight={800}
          sx={{ color: '#2E3B55', letterSpacing: '-0.5px', mt: 0.2, fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2.125rem' } }}
        >
          {t('how.title')}
        </Typography>
        <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 1, lineHeight: 1.7, maxWidth: 540 }}>
          {t('how.subtitle')}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr auto 1fr auto 1fr' },
          alignItems: 'stretch',
          gap: { xs: 1.6, sm: 1.2, md: 1.6 }
        }}
      >
        {steps.map((step, index) => (
          <React.Fragment key={step.n}>
            <StepCard step={step} />
              {index < steps.length - 1 && (
              <Box
                aria-hidden
                sx={{
                  display: { xs: 'none', sm: 'grid' },
                  placeItems: 'center',
                  color: '#A290B7',
                  opacity: 0.7
                }}
              >
                <ArrowForwardRounded sx={{ fontSize: 22 }} />
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>
    </SiteContainer>
  );
}
