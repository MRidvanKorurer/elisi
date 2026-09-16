import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';

/**
 * Ürün videosu: dosya tıklanıncaya kadar inmez, ekrandan çıkınca durur.
 */
export default function ProductClip({ src, poster, title = 'Ürün videosu' }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    videoRef.current?.play?.().catch(() => {});

    const node = wrapRef.current;
    const video = videoRef.current;
    if (!node || !video) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [armed]);

  return (
    <Box ref={wrapRef} sx={{ position: 'absolute', inset: 0, bgcolor: '#1E2738' }}>
      {armed ? (
        <Box
          component="video"
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          controls
          playsInline
          preload="none"
          controlsList="nodownload"
          disablePictureInPicture
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Box
          component="button"
          type="button"
          onClick={() => setArmed(true)}
          aria-label={`${title} videosunu oynat`}
          sx={{
            position: 'absolute',
            inset: 0,
            p: 0,
            border: 0,
            cursor: 'pointer',
            fontFamily: 'inherit',
            bgcolor: 'transparent'
          }}
        >
          {poster ? (
            <Box
              component="img"
              src={poster}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : null}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(30,39,56,0.08) 0%, rgba(30,39,56,0.45) 100%)'
            }}
          />
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(253,244,210,0.94)',
                color: '#946D6D',
                boxShadow: '0 12px 28px rgba(30,39,56,0.35)'
              }}
            >
              <PlayArrowRounded sx={{ fontSize: 36 }} />
            </Box>
          </Box>
          <Typography
            sx={{
              position: 'absolute',
              left: 16,
              bottom: 16,
              px: 1.1,
              py: 0.35,
              borderRadius: '999px',
              bgcolor: 'rgba(253,244,210,0.92)',
              color: '#946D6D',
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: 0.8
            }}
          >
            VİDEO
          </Typography>
        </Box>
      )}
    </Box>
  );
}
