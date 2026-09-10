import { useEffect, useRef, useState } from 'react';
import { Box, Container, Skeleton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { imgBagOrange } from '../assets/media';
import { lookbookService, mediaUrl } from '../api/lookbookService';
import HomepageFilm from './HomepageFilm';
import Reveal from './Reveal';

const TOP_CLIPS = [
  { key: 'orgu-doku', label: 'El örgüsü detay' },
  { key: 'ahsap-sap', label: 'Ahşap sap detay' }
];

const isVideoUrl = (value = '') => /\.(mp4|webm|ogg)(\?|$)/i.test(value);

// Kart yüksekliği sabit: video metadata'sı gelince yerleşim kaymaz
const CLIP_HEIGHT = { xs: 240, md: 360 };
const mediaSx = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
};

function StudioClip({ src, poster, label, onClick }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const isVideo = Boolean(src) && isVideoUrl(src);
  // Video dosyası ancak kart görünüme yaklaşınca indirilir
  const [activated, setActivated] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || !isVideo) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setActivated(true);
      },
      { threshold: 0.2, rootMargin: '250px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVideo]);

  // Oynatma, kaynak DOM'a bağlandıktan sonra denenir
  useEffect(() => {
    const node = videoRef.current;
    if (!node || !activated) return;
    if (visible) node.play?.().catch(() => {});
    else node.pause?.();
  }, [activated, visible]);

  return (
    <Box
      ref={wrapRef}
      onClick={onClick}
      sx={{
        position: 'relative',
        borderRadius: { xs: '22px', md: '28px' },
        overflow: 'hidden',
        height: CLIP_HEIGHT,
        bgcolor: '#1E2738',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .45s cubic-bezier(.22,.61,.36,1), box-shadow .45s ease',
        '&:hover': onClick
          ? { transform: 'translateY(-6px)', boxShadow: '0 26px 50px -22px rgba(30,39,56,0.55)' }
          : undefined
      }}
    >
      {isVideo ? (
        <Box
          component="video"
          ref={videoRef}
          src={activated ? src : undefined}
          poster={poster}
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="none"
          sx={mediaSx}
        />
      ) : (
        <Box
          component="img"
          src={poster || src}
          alt={label}
          loading="lazy"
          decoding="async"
          sx={mediaSx}
        />
      )}
      <Typography
        sx={{
          position: 'absolute',
          left: 14,
          bottom: 12,
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.85rem',
          textShadow: '0 2px 10px rgba(0,0,0,0.45)'
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default function AtelierLookbook() {
  const navigate = useNavigate();
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const lookbookRes = await lookbookService.list(false, 'lookbook');
        if (cancelled) return;

        const byKey = new Map((lookbookRes.items || []).map((item) => [item.key, item]));
        const fromDb = TOP_CLIPS.map((slot) => {
          const item = byKey.get(slot.key);
          const src = mediaUrl(item?.videoUrl);
          if (!src) return null;
          return {
            id: item.product || null,
            src,
            poster: mediaUrl(item.posterUrl) || imgBagOrange,
            label: slot.label
          };
        }).filter(Boolean);

        setClips(fromDb);
      } catch (error) {
        console.error('Lookbook yüklenemedi:', error);
        if (!cancelled) setClips([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mb: { xs: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 800, color: '#A290B7' }}>
          ATÖLYE
        </Typography>
        <Typography component="h2" variant="h4" fontWeight={800} sx={{ color: '#2E3B55', letterSpacing: '-0.5px', fontSize: { xs: '1.45rem', md: '2.1rem' } }}>
          Çantalar hareket halinde
        </Typography>
        <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 0.8, maxWidth: 560 }}>
          El örgüsü detay, ahşap sap ve stüdyo ışığı. Koleksiyonun üç karesi.
        </Typography>
      </Box>

      {loading && !clips.length ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Skeleton variant="rounded" height={360} sx={{ borderRadius: '28px' }} />
          <Skeleton variant="rounded" height={360} sx={{ borderRadius: '28px' }} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: clips.length > 1 ? '1fr 1fr' : '1fr' },
            gap: { xs: 1.5, md: 2 }
          }}
        >
          {clips.map((clip, index) => (
            <Reveal key={clip.id || clip.label} delay={index * 0.08}>
              <StudioClip
                {...clip}
                onClick={clip.id ? () => navigate(`/product/${clip.id}`) : undefined}
              />
            </Reveal>
          ))}
        </Box>
      )}
      <Box sx={{ mt: { xs: 1.5, md: 2 } }}>
        <HomepageFilm embedded />
      </Box>
    </Container>
  );
}
