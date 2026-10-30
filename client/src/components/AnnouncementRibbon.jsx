import { useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const KEYS = ['ribbon.handmade', 'ribbon.ateliers', 'ribbon.madeByHand', 'ribbon.custom', 'ribbon.art', 'ribbon.artist', 'ribbon.sell'];
const SPEED = 16;

export const ANNOUNCE_H = 36;

function Phrase({ text }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        fontWeight: 600,
        fontSize: '0.76rem',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        color: '#FBF6EA'
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 5,
          height: 5,
          mr: 1.6,
          borderRadius: '1px',
          bgcolor: '#E4C2B8',
          transform: 'rotate(45deg)',
          flexShrink: 0
        }}
      />
      {text}
      <Box component="span" sx={{ width: 28, flexShrink: 0 }} />
    </Box>
  );
}

export default function AnnouncementRibbon() {
  const { t } = useTranslation('common');
  const reduced = useReducedMotion();
  const phrases = KEYS.map((key) => t(key));
  const viewRef = useRef(null);
  const unitRef = useRef(null);
  const [copies, setCopies] = useState(8);
  const [duration, setDuration] = useState(80);

  useLayoutEffect(() => {
    if (reduced) return undefined;
    const fit = () => {
      const view = viewRef.current?.clientWidth || 0;
      const unit = unitRef.current?.scrollWidth || 0;
      if (!view || !unit) return;
      const next = Math.max(2, Math.ceil(view / unit) + 1);
      setCopies(next);
      setDuration(Math.max(48, Math.round((unit * next) / SPEED)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (viewRef.current) observer.observe(viewRef.current);
    return () => observer.disconnect();
  }, [reduced, phrases.join('|')]);

  const sequence = (key) => phrases.map((text, index) => (
    <Phrase key={`${key}-${text}-${index}`} text={text} />
  ));

  return (
    <Box
      role="region"
      aria-label={t('ribbon.label')}
      sx={{
        height: ANNOUNCE_H,
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
        bgcolor: '#2E3B55',
        color: '#FBF6EA',
        borderBottom: '1px solid rgba(228, 194, 184, 0.35)'
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: 1,
          pl: 2.2,
          pr: 1.8,
          flexShrink: 0,
          bgcolor: '#263246',
          borderRight: '1px solid rgba(251, 246, 234, 0.12)'
        }}
      >
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#E4C2B8', boxShadow: '0 0 0 3px rgba(228,194,184,0.2)' }} />
        <Box
          component="span"
          sx={{
            fontSize: '0.64rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#E4C2B8',
            lineHeight: 1
          }}
        >
          {t('ribbon.mark')}
        </Box>
      </Box>

      <Box
        ref={viewRef}
        sx={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box
          ref={unitRef}
          aria-hidden
          sx={{
            position: 'absolute',
            visibility: 'hidden',
            pointerEvents: 'none',
            display: 'flex',
            whiteSpace: 'nowrap'
          }}
        >
          {sequence('measure')}
        </Box>

        <Box
          aria-hidden={reduced ? undefined : true}
          data-ribbon=""
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: reduced ? '100%' : 'max-content',
            justifyContent: reduced ? 'center' : 'flex-start',
            flexWrap: reduced ? 'wrap' : 'nowrap',
            columnGap: reduced ? 2.5 : 0,
            rowGap: reduced ? 0.6 : 0,
            px: reduced ? 2 : 0,
            animation: reduced ? 'none' : `nikbag-ribbon ${duration}s linear infinite`,
            '@keyframes nikbag-ribbon': {
              from: { transform: 'translateX(0)' },
              to: { transform: 'translateX(-50%)' }
            },
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              width: '100%',
              justifyContent: 'center',
              flexWrap: 'wrap'
            },
            '&:hover': { animationPlayState: 'paused' }
          }}
        >
          {reduced
            ? phrases.map((text) => <Phrase key={text} text={text} />)
            : [0, 1].map((half) => (
              <Box key={half} sx={{ display: 'flex', flexShrink: 0 }}>
                {Array.from({ length: copies }, (_, copy) => sequence(`${half}-${copy}`))}
              </Box>
            ))}
        </Box>
      </Box>
    </Box>
  );
}
