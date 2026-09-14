import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useLocaleNavigate from '../i18n/useLocaleNavigate';
import { Box, Button, Container, Paper, TextField, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import Seo from '../components/Seo';
import OrderMakerThread from '../components/OrderMakerThread';
import { getSitePublic } from '../api/siteService';
import { orderService } from '../api/orderServices';

export default function OrderResultPage({ success }) {
  const { t } = useTranslation('checkout');
  const navigate = useLocaleNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const method = params.get('method');
  const reason = params.get('reason');
  const isTransfer = method === 'transfer';
  const [site, setSite] = useState(null);
  const [email, setEmail] = useState('');
  const [thread, setThread] = useState(null);
  const [threadError, setThreadError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!success || !orderId) return undefined;
    let stored = '';
    try { stored = sessionStorage.getItem('nikbagGuestEmail') || ''; } catch { stored = ''; }
    if (!stored.trim()) return undefined;
    setEmail(stored);
    let cancelled = false;
    orderService.guestThread(orderId, stored.trim())
      .then((data) => { if (!cancelled) setThread(data.thread); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [success, orderId]);

  useEffect(() => {
    if (isTransfer) getSitePublic().then(setSite);
  }, [isTransfer]);

  const copy = useMemo(() => {
    if (!success) {
      return {
        title: t('resultFailTitle'),
        text: reason || t('resultFailText'),
        icon: <ErrorOutlineRoundedIcon sx={{ fontSize: 64, color: '#C62828' }} />
      };
    }
    if (isTransfer) {
      return {
        title: t('resultTransferTitle'),
        text: t('resultTransferText'),
        icon: <AccountBalanceOutlinedIcon sx={{ fontSize: 64, color: '#946D6D' }} />
      };
    }
    return {
      title: t('resultOkTitle'),
      text: t('resultOkText'),
      icon: <CheckCircleRoundedIcon sx={{ fontSize: 64, color: '#2E7D32' }} />
    };
  }, [success, isTransfer, reason, t]);

  return (
    <Box sx={{ minHeight: '70vh', pt: { xs: 12, md: 16 }, pb: 8, px: 2, background: 'linear-gradient(180deg, #FDF4D2 0%, #F7EBC0 100%)' }}>
      <Seo
        title={copy.title}
        path={success ? '/siparis-basarili' : '/odeme-basarisiz'}
        noindex
      />
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: '28px', textAlign: 'center', border: '1px solid rgba(148,109,109,0.12)', overflow: 'hidden', minWidth: 0 }}>
          {copy.icon}
          <Typography variant="h4" fontWeight={800} sx={{ color: '#2E3B55', mt: 2, fontSize: { xs: '1.45rem', md: '2rem' }, overflowWrap: 'anywhere' }}>
            {copy.title}
          </Typography>
          <Typography sx={{ color: '#6E5252', mt: 1.5, lineHeight: 1.7 }}>{copy.text}</Typography>
          {orderId && (
            <Box sx={{ mt: 2.5, p: 1.5, borderRadius: '14px', backgroundColor: '#FDF4D2', fontWeight: 800, color: '#2E3B55', wordBreak: 'break-all' }}>
              {t('orderCode', { id: orderId })}
            </Box>
          )}
          {success && orderId && (
            <Box sx={{ mt: 2.5, textAlign: 'left' }}>
              <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 0.6 }}>Atölyeye soru</Typography>
              <Typography sx={{ color: '#6E5252', fontSize: '0.85rem', mb: 1.2 }}>
                Giriş yapmadan sorabilirsiniz. Siparişte yazdığınız e-posta yeterli.
              </Typography>
              {!thread && (
                <Box sx={{ display: 'grid', gap: 1, mb: 1.2 }}>
                  <TextField
                    fullWidth
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Sipariş e-postanız"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#fff' } }}
                  />
                  <Button
                    onClick={async () => {
                      setSending(true);
                      setThreadError('');
                      try {
                        const data = await orderService.guestThread(orderId, email.trim());
                        setThread(data.thread);
                      } catch (error) {
                        setThreadError(error.message || 'E-posta eşleşmedi.');
                      } finally {
                        setSending(false);
                      }
                    }}
                    disabled={sending || !email.trim()}
                    sx={{ justifySelf: 'start', fontWeight: 800, color: '#fff', backgroundColor: '#2E3B55', borderRadius: '12px', textTransform: 'none', '&:hover': { backgroundColor: '#946D6D' } }}
                  >
                    {sending ? 'Açılıyor' : 'Soruları aç'}
                  </Button>
                </Box>
              )}
              {threadError ? <Typography sx={{ color: '#946D6D', fontWeight: 700, fontSize: '0.85rem', mb: 1 }}>{threadError}</Typography> : null}
              {thread && (
                <OrderMakerThread
                  items={thread.items}
                  notes={thread.makerNotes}
                  viewer="buyer"
                  sending={sending}
                  canReply={thread.orderStatus !== 'cancelled'}
                  onSend={async (text) => {
                    setSending(true);
                    setThreadError('');
                    try {
                      const data = await orderService.guestNote(orderId, email.trim(), text);
                      setThread(data.thread || thread);
                      return true;
                    } catch (error) {
                      setThreadError(error.message || 'Soru iletilemedi.');
                      return false;
                    } finally {
                      setSending(false);
                    }
                  }}
                />
              )}
            </Box>
          )}
          {success && isTransfer && (
            <Box sx={{ mt: 2, textAlign: 'left', p: 2, borderRadius: '16px', border: '1px dashed rgba(148,109,109,0.35)' }}>
              <Typography fontWeight={800} sx={{ color: '#2E3B55', mb: 1 }}>{t('bankTitle')}</Typography>
              {site?.bank?.iban ? (
                <>
                  <Typography variant="body2" sx={{ color: '#6E5252' }}>{site.bank.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#6E5252' }}>{site.bank.iban}</Typography>
                </>
              ) : (
                <Typography variant="body2" sx={{ color: '#946D6D' }}>Havale hesabı henüz tanımlanmamış.</Typography>
              )}
              <Typography variant="caption" sx={{ color: '#946D6D', fontWeight: 700 }}>{t('bankNote', { id: orderId })}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 1, mt: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button fullWidth variant="contained" onClick={() => navigate('/products')} sx={{ backgroundColor: '#2E3B55', color: '#FFFFFF', fontWeight: 800, py: 1.2, '&:hover': { backgroundColor: '#946D6D', color: '#FFFFFF' } }}>
              {t('actions.keepShopping', { ns: 'common' })}
            </Button>
            {success && (
              <Button fullWidth variant="outlined" onClick={() => navigate('/profile')} sx={{ borderColor: '#946D6D', color: '#946D6D', fontWeight: 800, backgroundColor: '#fff' }}>
                {t('actions.myOrders', { ns: 'common' })}
              </Button>
            )}
            {!success && (
              <Button fullWidth variant="outlined" onClick={() => navigate('/checkout')} sx={{ borderColor: '#946D6D', color: '#946D6D', fontWeight: 800, backgroundColor: '#fff' }}>
                {t('actions.tryAgain', { ns: 'common' })}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
