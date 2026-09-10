import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { lookbookService, mediaUrl } from '../api/lookbookService';
import { imgBanner2 } from '../assets/media';

export default function HomepageFilm({ embedded = false }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const [clip, setClip] = useState({
    src: mediaUrl('/uploads/videos/canta1.mp4'),
    label: 'Atölye filmi',
    poster: imgBanner2
  });
  const [activated, setActivated] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    lookbookService.list(false, 'homepage')
      .then((data) => {
        const item = (data.items || [])[0];
        if (cancelled || !item?.videoUrl) return;
        setClip({
          src: mediaUrl(item.videoUrl),
          label: item.label || item.title || 'Atölye filmi',
          poster: mediaUrl(item.posterUrl) || imgBanner2
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
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !activated) return;
    if (visible) node.play?.().catch(() => {});
    else node.pause?.();
  }, [activated, visible]);

  if (!clip.src) return null;

  const film = (
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
          src={activated ? clip.src : undefined}
          poster={clip.poster}
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="none"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(30,39,56,0.08) 20%, rgba(30,39,56,0.72) 100%)'
          }}
        />
        <Box sx={{ position: 'absolute', left: { xs: 22, md: 36 }, bottom: { xs: 22, md: 32 }, right: 24, zIndex: 1 }}>
          <Typography sx={{ letterSpacing: 2.2, fontWeight: 800, fontSize: 12, color: '#FDF4D2' }}>
            ATÖLYE FİLMİ
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.45rem', md: '2.15rem' }, color: '#fff', lineHeight: 1.15, mt: 0.6 }}>
            Çanta, ışık ve el emeği
          </Typography>
          <Typography sx={{ color: 'rgba(253,244,210,0.82)', fontWeight: 600, mt: 0.8, maxWidth: 460 }}>
            Koleksiyonun stüdyoda çekilmiş tam karesi.
          </Typography>
        </Box>
      </Box>
  );

  if (embedded) return film;

  return (
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
      {film}
    </Container>
  );
}
