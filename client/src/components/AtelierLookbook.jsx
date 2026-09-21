// import { useEffect, useRef, useState } from 'react';
// import { Box, Skeleton, Typography } from '@mui/material';
// import SiteContainer from './SiteContainer';
// import { useTranslation } from 'react-i18next';
// import useLocaleNavigate from '../i18n/useLocaleNavigate';
// import { lookbookService, mediaUrl } from '../api/lookbookService';
// import { LOOKBOOK_CLIPS } from '../utils/siteVideos';
// import HomepageFilm from './HomepageFilm';
// import Reveal from './Reveal';

// const TOP_CLIPS = [
//   { key: 'orgu-doku', labelKey: 'lookbook.knit' },
//   { key: 'ahsap-sap', labelKey: 'lookbook.wood' }
// ];

// const isVideoUrl = (value = '') =>
//   /\.(mp4|webm|ogg)(\?|$)/i.test(value) || /\/uploads\/videos\//i.test(value);

// // Kart yüksekliği sabit: video metadata'sı gelince yerleşim kaymaz
// const CLIP_HEIGHT = { xs: 240, md: 360 };
// const mediaSx = {
//   position: 'absolute',
//   inset: 0,
//   width: '100%',
//   height: '100%',
//   objectFit: 'cover',
//   display: 'block'
// };

// function StudioClip({ src, poster, label, onClick, media = 'auto' }) {
//   const wrapRef = useRef(null);
//   const videoRef = useRef(null);
//   const isVideo = Boolean(src) && (media === 'video' || (media !== 'image' && isVideoUrl(src)));
//   // Video dosyası ancak kart görünüme yaklaşınca indirilir
//   const [activated, setActivated] = useState(false);
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     const node = wrapRef.current;
//     if (!node || !isVideo) return undefined;

//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         setVisible(entry.isIntersecting);
//         if (entry.isIntersecting) setActivated(true);
//       },
//       { threshold: 0.2, rootMargin: '250px 0px' }
//     );
//     observer.observe(node);
//     return () => observer.disconnect();
//   }, [isVideo]);

//   // Oynatma, kaynak DOM'a bağlandıktan sonra denenir
//   useEffect(() => {
//     const node = videoRef.current;
//     if (!node || !activated) return;
//     if (visible) node.play?.().catch(() => {});
//     else node.pause?.();
//   }, [activated, visible]);

//   return (
//     <Box
//       ref={wrapRef}
//       onClick={onClick}
//       sx={{
//         position: 'relative',
//         borderRadius: { xs: '22px', md: '28px' },
//         overflow: 'hidden',
//         height: CLIP_HEIGHT,
//         bgcolor: '#1E2738',
//         cursor: onClick ? 'pointer' : 'default',
//         transition: 'transform .45s cubic-bezier(.22,.61,.36,1), box-shadow .45s ease',
//         '&:hover': onClick
//           ? { transform: 'translateY(-6px)', boxShadow: '0 26px 50px -22px rgba(30,39,56,0.55)' }
//           : undefined
//       }}
//     >
//       {isVideo ? (
//         <Box
//           component="video"
//           ref={videoRef}
//           src={src}
//           poster={poster || undefined}
//           muted
//           loop
//           playsInline
//           disablePictureInPicture
//           preload="metadata"
//           sx={mediaSx}
//         />
//       ) : (
//         <Box
//           component="img"
//           src={poster || src}
//           alt={label}
//           loading="lazy"
//           decoding="async"
//           sx={mediaSx}
//         />
//       )}
//       <Typography
//         sx={{
//           position: 'absolute',
//           left: 14,
//           bottom: 12,
//           color: '#fff',
//           fontWeight: 800,
//           fontSize: '0.85rem',
//           textShadow: '0 2px 10px rgba(0,0,0,0.45)'
//         }}
//       >
//         {label}
//       </Typography>
//     </Box>
//   );
// }

// export default function AtelierLookbook() {
//   const { t } = useTranslation('home');
//   const navigate = useLocaleNavigate();
//   const [clips, setClips] = useState(
//     TOP_CLIPS.map((slot) => ({
//       id: null,
//       src: LOOKBOOK_CLIPS[slot.key],
//       poster: '',
//       label: slot.labelKey
//     }))
//   );
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;

//     const load = async () => {
//       setLoading(true);
//       try {
//         const lookbookRes = await lookbookService.list(false, 'lookbook');
//         if (cancelled) return;

//         const uploaded = lookbookRes.items || [];
//         if (uploaded.length) {
//           setClips(
//             uploaded
//               .map((item) => ({
//                 id: item.product || null,
//                 src: mediaUrl(item.videoUrl) || mediaUrl(item.posterUrl),
//                 poster: mediaUrl(item.posterUrl),
//                 label: item.label || item.title || 'Atölye',
//                 media: item.videoUrl ? 'video' : 'image',
//                 translated: false
//               }))
//               .filter((clip) => clip.src)
//           );
//           return;
//         }

