import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, MenuItem, TextField, Typography } from '@mui/material';
import { lookbookService, mediaUrl } from '../api/lookbookService';
import { PanelCard, SectionTitle } from './PanelShell';
import { T } from '../utils/panel';

const SECTIONS = [
  { id: 'hero', label: 'Hero banner', title: 'Ana sayfa hero görselleri', subtitle: 'Slayt sırasını, görseli ve yayını buradan değiştirin. Boş bırakırsanız varsayılan bannerlar kalır.' },
  { id: 'lookbook', label: 'Hareketli çantalar', title: 'Hareket halindeki çanta klipleri', subtitle: 'Yayından alınan klip silinmez. Video ve kapak durur, istediğiniz zaman tekrar yayınlanır.' },
  { id: 'homepage', label: 'Büyük film', title: 'Ana sayfa filmi', subtitle: 'Lookbook’un altındaki geniş hareketli çanta videosu. İlk aktif klip oynar.' }
];

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' }
};

function MediaPreview({ item }) {
  const poster = mediaUrl(item.posterUrl);
  const video = mediaUrl(item.videoUrl);
  if (item.placement === 'hero' || (!video && poster)) {
    return poster ? (
      <Box component="img" src={poster} alt="" sx={{ width: 168, height: 96, objectFit: 'cover', borderRadius: '14px', bgcolor: '#1E2738' }} />
    ) : null;
  }
  return (
    <Box
      component="video"
      src={video}
      poster={poster || undefined}
      muted
      preload="metadata"
      sx={{ width: 168, height: 96, objectFit: 'cover', borderRadius: '14px', bgcolor: '#1E2738' }}
    />
  );
}

function UploadButton({ label, accept, onPick }) {
  return (
    <Button variant="outlined" component="label" sx={{ fontWeight: 800, borderRadius: '12px', borderColor: T.line, color: T.navy }}>
      {label}
      <input hidden type="file" accept={accept} onChange={(event) => onPick(event.target.files?.[0] || null)} />
    </Button>
  );
}

