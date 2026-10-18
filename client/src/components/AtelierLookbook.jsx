import { useEffect, useRef, useState } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import SiteContainer from './SiteContainer';
import { homeSectionSx, homeTitleSx } from './homeType';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import { lookbookService, mediaUrl } from '../api/lookbookService';
import { LOOKBOOK_CLIPS } from '../utils/siteVideos';
import Reveal from './Reveal';

const TOP_CLIPS = [
  { key: 'orgu-doku', labelKey: 'lookbook.knit', defaultText: 'Örgü & Doku' },
  { key: 'ahsap-sap', labelKey: 'lookbook.wood', defaultText: 'Ahşap İşçiliği' }
];

const isVideoUrl = (value = '') =>
  /\.(mp4|webm|ogg)(\?|$)/i.test(value) || /\/uploads\/videos\//i.test(value);

const CLIP_HEIGHT = { xs: 260, sm: 320, md: 380 };

const mediaSx = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
};

function StudioClip({ src, poster, label, onClick, media = 'auto' }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const isVideo = Boolean(src) && (media === 'video' || (media !== 'image' && isVideoUrl(src)));
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
        borderRadius: { xs: '20px', md: '28px' },
        overflow: 'hidden',
        height: CLIP_HEIGHT,
        bgcolor: '#F8F4EA',
        border: '1px solid rgba(148,109,109,0.12)',
        cursor: 'pointer'
      }}
    >
      {isVideo ? (
        <Box
          component="video"
          className="media-element"
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="metadata"
          sx={mediaSx}
        />
      ) : (
        <Box
          component="img"
          className="media-element"
          src={poster || src}
          alt={label}
          loading="lazy"
          decoding="async"
          sx={mediaSx}
        />
      )}

    </Box>
  );
}

export default function AtelierLookbook() {
  const { t } = useTranslation('home');
  const navigate = useLocaleNavigate();

  const [clips, setClips] = useState(
    TOP_CLIPS.map((slot) => ({
      id: null,
      src: LOOKBOOK_CLIPS[slot.key],
      poster: '',
      labelKey: slot.labelKey,
      defaultText: slot.defaultText,
      translated: true
    }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const lookbookRes = await lookbookService.list(false, 'lookbook');
        if (cancelled) return;

        const uploaded = lookbookRes?.items || [];
        if (uploaded.length > 0) {
          setClips(
            uploaded
              .map((item) => ({
                id: item.product || null,
                src: mediaUrl(item.videoUrl) || mediaUrl(item.posterUrl),
                poster: mediaUrl(item.posterUrl),
                label: item.label || item.title || t('lookbook.defaultClipTitle', 'Atölye Detayı'),
                media: item.videoUrl ? 'video' : 'image',
                translated: false
              }))
              .filter((clip) => clip.src)
          );
        } else {
          setClips(
            TOP_CLIPS.map((slot) => ({
              id: null,
              src: LOOKBOOK_CLIPS[slot.key],
              poster: '',
              labelKey: slot.labelKey,
              defaultText: slot.defaultText,
              media: 'video',
              translated: true
            })).filter((clip) => clip.src)
          );
        }
      } catch (error) {
        console.error('Lookbook verisi alınamadı:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const resolveLabel = (clip) => {
    if (clip.translated === false) {
      return clip.label || t('lookbook.defaultClipTitle', 'Atölye Detayı');
    }
    return t(clip.labelKey, clip.defaultText || 'Atölye Detayı');
  };

  return (
    <SiteContainer sx={homeSectionSx}>
      <Box sx={{ mb: { xs: 2.4, md: 3 }, maxWidth: 640 }}>
        <Typography component="h2" sx={homeTitleSx}>
          {t('lookbook.title', 'Çantalar hareket halinde')}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2, md: 3 } }}>
          <Skeleton variant="rounded" height={CLIP_HEIGHT.md} sx={{ borderRadius: { xs: '20px', md: '28px' } }} />
          <Skeleton variant="rounded" height={CLIP_HEIGHT.md} sx={{ borderRadius: { xs: '20px', md: '28px' } }} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: clips.length > 1 ? '1fr 1fr' : '1fr' },
            gap: { xs: 2, md: 3 }
          }}
        >
          {clips.map((clip, index) => {
            const displayLabel = resolveLabel(clip);
            return (
              <Reveal key={clip.id || clip.labelKey || index} delay={index * 0.1}>
                <StudioClip
                  {...clip}
                  label={displayLabel}
                  onClick={() => navigate('/kategori/canta')}
                />
              </Reveal>
            );
          })}
        </Box>
      )}
    </SiteContainer>
  );
}