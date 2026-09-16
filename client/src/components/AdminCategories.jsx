import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { categoryService } from '../api/categoryService';
import DynamicIcon from './DynamicIcon';
import { PanelCard, SectionTitle, fieldSx, primaryButton } from './PanelShell';
import { CATEGORY_ICON_NAMES } from '../utils/categories';
import { T } from '../utils/panel';

const ICON_OPTIONS = [
  ...new Set([
    'CategoryOutlined',
    ...Object.values(CATEGORY_ICON_NAMES),
    'GridViewRounded',
    'WavesOutlined',
    'SelfImprovementOutlined',
    'ContentCutOutlined'
  ])
];

const emptyForm = {
  name: '',
  categoryId: '',
  description: '',
  order: '',
  iconName: 'CategoryOutlined',
  color: '#946D6D',
  isActive: true
};

const slugifyId = (value = '') =>
  String(value)
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

const headCell = {
  fontWeight: 800,
  color: T.muted,
  fontSize: '0.78rem',
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  borderBottom: `1px solid ${T.line}`,
  bgcolor: T.surfaceSoft
};

const bodyCell = { borderBottom: `1px solid ${T.line}`, color: T.navy };

export default function AdminCategories({ onMessage, onError, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [idTouched, setIdTouched] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await categoryService.adminList();
      setRows(data.categories || []);
    } catch (err) {
      onError?.(err.response?.data?.mesaj || 'Kategoriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const refreshParents = async () => {
    try {
      await onChanged?.();
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          Number(b.isActive !== false) - Number(a.isActive !== false) ||
          (a.order || 0) - (b.order || 0) ||
          String(a.name).localeCompare(String(b.name), 'tr')
      ),
    [rows]
  );

  const reset = () => {
    setForm(emptyForm);
    setImageFile(null);
    setEditingId(null);
    setIdTouched(false);
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setIdTouched(true);
    setImageFile(null);
    setForm({
      name: item.name || '',
      categoryId: item.categoryId || '',
      description: item.description || '',
      order: item.order ?? '',
      iconName: item.iconName || 'CategoryOutlined',
      color: item.color || '#946D6D',
      isActive: item.isActive !== false
    });
  };

  const onNameChange = (name) => {
    setForm((prev) => ({
      ...prev,
      name,
      categoryId: editingId || idTouched ? prev.categoryId : slugifyId(name)
    }));
  };

  const buildBody = () => {
    const body = new FormData();
    body.append('name', form.name.trim());
    if (!editingId) body.append('categoryId', form.categoryId.trim() || slugifyId(form.name));
    body.append('description', form.description.trim());
    if (form.order !== '' && form.order != null) body.append('order', String(form.order));
    body.append('iconName', form.iconName);
    body.append('color', form.color);
    body.append('isActive', String(form.isActive !== false));
    if (imageFile) body.append('image', imageFile);
    return body;
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return onError?.('Kategori adı zorunludur.');
    if (!editingId && !(form.categoryId.trim() || slugifyId(form.name))) {
      return onError?.('Geçerli bir kategori kimliği girin.');
    }
    setSaving(true);
    try {
      const body = buildBody();
      if (editingId) {
        const result = await categoryService.adminUpdate(editingId, body);
        onMessage?.(result.mesaj || 'Kategori güncellendi.');
      } else {
        const result = await categoryService.adminCreate(body);
        onMessage?.(result.mesaj || 'Kategori eklendi.');
      }
      reset();
      await load();
      await refreshParents();
    } catch (err) {
      onError?.(err.response?.data?.mesaj || 'Kategori kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item, isActive) => {
    try {
      const body = new FormData();
      body.append('isActive', String(isActive));
      const result = await categoryService.adminUpdate(item._id, body);
      setRows((prev) =>
        prev.map((row) => (row._id === item._id ? { ...row, ...(result.category || {}), isActive } : row))
      );
      onMessage?.(result.mesaj || (isActive ? 'Kategori yayında.' : 'Kategori gizlendi.'));
      await refreshParents();
    } catch (err) {
      onError?.(err.response?.data?.mesaj || 'Durum güncellenemedi.');
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await Promise.all(
        next.map((item, order) => {
          const body = new FormData();
          body.append('order', String(order + 1));
          return categoryService.adminUpdate(item._id, body);
        })
      );
      onMessage?.('Sıra güncellendi.');
      await load();
      await refreshParents();
    } catch (err) {
      onError?.(err.response?.data?.mesaj || 'Sıra kaydedilemedi.');
    }
  };

  const remove = async (item) => {
    const ok = window.confirm(
      item.productCount
        ? `"${item.name}" kategorisinde ürün var. Silmek yerine yayından alınsın mı?`
        : `"${item.name}" kategorisini silmek istiyor musunuz?`
    );
    if (!ok) return;
    try {
      const result = await categoryService.adminRemove(item._id);
      onMessage?.(result.mesaj || 'İşlem tamam.');
      if (editingId === item._id) reset();
      await load();
      await refreshParents();
    } catch (err) {
      onError?.(err.response?.data?.mesaj || 'Kategori silinemedi.');
    }
  };

  return (
    <Box>
      <SectionTitle
        overline="KATEGORİLER"
        title="Site kategorileri"
        subtitle="Yeni kategori ekleyin, sırayı ve kapak görselini yönetin. Kimlik (slug) ürünlere bağlanır; oluşturulduktan sonra değişmez."
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.95fr 1.35fr' }, gap: 1.8 }}>
        <PanelCard>
          <Typography sx={{ fontWeight: 800, color: T.navy, mb: 1.6 }}>
            {editingId ? 'Kategoriyi düzenle' : 'Yeni kategori'}
          </Typography>
          <Box component="form" onSubmit={save}>
            <TextField
              fullWidth
              required
              label="Ad"
              value={form.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Örn. El Örgüsü"
              sx={{ ...fieldSx, mb: 1.6 }}
            />
            <TextField
              fullWidth
              label="Kimlik (slug)"
              value={form.categoryId}
              disabled={Boolean(editingId)}
              onChange={(e) => {
                setIdTouched(true);
                setForm((prev) => ({ ...prev, categoryId: slugifyId(e.target.value) }));
              }}
              helperText={editingId ? 'Kimlik sonradan değiştirilemez.' : 'Boş bırakırsanız addan üretilir.'}
              sx={{ ...fieldSx, mb: 1.6 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Açıklama"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              sx={{ ...fieldSx, mb: 1.6 }}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mb: 1.6 }}>
              <TextField
                fullWidth
                type="number"
                label="Sıra"
                value={form.order}
                onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="Renk"
                value={form.color}
                onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                sx={fieldSx}
              />
            </Box>
            <TextField
              select
              fullWidth
              label="İkon"
              value={form.iconName}
              onChange={(e) => setForm((prev) => ({ ...prev, iconName: e.target.value }))}
              sx={{ ...fieldSx, mb: 1.6 }}
            >
              {ICON_OPTIONS.map((name) => (
                <MenuItem key={name} value={name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DynamicIcon iconName={name} sx={{ fontSize: 18, color: form.color || T.rose }} />
                    {name}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ fontWeight: 800, borderRadius: '12px', borderColor: T.line, color: T.navy, mb: 1.2 }}
            >
              {imageFile ? imageFile.name : editingId ? 'Kapak görselini değiştir' : 'Kapak görseli seç'}
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.8 }}>
              <Typography sx={{ fontWeight: 700, color: T.navy, fontSize: '0.9rem' }}>Yayında</Typography>
              <Switch
                checked={form.isActive !== false}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {editingId ? (
                <Button type="button" onClick={reset} sx={{ borderRadius: '12px', fontWeight: 800, color: T.muted }}>
                  Vazgeç
                </Button>
              ) : null}
              <Button type="submit" disabled={saving} sx={{ ...primaryButton, flex: 1 }}>
                {saving ? 'Kaydediliyor…' : editingId ? 'Güncelle' : 'Kategori ekle'}
              </Button>
            </Box>
          </Box>
        </PanelCard>

        <PanelCard sx={{ overflow: 'auto' }}>
          <Typography sx={{ fontWeight: 800, color: T.navy, mb: 1.2 }}>
            {loading ? 'Yükleniyor…' : `${sorted.length} kategori`}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>Kategori</TableCell>
                <TableCell sx={headCell}>Ürün</TableCell>
                <TableCell sx={headCell}>Sıra</TableCell>
                <TableCell sx={headCell}>Durum</TableCell>
                <TableCell sx={headCell} align="right">
                  İşlem
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ ...bodyCell, py: 4, color: T.muted }}>
                    Henüz kategori yok. Soldan ekleyin.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((item, index) => (
                  <TableRow key={item._id} hover>
                    <TableCell sx={bodyCell}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            bgcolor: item.bgRGBA || 'rgba(148,109,109,0.12)',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            border: `1px solid ${T.line}`
                          }}
                        >
                          {item.image ? (
                            <Box
                              component="img"
                              src={item.image}
                              alt=""
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <DynamicIcon iconName={item.iconName} sx={{ color: item.color || T.rose, fontSize: 22 }} />
                          )}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, color: T.navy, fontSize: '0.92rem' }} noWrap>
                            {item.name}
                          </Typography>
                          <Typography sx={{ color: T.muted, fontSize: '0.75rem' }} noWrap>
                            {item.categoryId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={bodyCell}>{item.productCount || 0}</TableCell>
                    <TableCell sx={bodyCell}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <Button size="small" onClick={() => move(index, -1)} disabled={index === 0} sx={{ minWidth: 28, px: 0.4 }}>
                          ↑
                        </Button>
                        <Typography sx={{ fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{item.order || 0}</Typography>
                        <Button
                          size="small"
                          onClick={() => move(index, 1)}
                          disabled={index === sorted.length - 1}
                          sx={{ minWidth: 28, px: 0.4 }}
                        >
                          ↓
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell sx={bodyCell}>
                      <Chip
                        size="small"
                        label={item.isActive !== false ? 'Yayında' : 'Gizli'}
                        sx={{
                          fontWeight: 800,
                          bgcolor: item.isActive !== false ? 'rgba(150,190,150,0.24)' : 'rgba(46,59,85,0.07)',
                          color: item.isActive !== false ? '#3F6B47' : T.muted
                        }}
                      />
                    </TableCell>
                    <TableCell sx={bodyCell} align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.6, flexWrap: 'wrap' }}>
                        <Button size="small" onClick={() => startEdit(item)} sx={{ fontWeight: 800, borderRadius: '10px' }}>
                          Düzenle
                        </Button>
                        <Button
                          size="small"
                          onClick={() => toggleActive(item, item.isActive === false)}
                          sx={{ fontWeight: 800, borderRadius: '10px', color: T.navy }}
                        >
                          {item.isActive === false ? 'Yayınla' : 'Gizle'}
                        </Button>
                        <Button size="small" color="error" onClick={() => remove(item)} sx={{ fontWeight: 800, borderRadius: '10px' }}>
                          Sil
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </PanelCard>
      </Box>
    </Box>
  );
}