//         const byKey = new Map(uploaded.map((item) => [item.key, item]));
//         setClips(
//           TOP_CLIPS.map((slot) => {
//             const item = byKey.get(slot.key);
//             return {
//               id: item?.product || null,
//               src: LOOKBOOK_CLIPS[slot.key] || mediaUrl(item?.videoUrl),
//               poster: mediaUrl(item?.posterUrl),
//               label: slot.labelKey,
//               media: 'video',
//               translated: true
//             };
//           }).filter((clip) => clip.src)
//         );
//       } catch (error) {
//         console.error('Lookbook yüklenemedi:', error);
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };

//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   return (
//     <SiteContainer sx={{ mb: { xs: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
//       <Box sx={{ mb: 3 }}>
//         <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 800, color: '#A290B7' }}>
//           {t('lookbook.eyebrow')}
//         </Typography>
//         <Typography component="h2" variant="h4" fontWeight={800} sx={{ color: '#2E3B55', letterSpacing: '-0.5px', fontSize: { xs: '1.45rem', md: '2.1rem' } }}>
//           {t('lookbook.title')}
//         </Typography>
//         <Typography sx={{ color: '#6E5252', fontWeight: 600, mt: 0.8, maxWidth: 560 }}>
//           {t('lookbook.subtitle')}
//         </Typography>
//       </Box>

//       {loading ? (
//         <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
//           <Skeleton variant="rounded" height={360} sx={{ borderRadius: '28px' }} />
//           <Skeleton variant="rounded" height={360} sx={{ borderRadius: '28px' }} />
//         </Box>
//       ) : (
//         <Box
//           sx={{
//             display: 'grid',
//             gridTemplateColumns: { xs: '1fr', md: clips.length > 1 ? '1fr 1fr' : '1fr' },
//             gap: { xs: 1.5, md: 2 }
//           }}
//         >
//           {clips.map((clip, index) => (
//             <Reveal key={clip.id || clip.label} delay={index * 0.08}>
//               <StudioClip
//                 {...clip}
//                 label={clip.translated === false ? clip.label : t(clip.label)}
//                 onClick={clip.id ? () => navigate(`/urun/${clip.id}`) : undefined}
//               />
//             </Reveal>
//           ))}
//         </Box>
//       )}
//       <Box sx={{ mt: { xs: 1.5, md: 2 } }}>
//         <HomepageFilm embedded />
//       </Box>
//     </SiteContainer>
//   );
// }



import { useEffect, useRef, useState } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import SiteContainer from './SiteContainer';
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
  const { t } = useTranslation('home');
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
        bgcolor: '#0F172A',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 12px 32px -12px rgba(15, 23, 42, 0.18)',
        transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-6px)',
              boxShadow: '0 24px 48px -16px rgba(15, 23, 42, 0.3)',
              '& .media-element': { transform: 'scale(1.05)' },
              '& .cta-button': { opacity: 1, transform: 'translateX(0)' }
            }
          : undefined
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

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.8) 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 2,
          px: 1.6,
          py: 0.6,
          borderRadius: '100px',
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.8
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: isVideo ? '#10B981' : '#6366F1'
          }}
        />
        <Typography
          sx={{
            color: '#FFFFFF',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          {isVideo
            ? t('lookbook.badgeVideo', 'Canlı Detay')
            : t('lookbook.badgeImage', 'Atölye')}
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          left: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          bottom: { xs: 16, md: 24 },
          zIndex: 2,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 1.5
        }}
      >
        <Typography
          sx={{
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: { xs: '1.05rem', md: '1.25rem' },
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >
          {label}
        </Typography>

        {onClick && (
          <Box
            className="cta-button"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.8,
              py: 0.7,
              borderRadius: '100px',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              color: '#0F172A',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              opacity: { xs: 1, md: 0.85 },
              transform: { xs: 'none', md: 'translateX(-4px)' },
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <span>{t('lookbook.examine', 'İncele')}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Box>
        )}
      </Box>
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
    <SiteContainer sx={{ mb: { xs: 6, md: 8 }, px: { xs: 2.5, sm: 4 } }}>
      <Box sx={{ mb: { xs: 3.5, md: 5 }, maxWidth: 640 }}>
        <Typography
          variant="overline"
          sx={{
            letterSpacing: '0.18em',
            fontWeight: 800,
            color: '#8B5CF6',
            fontSize: '0.75rem',
            display: 'block',
            mb: 0.5
          }}
        >
          {t('lookbook.eyebrow', 'ATÖLYE LOOKBOOK')}
        </Typography>
        <Typography
          component="h2"
          variant="h4"
          fontWeight={800}
          sx={{
            color: '#0F172A',
            letterSpacing: '-0.03em',
            fontSize: { xs: '1.65rem', sm: '2rem', md: '2.4rem' },
            lineHeight: 1.15
          }}
        >
          {t('lookbook.title', 'Zanaat ve Doğal Dokular')}
        </Typography>
        <Typography
          sx={{
            color: '#64748B',
            fontWeight: 500,
            mt: 1.2,
            fontSize: { xs: '0.92rem', md: '1.05rem' },
            lineHeight: 1.5
          }}
        >
          {t('lookbook.subtitle', 'Özel tasarım koleksiyonlarımızdaki ince işçiliği ve özenle seçilmiş materyalleri keşfedin.')}
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
                  onClick={clip.id ? () => navigate(`/urun/${clip.id}`) : undefined}
                />
              </Reveal>
            );
          })}
        </Box>
      )}
    </SiteContainer>
  );
}