import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import SiteContainer from './SiteContainer';
import { homeSectionSx } from './homeType';
import { lookbookService, mediaUrl } from '../api/lookbookService';

/** Admin panelde "Büyük film" altında yayında kayıt yoksa bölüm hiç görünmez. */
export default function HomepageFilm() {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const [clip, setClip] = useState(null);
  const [activated, setActivated] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    lookbookService.list(false, 'homepage')
      .then((data) => {
        const item = (data.items || []).find((entry) => entry.videoUrl);
        if (cancelled || !item) return;
        setClip({
          src: mediaUrl(item.videoUrl),
          poster: mediaUrl(item.posterUrl),
          eyebrow: item.label || '',
          title: item.title || '',
          subtitle: item.subtitle || ''
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setActivated(true);
      },
      { threshold: 0.25, rootMargin: '180px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [clip]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !activated) return;
    if (visible) node.play?.().catch(() => {});
    else node.pause?.();
  }, [activated, visible]);

  if (!clip?.src) return null;

  const hasText = Boolean(clip.eyebrow || clip.title || clip.subtitle);

  return (
    <SiteContainer sx={homeSectionSx}>
      <Box
        ref={wrapRef}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: '28px', md: '36px' },
          height: { xs: 320, md: 520 },
          bgcolor: '#1E2738',
          boxShadow: '0 28px 60px -28px rgba(30,39,56,0.45)'
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          src={clip.src}
          poster={clip.poster || undefined}
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="metadata"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
        {hasText ? (
          <>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(30,39,56,0.08) 20%, rgba(30,39,56,0.72) 100%)'
              }}
            />
            <Box sx={{ position: 'absolute', left: { xs: 22, md: 36 }, bottom: { xs: 22, md: 32 }, right: 24, zIndex: 1 }}>
              {clip.eyebrow ? (
                <Typography sx={{ letterSpacing: 2.2, fontWeight: 800, fontSize: 12, color: '#FDF4D2', textTransform: 'uppercase' }}>
                  {clip.eyebrow}
                </Typography>
              ) : null}
              {clip.title ? (
                <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.45rem', md: '2.15rem' }, color: '#fff', lineHeight: 1.15, mt: 0.6 }}>
                  {clip.title}
                </Typography>
              ) : null}
              {clip.subtitle ? (
                <Typography sx={{ color: 'rgba(253,244,210,0.82)', fontWeight: 600, mt: 0.8, maxWidth: 460 }}>
                  {clip.subtitle}
                </Typography>
              ) : null}
            </Box>
          </>
        ) : null}
      </Box>
    </SiteContainer>
  );
}
