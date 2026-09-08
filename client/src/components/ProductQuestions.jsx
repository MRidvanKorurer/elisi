import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, TextField, Typography } from '@mui/material';
import { questionService } from '../api/questionService';
import { isSuperAdmin } from '../utils/roles';

const initialsOf = (name = '') => String(name).trim().charAt(0).toUpperCase() || 'N';

const sameUser = (user, other) => {
  const a = String(user?._id || user?.id || '');
  const b = String(other?._id || other?.id || '');
  return Boolean(a && b && a === b);
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
};

function PersonAvatar({ name, src, size = 34 }) {
  return (
    <Avatar src={src || undefined} alt={name} sx={{ width: size, height: size, bgcolor: '#B0CDE6', color: '#2E3B55', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
      {initialsOf(name)}
    </Avatar>
  );
}

export default function ProductQuestions({ productId, productSellerId, user, onAnsweredChange }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [numQuestions, setNumQuestions] = useState(0);
  const [numAnswered, setNumAnswered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [answeringId, setAnsweringId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [canAnswerApi, setCanAnswerApi] = useState(false);

  const sellerId = String(productSellerId?._id || productSellerId || '');
  const canAnswer = Boolean(user) && (canAnswerApi || sellerId === String(user._id || user.id) || isSuperAdmin(user.rol));
  const canAsk = Boolean(user) && !canAnswer;

  const loadQuestions = async () => {
    if (!productId) return;
    const data = await questionService.getQuestions(productId, { limit: 20 });
    const list = data.questions || [];
    setQuestions(list);
    setNumQuestions(data.numQuestions || list.length);
    setNumAnswered(data.numAnswered || list.filter((item) => item.answer).length);
    setCanAnswerApi(Boolean(data.canAnswer));
    onAnsweredChange?.(list.filter((item) => item.answer).map((item) => ({ question: item.question, answer: item.answer })));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setDraft('');
    setComposerOpen(false);
    questionService.getQuestions(productId, { limit: 20 })
      .then((data) => {
        if (cancelled) return;
        const list = data.questions || [];
        setQuestions(list);
        setNumQuestions(data.numQuestions || list.length);
        setNumAnswered(data.numAnswered || list.filter((item) => item.answer).length);
        setCanAnswerApi(Boolean(data.canAnswer));
        onAnsweredChange?.(list.filter((item) => item.answer).map((item) => ({ question: item.question, answer: item.answer })));
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId]);

  const handleAsk = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await questionService.askQuestion(productId, draft);
      setDraft('');
      setComposerOpen(false);
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.mesaj || err.response?.data?.message || 'Soru gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (questionId) => {
    const answer = String(answerDrafts[questionId] || '').trim();
    setAnsweringId(questionId);
    setError('');
    try {
      await questionService.answerQuestion(questionId, answer);
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.mesaj || 'Yanıt kaydedilemedi.');
    } finally {
      setAnsweringId('');
    }
  };

  const handleDelete = async (questionId) => {
    setDeletingId(questionId);
    try {
      await questionService.deleteQuestion(questionId);
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.mesaj || 'Soru silinemedi.');
    } finally {
      setDeletingId('');
    }
  };

  const visible = showAll ? questions : questions.slice(0, 4);

  return (
    <Box sx={{ mt: { xs: 4, md: 5 }, pt: { xs: 2.4, md: 3 }, borderTop: '1px solid rgba(148,109,109,0.16)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.2, mb: 1.5, flexWrap: 'wrap' }}>
        <Box>
          <Typography component="h2" fontWeight={800} sx={{ color: '#2E3B55', fontSize: '1.15rem', lineHeight: 1.2 }}>
            Soru & cevap
          </Typography>
          <Typography sx={{ color: '#6E5252', fontWeight: 700, fontSize: '0.85rem', mt: 0.3 }}>
            {numQuestions > 0
              ? `${numQuestions} soru · ${numAnswered} yanıtlandı`
              : 'Bu ürün hakkında satıcıya sorun'}
          </Typography>
        </Box>
        {canAsk && !composerOpen && (
          <Button
            onClick={() => setComposerOpen(true)}
            sx={{ flexShrink: 0, borderRadius: '999px', px: 1.8, py: 0.7, fontWeight: 800, fontSize: '0.82rem', color: '#FFFFFF', backgroundColor: '#946D6D', textTransform: 'none', '&:hover': { backgroundColor: '#7c5a5a' } }}
          >
            Soru sor
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

      {canAsk && composerOpen && (
        <Box
          component="form"
          onSubmit={handleAsk}
          sx={{ mb: 1.6, p: 1.6, borderRadius: '16px', backgroundColor: '#FFFFFF', border: '1px solid rgba(148,109,109,0.16)' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonAvatar name={user.adSoyad} src={user.avatarUrl} size={32} />
            <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.9rem' }}>{user.adSoyad || 'Siz'}</Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ölçü, renk, teslimat… aklındaki soruyu yaz"
            sx={{
              mb: 1.1,
              '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#FFFDF6' },
              '& .MuiInputBase-input': { color: '#2E3B55', fontSize: '0.92rem', lineHeight: 1.5 }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.8 }}>
            <Button type="button" onClick={() => setComposerOpen(false)} sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#6E5252', textTransform: 'none' }}>Vazgeç</Button>
            <Button
              type="submit"
              disabled={submitting || draft.trim().length < 10}
              sx={{ borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem', px: 1.8, color: '#FFFFFF', backgroundColor: '#2E3B55', textTransform: 'none', '&:hover': { backgroundColor: '#946D6D' }, '&.Mui-disabled': { color: '#FFFFFF', backgroundColor: '#C4B4B4' } }}
            >
              {submitting ? 'Gönderiliyor' : 'Soruyu gönder'}
            </Button>
          </Box>
        </Box>
      )}

      {error ? <Typography sx={{ color: '#946D6D', fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>{error}</Typography> : null}

      {loading ? (
        <Typography sx={{ color: '#6E5252', fontWeight: 700, fontSize: '0.9rem' }}>Sorular yükleniyor…</Typography>
      ) : questions.length === 0 ? (
        <Typography sx={{ color: '#6E5252', fontWeight: 600, fontSize: '0.9rem' }}>Henüz soru yok. İlk soruyu sen sor.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1 }}>
          {visible.map((item) => {
            const mine = sameUser(user, item.user);
            const open = !item.answer;
            return (
              <Box
                key={item.id}
                sx={{
                  p: 1.5,
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(148,109,109,0.14)'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
                  <PersonAvatar name={item.user?.adSoyad} src={item.user?.avatarUrl} size={36} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                      <Typography fontWeight={800} sx={{ color: '#2E3B55', fontSize: '0.88rem' }}>
                        {item.user?.adSoyad} {mine ? '(siz)' : ''}
                      </Typography>
                      <Typography sx={{ color: '#A290B7', fontWeight: 700, fontSize: '0.72rem' }}>{formatDate(item.createdAt)}</Typography>
                    </Box>
                    <Typography sx={{ color: '#6E5252', mt: 0.4, fontSize: '0.9rem', lineHeight: 1.55 }}>{item.question}</Typography>
                    {(mine || canAnswer) && (
                      <Button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        sx={{ mt: 0.4, minWidth: 0, p: 0, fontWeight: 800, fontSize: '0.75rem', color: '#946D6D', textTransform: 'none' }}
                      >
                        {deletingId === item.id ? 'Siliniyor…' : 'Sil'}
                      </Button>
                    )}
                  </Box>
                </Box>

                {item.answer ? (
                  <Box sx={{ mt: 1.2, ml: { xs: 0, sm: 5.6 }, p: 1.2, borderRadius: '14px', bgcolor: 'rgba(176,205,230,0.22)' }}>
                    <Typography sx={{ color: '#2E3B55', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 0.4, mb: 0.4 }}>
                      SATICI YANITI · {formatDate(item.answeredAt)}
                    </Typography>
                    <Typography sx={{ color: '#2E3B55', fontSize: '0.88rem', lineHeight: 1.55 }}>{item.answer}</Typography>
                    {canAnswer ? (
                      <Button
                        onClick={() => setAnswerDrafts((prev) => ({ ...prev, [item.id]: prev[item.id] ?? item.answer }))}
                        sx={{ mt: 0.6, minWidth: 0, p: 0, fontWeight: 800, fontSize: '0.75rem', color: '#946D6D', textTransform: 'none' }}
                      >
                        Yanıtı düzenle
                      </Button>
                    ) : null}
                  </Box>
                ) : !canAnswer ? (
                  <Typography sx={{ mt: 1, ml: { xs: 0, sm: 5.6 }, color: '#A290B7', fontWeight: 700, fontSize: '0.78rem' }}>
                    Satıcı henüz yanıtlamadı
                  </Typography>
                ) : null}

                {canAnswer && (open || answerDrafts[item.id] != null) && (
                  <Box sx={{ mt: 1.1, ml: { xs: 0, sm: 5.6 } }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      value={answerDrafts[item.id] ?? ''}
                      onChange={(event) => setAnswerDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      placeholder="Müşteriye yanıt yazın"
                      sx={{
                        mb: 0.8,
                        '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#FFFDF6' }
                      }}
                    />
                    <Button
                      onClick={() => handleAnswer(item.id)}
                      disabled={answeringId === item.id || String(answerDrafts[item.id] || '').trim().length < 8}
                      sx={{ borderRadius: '999px', fontWeight: 800, fontSize: '0.78rem', px: 1.6, color: '#FFFFFF', backgroundColor: '#2E3B55', textTransform: 'none', '&:hover': { backgroundColor: '#946D6D' } }}
                    >
                      {answeringId === item.id ? 'Kaydediliyor' : item.answer ? 'Yanıtı güncelle' : 'Yanıtla'}
                    </Button>
                  </Box>
                )}
              </Box>
            );
          })}
          {questions.length > 4 && (
            <Button onClick={() => setShowAll((value) => !value)} sx={{ alignSelf: 'flex-start', fontWeight: 800, color: '#946D6D', textTransform: 'none' }}>
              {showAll ? 'Daha az göster' : `Tüm soruları gör (${questions.length})`}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