export default function AdminSiteContent({ items = [], products = [], onChanged, onMessage, onError }) {
  const [kept, setKept] = useState(items);
  const removedIds = useRef(new Set());
  const [section, setSection] = useState('hero');
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [productId, setProductId] = useState('');
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  useEffect(() => {
    setKept((prev) => {
      const incoming = (items || []).filter((item) => !removedIds.current.has(String(item._id)));
      const ids = new Set(incoming.map((item) => String(item._id)));
      const hidden = prev.filter((item) => (
        item.isActive === false
        && !ids.has(String(item._id))
        && !removedIds.current.has(String(item._id))
      ));
      return [...incoming, ...hidden];
    });
  }, [items]);

  const current = SECTIONS.find((item) => item.id === section) || SECTIONS[0];
  const rows = useMemo(
    () => kept
      .filter((item) => (item.placement || 'lookbook') === section)
      .sort((a, b) => {
        const activeDiff = Number(b.isActive !== false) - Number(a.isActive !== false);
        if (activeDiff) return activeDiff;
        return (a.order || 0) - (b.order || 0);
      }),
    [kept, section]
  );

  const reset = () => {
    setLabel('');
    setProductId('');
    setImage(null);
    setVideo(null);
  };

  const fail = (err, fallback) => onError?.(err.response?.data?.mesaj || fallback);
  const done = async (text) => {
    onMessage?.(text);
    reset();
    await onChanged?.();
  };

  const add = async (event) => {
    event.preventDefault();
    if (section === 'hero' && !image) return onError?.('Hero için bir görsel seçin.');
    if (section !== 'hero' && !video) return onError?.('Bir video seçin.');
    setSaving(true);
    try {
      const body = new FormData();
      body.append('placement', section);
      body.append('label', label || (section === 'hero' ? 'Hero' : 'Hareketli çanta'));
      if (productId) body.append('productId', productId);
      if (image) body.append('poster', image);
      if (video) body.append('video', video);
      const result = await lookbookService.create(body);
      await done(result.mesaj || 'Eklendi.');
    } catch (err) {
      fail(err, 'Yüklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (item, payload, message) => {
    try {
      await lookbookService.update(item._id, payload);
      onMessage?.(message);
      await onChanged?.();
    } catch (err) {
      fail(err, 'Güncellenemedi.');
    }
  };

  const replaceFile = async (item, file, field) => {
    if (!file) return;
    setSaving(true);
    try {
      const body = new FormData();
      body.append(field, file);
      await lookbookService.update(item._id, body);
      await done(field === 'video' ? 'Video değiştirildi.' : 'Görsel değiştirildi.');
    } catch (err) {
      fail(err, 'Dosya değiştirilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await Promise.all(next.map((item, order) => lookbookService.update(item._id, { order: order + 1 })));
      onMessage?.('Sıra güncellendi.');
      await onChanged?.();
    } catch (err) {
      fail(err, 'Sıra kaydedilemedi.');
    }
  };

  const setPublished = async (item, isActive) => {
    const previous = item.isActive;
    setKept((rows) => rows.map((row) => (row._id === item._id ? { ...row, isActive } : row)));
    try {
      const result = await lookbookService.setPublished(item._id, isActive);
      const saved = result.item || { ...item, isActive };
      setKept((rows) => rows.map((row) => (row._id === item._id ? { ...row, ...saved, isActive: saved.isActive !== false } : row)));
      onMessage?.(result.mesaj || (isActive ? 'Yeniden yayına alındı.' : 'Yayından alındı. Klip silinmedi.'));
      await onChanged?.();
    } catch (err) {
      setKept((rows) => rows.map((row) => (row._id === item._id ? { ...row, isActive: previous } : row)));
      fail(err, 'Yayın durumu güncellenemedi.');
    }
  };

  const remove = async (item) => {
    try {
      removedIds.current.add(String(item._id));
      setKept((rows) => rows.filter((row) => row._id !== item._id));
      await lookbookService.remove(item._id);
      onMessage?.('Silindi.');
      await onChanged?.();
    } catch (err) {
      fail(err, 'Silinemedi.');
    }
  };

  return (
    <Box>
      <SectionTitle overline="İÇERİK" title={current.title} subtitle={current.subtitle} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.2 }}>
        {SECTIONS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            onClick={() => { setSection(item.id); reset(); }}
            sx={{
              fontWeight: 800,
              cursor: 'pointer',
              bgcolor: section === item.id ? T.navy : '#fff',
              color: section === item.id ? '#fff' : T.navy,
              border: `1px solid ${section === item.id ? T.navy : T.line}`
            }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.85fr 1.15fr' }, gap: 1.8, alignItems: 'start' }}>
        <PanelCard>
          <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1.6 }}>
            {section === 'hero' ? 'Yeni hero görseli' : 'Yeni klip'}
          </Typography>
          <Box component="form" onSubmit={add}>
            <TextField
              fullWidth
              label={section === 'hero' ? 'Slayt adı' : 'Etiket'}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              sx={{ ...fieldSx, mb: 2 }}
            />
            {section !== 'hero' ? (
              <TextField
                select
                fullWidth
                label="Ürüne bağla (isteğe bağlı)"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                sx={{ ...fieldSx, mb: 2 }}
              >
                <MenuItem value="">Bağlama</MenuItem>
                {products.map((product) => (
                  <MenuItem key={product._id} value={product._id}>{product.title}</MenuItem>
                ))}
              </TextField>
            ) : null}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.4, flexWrap: 'wrap' }}>
              {section !== 'hero' ? <UploadButton label={video ? video.name : 'Video seç'} accept="video/*" onPick={setVideo} /> : null}
              <UploadButton label={image ? image.name : (section === 'hero' ? 'Görsel seç' : 'Kapak görseli')} accept="image/jpeg,image/png,image/webp,image/gif" onPick={setImage} />
            </Box>
            <Typography sx={{ color: T.muted, fontSize: 13, mb: 2 }}>
              {section === 'hero'
                ? 'Geniş yatay görsel kullanın. Sıra, sağdaki kartlardan değişir.'
                : 'Video zorunlu. Kapak, video yüklenene kadar görünür.'}
            </Typography>
            <Button type="submit" disabled={saving} sx={{ fontWeight: 800, bgcolor: T.navy, color: '#fff', borderRadius: '12px', px: 2.2, '&:hover': { bgcolor: T.navyDeep } }}>
              {saving ? 'Yükleniyor...' : section === 'hero' ? 'Görsel ekle' : 'Klip ekle'}
            </Button>
          </Box>
        </PanelCard>

        <Box>
          {!rows.length ? (
            <PanelCard sx={{ textAlign: 'center', py: 5 }}>
              <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.6 }}>Henüz özel içerik yok</Typography>
              <Typography sx={{ color: T.muted }}>
                {section === 'hero' ? 'Eklenene kadar site varsayılan bannerları gösterir.' : 'Eklenene kadar hazır çanta klipleri oynar.'}
              </Typography>
            </PanelCard>
          ) : rows.map((item, index) => (
            <PanelCard key={item._id} sx={{ mb: 1.4, opacity: item.isActive === false ? 0.72 : 1 }}>
              <Box sx={{ display: 'flex', gap: 1.6, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <MediaPreview item={item} />
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <TextField
                    fullWidth
                    size="small"
                    defaultValue={item.label}
                    key={`${item._id}-${item.label}`}
                    onBlur={(event) => {
                      const next = event.target.value.trim();
                      if (next && next !== item.label) patch(item, { label: next }, 'Etiket güncellendi.');
                    }}
                    sx={fieldSx}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={item.isActive !== false ? 'Yayında' : 'Yayından alındı'}
                      sx={{
                        fontWeight: 800,
                        bgcolor: item.isActive !== false ? 'rgba(63,107,71,0.12)' : 'rgba(148,109,109,0.16)',
                        color: item.isActive !== false ? '#3F6B47' : T.rose
                      }}
                    />
                    {item.isActive === false ? (
                      <Typography sx={{ color: T.muted, fontSize: 13, fontWeight: 700 }}>
                        Silinmedi. Video ve kapak duruyor.
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1.4, flexWrap: 'wrap' }}>
                <Button size="small" onClick={() => move(index, -1)} disabled={index === 0} sx={{ fontWeight: 800, color: T.navy }}>Yukarı</Button>
                <Button size="small" onClick={() => move(index, 1)} disabled={index === rows.length - 1} sx={{ fontWeight: 800, color: T.navy }}>Aşağı</Button>
                {section === 'hero' ? (
                  <UploadButton label="Görseli değiştir" accept="image/jpeg,image/png,image/webp,image/gif" onPick={(file) => replaceFile(item, file, 'poster')} />
                ) : (
                  <>
                    <UploadButton label="Videoyu değiştir" accept="video/*" onPick={(file) => replaceFile(item, file, 'video')} />
                    <UploadButton label="Kapağı değiştir" accept="image/jpeg,image/png,image/webp,image/gif" onPick={(file) => replaceFile(item, file, 'poster')} />
                  </>
                )}
                {section === 'lookbook' ? (
                  <Button
                    size="small"
                    onClick={() => setPublished(item, item.isActive === false)}
                    sx={{ fontWeight: 800, ml: 'auto', color: item.isActive === false ? '#3F6B47' : T.rose }}
                  >
                    {item.isActive === false ? 'Tekrar yayınla' : 'Yayından al'}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="small"
                      onClick={() => setPublished(item, item.isActive === false)}
                      sx={{ fontWeight: 800, color: item.isActive === false ? '#3F6B47' : T.navy }}
                    >
                      {item.isActive === false ? 'Tekrar yayınla' : 'Yayından al'}
                    </Button>
                    <Button size="small" color="error" onClick={() => remove(item)} sx={{ fontWeight: 800, ml: 'auto' }}>Sil</Button>
                  </>
                )}
              </Box>
            </PanelCard>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
