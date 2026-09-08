import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, IconButton, Rating, TextField, Typography } from '@mui/material';
import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import { reviewService } from '../api/reviewService';

const initialsOf = (name = '') => String(name).trim().charAt(0).toUpperCase() || 'N';

const sameUser = (user, reviewUser) => {
  const a = String(user?._id || user?.id || '');
  const b = String(reviewUser?._id || reviewUser?.id || '');
  return Boolean(a && b && a === b);
};

function ReviewAvatar({ name, src, size = 34 }) {
  return (
    <Avatar src={src || undefined} alt={name} sx={{ width: size, height: size, bgcolor: '#B0CDE6', color: '#2E3B55', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
      {initialsOf(name)}
    </Avatar>
  );
}

export default function ProductReviews({ productId, user, onSummaryChange }) {
  const navigate = useNavigate();
  const photoInput = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [numReviews, setNumReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [lightbox, setLightbox] = useState('');

  const refreshEligibility = async () => {
    if (!user || !productId) {
      setEligibility(null);
      return;
    }
    const data = await reviewService.getEligibility(productId);
    setEligibility(data);
  };

  const loadReviews = async () => {
    if (!productId) return;
    const data = await reviewService.getReviews(productId);
    setReviews(data.reviews || []);
    setNumReviews(data.numReviews || 0);
    setAvgRating(data.rating || 0);
    onSummaryChange?.({ rating: data.rating, numReviews: data.numReviews });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setComment('');
    setRating(5);
    setPhotos([]);
    setComposerOpen(false);

    reviewService.getReviews(productId)
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews || []);
        setNumReviews(data.numReviews || 0);
        setAvgRating(data.rating || 0);
        onSummaryChange?.({ rating: data.rating, numReviews: data.numReviews });
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => {
    if (!user || !productId) {
      setEligibility(null);
      return undefined;
    }
    let cancelled = false;
    reviewService.getEligibility(productId)
      .then((data) => {
        if (!cancelled) setEligibility(data);
      })
      .catch(() => {
        if (!cancelled) setEligibility({ canReview: false, reason: 'Yorum yetkisi kontrol edilemedi.' });
      });
    return () => { cancelled = true; };
  }, [productId, user]);

  useEffect(() => {
    if (!eligibility?.myReview) return;
    setRating(Number(eligibility.myReview.rating) || 5);
    setComment(eligibility.myReview.comment || '');
  }, [eligibility]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await reviewService.createReview(productId, {
        rating,
        comment,
        photos: photos.map((item) => item.file)
      });
      setComment('');
      setRating(5);
      setPhotos([]);
      setComposerOpen(false);
      await loadReviews();
      await refreshEligibility();
    } catch (err) {
      setError(err.response?.data?.mesaj || err.response?.data?.message || 'Yorum gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    setDeletingId(reviewId);
    try {
      await reviewService.deleteReview(reviewId);
      await loadReviews();
      await refreshEligibility();
    } catch (err) {
      setError(err.response?.data?.mesaj || 'Yorum silinemedi.');
    } finally {
      setDeletingId('');
    }
  };

  const addPhotos = (fileList) => {
    const next = Array.from(fileList || [])
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 4 - photos.length)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    if (next.length) setPhotos((prev) => [...prev, ...next].slice(0, 4));
  };

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <Box sx={{ mt: { xs: 4, md: 5 }, pt: { xs: 2.4, md: 3 }, borderTop: '1px solid rgba(148,109,109,0.16)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.2, mb: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography component="h2" fontWeight={800} sx={{ color: '#2E3B55', fontSize: '1.15rem', lineHeight: 1.2 }}>
            Yorumlar
          </Typography>
          <Typography sx={{ color: '#6E5252', fontWeight: 700, fontSize: '0.85rem' }}>
            {numReviews > 0 ? `${Number(avgRating).toFixed(1)} / 5 · ${numReviews} yorum` : 'Henüz yorum yok'}
          </Typography>
          {numReviews > 0 && (
            <Rating value={Number(avgRating) || 0} precision={0.1} readOnly size="small" sx={{ color: '#DDA15E' }} />
          )}
        </Box>
        {eligibility?.canReview && !composerOpen && (
          <Button
            onClick={() => setComposerOpen(true)}
            sx={{ flexShrink: 0, borderRadius: '999px', px: 1.8, py: 0.7, fontWeight: 800, fontSize: '0.82rem', color: '#FFFFFF', backgroundColor: '#946D6D', textTransform: 'none', '&:hover': { backgroundColor: '#7c5a5a' } }}
          >
            Yorum yaz
          </Button>
        )}
        {!user && (
          <Button
            onClick={() => navigate('/auth')}
            sx={{ flexShrink: 0, borderRadius: '999px', px: 1.8, py: 0.7, fontWeight: 800, fontSize: '0.82rem', color: '#2E3B55', backgroundColor: '#FFFFFF', border: '1px solid rgba(148,109,109,0.22)', textTransform: 'none' }}
          >
            Giriş yap
          </Button>
        )}
      </Box>

      {eligibility?.canReview && composerOpen && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mb: 1.6, p: 1.6, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid rgba(148,109,109,0.16)' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ReviewAvatar name={user.adSoyad} src={user.avatarUrl} size={32} />
            <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }}>{user.adSoyad || 'Siz'}</Typography>
            <Rating value={rating} onChange={(_, value) => setRating(value || 1)} size="small" sx={{ color: '#DDA15E' }} />
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Deneyimini kısaca yaz…"
            sx={{
              mb: 1.1,
              '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#FFFDF6' },
              '& .MuiInputBase-input': { color: '#2E3B55', fontSize: '0.92rem', lineHeight: 1.5 },
              '& .MuiInputBase-input::placeholder': { color: '#8A7373', opacity: 1 }
            }}
          />
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              addPhotos(event.target.files);
              event.target.value = '';
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              {photos.map((item, index) => (
                <Box key={item.preview} sx={{ position: 'relative', width: 44, height: 44, borderRadius: '8px', overflow: 'hidden' }}>
                  <Box component="img" src={item.preview} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton
                    size="small"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                    sx={{ position: 'absolute', top: 0, right: 0, width: 18, height: 18, p: 0, bgcolor: 'rgba(46,59,85,0.75)', color: '#fff' }}
                  >
                    <CloseRounded sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ))}
              {photos.length < 4 && (
                <IconButton type="button" onClick={() => photoInput.current?.click()} sx={{ width: 44, height: 44, borderRadius: '8px', border: '1px dashed rgba(148,109,109,0.35)', color: '#946D6D' }}>
                  <AddPhotoAlternateOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.8 }}>
              <Button type="button" onClick={() => setComposerOpen(false)} sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#6E5252', textTransform: 'none' }}>Vazgeç</Button>
              <Button
                type="submit"
                disabled={submitting || comment.trim().length < 10}
                sx={{ borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem', px: 1.8, color: '#FFFFFF', backgroundColor: '#2E3B55', textTransform: 'none', '&:hover': { backgroundColor: '#946D6D' }, '&.Mui-disabled': { color: '#FFFFFF', backgroundColor: '#C4B4B4' } }}
              >
                {submitting ? 'Gönderiliyor' : 'Gönder'}
              </Button>
            </Box>
          </Box>
          {error ? <Typography sx={{ color: '#946D6D', fontWeight: 700, mt: 0.8, fontSize: '0.8rem' }}>{error}</Typography> : null}
        </Box>
      )}

      {loading ? (
        <Typography sx={{ color: '#6E5252', fontWeight: 700, fontSize: '0.9rem' }}>Yorumlar yükleniyor…</Typography>
      ) : reviews.length === 0 ? (
        <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.9rem' }}>Bu ürüne henüz yorum yazılmamış.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {visibleReviews.map((review) => (
            <Box
              key={review.id}
              sx={{
                display: 'flex',
                gap: 1.2,
                p: 1.4,
                borderRadius: '16px',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(148,109,109,0.14)'
              }}
            >
              <ReviewAvatar name={review.user?.adSoyad} src={review.user?.avatarUrl} size={38} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.4 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.92rem', wordBreak: 'break-word' }}>
                      {review.user?.adSoyad || 'Üye'}
                    </Typography>
                    <Rating value={Number(review.rating) || 0} readOnly size="small" sx={{ color: '#DDA15E' }} />
                  </Box>
                  {sameUser(user, review.user) && (
                    <IconButton size="small" onClick={() => handleDelete(review.id)} disabled={deletingId === review.id} sx={{ color: '#946D6D' }} aria-label="Yorumu sil">
                      <DeleteOutlineRounded sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>
                <Box
                  component="p"
                  sx={{
                    m: 0,
                    mt: 0.4,
                    color: '#2E3B55',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    fontWeight: 600,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflow: 'visible'
                  }}
                >
                  {String(review.comment || review.yorum || '').trim() || 'Bu yorumda metin kaydı bulunamadı.'}
                </Box>
                {Array.isArray(review.images) && review.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.7, mt: 0.9, flexWrap: 'wrap' }}>
                    {review.images.slice(0, 4).map((src) => (
                      <Box
                        key={src}
                        component="button"
                        type="button"
                        onClick={() => setLightbox(src)}
                        sx={{ p: 0, border: 'none', width: 56, height: 56, borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', bgcolor: '#F3EDE4' }}
                      >
                        <Box component="img" src={src} alt="Yorum fotoğrafı" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
          {reviews.length > 3 && (
            <Button onClick={() => setShowAll((prev) => !prev)} sx={{ alignSelf: 'flex-start', fontWeight: 800, fontSize: '0.82rem', color: '#946D6D', px: 0, textTransform: 'none' }}>
              {showAll ? 'Daha az göster' : `${reviews.length - 3} yorum daha`}
            </Button>
          )}
        </Box>
      )}

      {lightbox ? (
        <Box
          onClick={() => setLightbox('')}
          sx={{ position: 'fixed', inset: 0, zIndex: 40, bgcolor: 'rgba(30,39,56,0.78)', display: 'grid', placeItems: 'center', p: 2, cursor: 'zoom-out' }}
        >
          <Box component="img" src={lightbox} alt="" sx={{ maxWidth: '100%', maxHeight: '88vh', borderRadius: '16px' }} />
        </Box>
      ) : null}
    </Box>
  );
}
