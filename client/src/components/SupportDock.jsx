import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Fab,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { motion, AnimatePresence } from 'framer-motion';
import { supportService } from '../api/supportService';

const WHATSAPP_NUMBER = '905551234567';
const WHATSAPP_TEXT = encodeURIComponent('Merhaba NikBag, destek almak istiyorum.');
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_TEXT}`;

const QUICK = [
  { label: 'Kargo', text: 'Kargo ücreti ve teslimat süresi nedir?' },
  { label: 'İade', text: 'İade nasıl yapılır?' },
  { label: 'Ödeme', text: 'Hangi ödeme yöntemleri var?' },
  { label: 'Siparişim', text: 'Son siparişimin durumu nedir?' }
];

const fabBase = {
  width: 56,
  height: 56,
  boxShadow: '0 10px 24px -12px rgba(46,59,85,0.55)',
  '&:hover': { transform: 'scale(1.06)' },
  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease'
};

function Bubble({ role, text }) {
  const mine = role === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <Box
        sx={{
          maxWidth: '88%',
          px: 1.4,
          py: 1,
          borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          backgroundColor: mine ? '#2E3B55' : '#FDF4D2',
          color: mine ? '#fff' : '#2E3B55',
          fontSize: 13.5,
          fontWeight: 600,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap'
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

export default function SupportDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const lift = location.pathname.startsWith('/product/') || location.pathname.startsWith('/checkout');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Merhaba, Nik Bag asistanıyım. Kargo, iade, ödeme ve sipariş hakkında sorabilirsin.'
    }
  ]);
  const scroller = useRef(null);

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, open, sending]);

  const send = async (text) => {
    const message = String(text || draft).trim();
    if (!message || sending) return;
    const history = messages.map((item) => ({ role: item.role, content: item.content }));
    setDraft('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setSending(true);
    try {
      const data = await supportService.chat({ message, history });
      const reply = data?.reply || data?.message || 'Yanıt alınamadı.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Şu an bağlanamadım. WhatsApp’tan yazabilirsin.' }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        bottom: lift ? 96 : 28,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1.2
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            style={{ width: 'min(360px, calc(100vw - 28px))' }}
          >
            <Box
              sx={{
                mb: 0.5,
                height: { xs: 440, sm: 500 },
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '24px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                border: '1px solid rgba(148,109,109,0.16)',
                boxShadow: '0 28px 60px -28px rgba(30,39,56,0.55)'
              }}
            >
              <Box sx={{ px: 1.6, py: 1.3, backgroundColor: '#2E3B55', color: '#FDF4D2', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeOutlinedIcon sx={{ fontSize: 20 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={800} sx={{ fontSize: 14, lineHeight: 1.2 }}>Nik Bag asistan</Typography>
                  <Typography sx={{ fontSize: 11, opacity: 0.78 }}>Kargo · iade · sipariş</Typography>
                </Box>
                <IconButton
                  component="a"
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  sx={{ color: '#FDF4D2' }}
                >
                  <WhatsAppIcon fontSize="small" />
                </IconButton>
                <IconButton aria-label="Kapat" onClick={() => setOpen(false)} sx={{ color: '#FDF4D2' }}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box
                ref={scroller}
                data-lenis-prevent
                sx={{ flex: 1, overflowY: 'auto', p: 1.4, display: 'flex', flexDirection: 'column', gap: 1.1, backgroundColor: '#FBF7EA' }}
              >
                {messages.map((item, index) => (
                  <Bubble key={`${item.role}-${index}`} role={item.role} text={item.content} />
                ))}
                {sending && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6E5252', pl: 0.5 }}>
                    <CircularProgress size={14} sx={{ color: '#946D6D' }} />
                    <Typography variant="caption" fontWeight={700}>Yazıyor…</Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ px: 1.3, pt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
                {QUICK.map((item) => (
                  <Box
                    key={item.label}
                    component="button"
                    type="button"
                    onClick={() => send(item.text)}
                    disabled={sending}
                    sx={{
                      border: '1px solid rgba(148,109,109,0.22)',
                      background: '#FDF4D2',
                      color: '#2E3B55',
                      fontWeight: 800,
                      fontSize: 11,
                      borderRadius: '999px',
                      px: 1.1,
                      py: 0.45,
                      cursor: sending ? 'default' : 'pointer',
                      opacity: sending ? 0.55 : 1
                    }}
                  >
                    {item.label}
                  </Box>
                ))}
              </Box>

              <Box sx={{ p: 1.2, display: 'flex', gap: 0.8, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Sorunu yaz…"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: '#fff',
                      '& fieldset': { borderColor: 'rgba(148,109,109,0.2)' }
                    }
                  }}
                />
                <IconButton
                  onClick={() => send()}
                  disabled={sending || !draft.trim()}
                  sx={{ backgroundColor: '#946D6D', color: '#fff', '&:hover': { backgroundColor: '#2E3B55' }, '&.Mui-disabled': { backgroundColor: 'rgba(148,109,109,0.35)', color: '#fff' } }}
                >
                  <SendRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography
                onClick={() => navigate('/satici-ol')}
                sx={{ px: 1.6, pb: 1.2, fontSize: 11, color: '#6E5252', cursor: 'pointer', fontWeight: 700 }}
              >
                Satıcı olmak mı istiyorsun? Başvuru sayfası →
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1, alignItems: 'flex-end' }}>
        <Tooltip title="Yapay zeka destek" placement="left" disableHoverListener={open} disableFocusListener={open}>
          <Fab
            aria-label="Yapay zeka müşteri destek"
            onClick={() => setOpen((prev) => !prev)}
            sx={{
              ...fabBase,
              backgroundColor: open ? '#946D6D' : '#2E3B55',
              color: '#FDF4D2',
              '&:hover': { ...fabBase['&:hover'], backgroundColor: '#946D6D' }
            }}
          >
            {open ? <CloseRoundedIcon /> : <AutoAwesomeOutlinedIcon />}
          </Fab>
        </Tooltip>
        <Tooltip title="WhatsApp hızlı sipariş & destek" placement="left">
          <Fab
            component="a"
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            sx={{
              ...fabBase,
              backgroundColor: '#25D366',
              color: '#fff',
              '&:hover': { ...fabBase['&:hover'], backgroundColor: '#1EBE57' }
            }}
          >
            <WhatsAppIcon sx={{ fontSize: 28 }} />
          </Fab>
        </Tooltip>
      </Box>
    </Box>
  );
}
