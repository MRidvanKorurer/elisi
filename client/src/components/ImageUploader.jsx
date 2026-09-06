import { useRef, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { T } from '../utils/panel';

const previewOf = (item) => (typeof item === 'string' ? item : item.preview);

export default function ImageUploader({
  label,
  hint,
  multiple = false,
  value,
  onChange,
  onRemoveExisting,
  existing = [],
  height = 150
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const items = multiple ? value || [] : value ? [value] : [];

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    const mapped = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    onChange(multiple ? [...(value || []), ...mapped] : mapped[0]);
  };

  const removeAt = (index) => {
    if (!multiple) return onChange(null);
    const next = [...(value || [])];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <Box>
      {label ? (
        <Typography sx={{ fontWeight: 800, color: T.navy, mb: 0.8, fontSize: '0.9rem' }}>{label}</Typography>
      ) : null}

      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        sx={{
          border: `1.5px dashed ${dragging ? T.rose : 'rgba(148,109,109,0.35)'}`,
          bgcolor: dragging ? 'rgba(148,109,109,0.06)' : T.surfaceSoft,
          borderRadius: '18px',
          minHeight: height,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          textAlign: 'center',
          px: 2,
          py: 2.4,
          transition: 'all .18s ease',
          '&:hover': { borderColor: T.rose, bgcolor: 'rgba(148,109,109,0.05)' }
        }}
      >
        <Box>
          <AddPhotoAlternateOutlined sx={{ color: T.rose, fontSize: 30 }} />
          <Typography sx={{ fontWeight: 800, color: T.navy, mt: 0.6 }}>
            Görsel sürükleyin veya seçin
          </Typography>
          <Typography sx={{ color: T.muted, fontSize: '0.78rem' }}>
            {hint || 'JPG, PNG veya WEBP · en fazla 8 MB'}
          </Typography>
        </Box>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </Box>

      {(existing.length > 0 || items.length > 0) && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.4 }}>
          {existing.map((url) => (
            <Box key={url} sx={{ position: 'relative' }}>
              <Box component="img" src={url} alt="" sx={{ width: 86, height: 86, objectFit: 'cover', borderRadius: '14px', border: `1px solid ${T.line}` }} />
              {onRemoveExisting ? (
                <IconButton
                  size="small"
                  onClick={() => onRemoveExisting(url)}
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#fff', border: `1px solid ${T.line}`, '&:hover': { bgcolor: '#FEF2F2' } }}
                >
                  <CloseRounded sx={{ fontSize: 15 }} />
                </IconButton>
              ) : null}
            </Box>
          ))}
          {items.map((item, index) => (
            <Box key={previewOf(item) + index} sx={{ position: 'relative' }}>
              <Box component="img" src={previewOf(item)} alt="" sx={{ width: 86, height: 86, objectFit: 'cover', borderRadius: '14px', border: `1.5px solid ${T.rose}` }} />
              <IconButton
                size="small"
                onClick={() => removeAt(index)}
                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#fff', border: `1px solid ${T.line}`, '&:hover': { bgcolor: '#FEF2F2' } }}
              >
                <CloseRounded sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
