import { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { T } from '../utils/panel';
import { briefLines } from '../utils/orderBrief';

const whenShort = (value) =>
  value
    ? new Date(value).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

export default function OrderMakerThread({
  items = [],
  notes = [],
  onSend,
  sending = false,
  viewer = 'buyer',
  canReply = true
}) {
  const [text, setText] = useState('');
  const briefs = items
    .map((item) => ({ name: item.name, lines: briefLines(item.customBrief) }))
    .filter((item) => item.lines.length);

  const send = async () => {
    const next = text.trim();
    if (next.length < (viewer === 'buyer' ? 8 : 2) || !onSend) return;
    const ok = await onSend(next);
    if (ok !== false) setText('');
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Özel üretim</Typography>
      <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.4 }}>
        Ölçü, renk ve teslim notu atölyede kalır. Kargoya çıkmadan buradan netleştirebilirsiniz.
      </Typography>

      {briefs.length ? briefs.map((item) => (
        <Box key={item.name} sx={{ mb: 1.2, p: 1.4, borderRadius: '16px', bgcolor: T.surfaceSoft, border: `1px solid ${T.line}` }}>
          <Typography sx={{ fontWeight: 800, color: T.navy, mb: 0.8 }}>{item.name}</Typography>
          {item.lines.map((line) => (
            <Box key={line.key} sx={{ mb: 0.7 }}>
              <Typography sx={{ color: T.muted, fontSize: 12, fontWeight: 800 }}>{line.label}</Typography>
              <Typography sx={{ color: T.navy, fontWeight: 700, whiteSpace: 'pre-wrap' }}>{line.value}</Typography>
            </Box>
          ))}
        </Box>
      )) : (
        <Typography sx={{ color: T.muted, fontSize: 13, mb: 1.2 }}>Siparişte ölçü veya renk notu yok.</Typography>
      )}

      <Box sx={{ display: 'grid', gap: 1, mb: 1.4 }}>
        {(notes || []).map((note) => {
          const mine = note.authorRole === viewer;
          return (
            <Box
              key={note.id || note._id || `${note.createdAt}-${note.text}`}
              sx={{
                justifySelf: mine ? 'end' : 'start',
                maxWidth: '92%',
                px: 1.4,
                py: 1,
                borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                bgcolor: mine ? 'rgba(46,59,85,0.08)' : '#fff',
                border: `1px solid ${T.line}`
              }}
            >
              <Typography sx={{ fontWeight: 800, color: T.navy, fontSize: 12 }}>
                {note.authorRole === 'seller' ? (note.authorName || 'Atölye') : (note.authorName || 'Müşteri')}
                <Typography component="span" sx={{ color: T.muted, fontWeight: 700, fontSize: 12 }}> · {whenShort(note.createdAt)}</Typography>
              </Typography>
              <Typography sx={{ color: T.navy, fontWeight: 650, whiteSpace: 'pre-wrap', mt: 0.3 }}>{note.text}</Typography>
            </Box>
          );
        })}
      </Box>

      {canReply ? (
        <Box sx={{ display: 'grid', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder={viewer === 'seller' ? 'Ölçü veya rengi netleştirin' : 'Atölyeye sorunuzu yazın'}
            value={text}
            onChange={(event) => setText(event.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#fff' } }}
          />
          <Button
            onClick={send}
            disabled={savingGuard(sending, text, viewer)}
            sx={{ justifySelf: 'start', fontWeight: 800, bgcolor: T.navy, color: '#fff', borderRadius: '12px', px: 2, '&:hover': { bgcolor: T.navyDeep } }}
          >
            {sending ? 'Gönderiliyor...' : viewer === 'seller' ? 'Yanıtla' : 'Atölyeye yaz'}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}

function savingGuard(saving, text, viewer) {
  return saving || text.trim().length < (viewer === 'buyer' ? 8 : 2);
}
