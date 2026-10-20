import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import SiteContainer from './SiteContainer';
import { homeEyebrowSx, homeFont, homeSectionSx, homeSubtitleSx, homeTitleSx } from './homeType';
import TravelExploreOutlined from '@mui/icons-material/TravelExploreOutlined';
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined';
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined';

const STEP_META = [
  { n: '01', Icon: TravelExploreOutlined, titleKey: 'how.s1Title', textKey: 'how.s1Text' },
  { n: '02', Icon: ShoppingBagOutlined, titleKey: 'how.s2Title', textKey: 'how.s2Text' },
  { n: '03', Icon: LocalShippingOutlined, titleKey: 'how.s3Title', textKey: 'how.s3Text' }
];

function Step({ step, last }) {
  const Icon = step.Icon;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: { xs: '52px minmax(0, 1fr)', md: '1fr' },
        columnGap: 1.6,
        minWidth: 0,
        pb: { xs: last ? 0 : 2.6, md: 0 }
      }}
    >
      {!last ? (
        <Box
          aria-hidden
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'absolute',
            left: 25,
            top: 52,
            bottom: 0,
            width: '1px',
            bgcolor: 'rgba(162,144,183,0.55)'
          }}
        />
      ) : null}

      <Box
        sx={{
          width: 52,
          height: 52,
          justifySelf: { md: 'start' },
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: '#FFFFFF',
          color: '#2E3B55',
          border: '1px solid rgba(148,109,109,0.18)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </Box>

      <Box sx={{ pt: { xs: 0.4, md: 1.6 }, minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: homeFont,
            color: '#A290B7',
            fontWeight: 800,
            fontSize: '0.72rem',
            letterSpacing: '0.16em'
          }}
        >
          {step.n}
        </Typography>
        <Typography
          component="h3"
          sx={{
            fontFamily: homeFont,
            color: '#2E3B55',
            fontWeight: 800,
            fontSize: { xs: '1.05rem', md: '1.15rem' },
            letterSpacing: '-0.03em',
            mt: 0.3
          }}
        >
          {step.title}
        </Typography>
        <Typography sx={{ ...homeSubtitleSx, mt: 0.7, maxWidth: 320 }}>
          {step.text}
        </Typography>
      </Box>
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
      sx={homeSectionSx}
    >
      <Box sx={{ mb: { xs: 2.6, md: 3.4 }, maxWidth: 560 }}>
        <Typography sx={homeEyebrowSx}>{t('how.eyebrow')}</Typography>
        <Typography id="how-it-works-title" component="h2" sx={homeTitleSx}>
          {t('how.title')}
        </Typography>
        <Typography sx={homeSubtitleSx}>{t('how.subtitle')}</Typography>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Box
          aria-hidden
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            top: 26,
            left: 26,
            right: '18%',
            height: '1px',
            bgcolor: 'rgba(162,144,183,0.45)'
          }}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            columnGap: { md: 4 },
            position: 'relative'
          }}
        >
          {steps.map((step, index) => (
            <Step key={step.n} step={step} last={index === steps.length - 1} />
          ))}
        </Box>
      </Box>
    </SiteContainer>
  );
}
