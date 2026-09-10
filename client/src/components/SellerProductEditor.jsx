import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import ImageUploader from './ImageUploader';
import { PanelCard, SectionTitle, fieldSx, primaryButton, panelButton } from './PanelShell';
import { CATEGORY_OPTIONS, categoryLabel } from '../utils/categories';
import { T, money } from '../utils/panel';

const PRODUCTION_TIMES = ['24 saat', '1-3 İş Günü', '3-5 İş Günü', '1 hafta', '2 hafta'];

export const emptyProductForm = {
  title: '',
  description: '',
  category: 'canta',
  price: '',
  stock: 1,
  discountPercentage: 0,
  colors: [],
  sizes: [],
  features: [],
  careInstructions: '',
  immediateDelivery: true,
  customProductionTime: '1-3 İş Günü',
  measureNote: '',
  video: '',
  widthCm: '',
  heightCm: '',
  depthCm: '',
  strapCm: '',
  weightG: '',
  fits: ''
};

export const formFromProduct = (product) => ({
  title: product.title || '',
  description: product.description || '',
  category: product.category || 'canta',
  price: product.price ?? '',
  stock: product.stock ?? 1,
  discountPercentage: product.discountPercentage || 0,
  colors: product.colors || [],
  sizes: product.sizes || [],
  features: product.features || [],
  careInstructions: product.careInstructions || '',
  immediateDelivery: product.immediateDelivery !== false,
  customProductionTime: product.customProductionTime || '1-3 İş Günü',
  measureNote: product.measureNote || '',
  video: product.video || '',
  widthCm: product.dimensions?.widthCm ?? '',
  heightCm: product.dimensions?.heightCm ?? '',
  depthCm: product.dimensions?.depthCm ?? '',
  strapCm: product.dimensions?.strapCm ?? '',
  weightG: product.dimensions?.weightG ?? '',
  fits: product.dimensions?.fits || ''
});

function TagField({ label, hint, value, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const tags = Array.isArray(value) ? value : [];

  const add = () => {
    const next = draft.trim();
    if (!next || tags.some((tag) => tag.toLocaleLowerCase('tr-TR') === next.toLocaleLowerCase('tr-TR'))) {
      setDraft('');
      return;
    }
    onChange([...tags, next]);
    setDraft('');
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: 800, color: T.navy, mb: 0.8, fontSize: '0.9rem' }}>{label}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: tags.length ? 1 : 0 }}>
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            onDelete={() => onChange(tags.filter((item) => item !== tag))}
            sx={{ fontWeight: 800, bgcolor: T.roseSoft, color: T.navy, borderRadius: '10px' }}
          />
        ))}
      </Box>
      <TextField
        size="small"
        fullWidth
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        helperText={hint}
        sx={fieldSx}
      />
    </Box>
  );
}

export default function SellerProductEditor({
  editing,
  form,
  setForm,
  mainImage,
  setMainImage,
  gallery,
  setGallery,
  removedImages,
  setRemovedImages,
  saving,
  onCancel,
  onSave
}) {
  const cover = mainImage?.preview || editing?.image || '';
  const galleryPreview = (editing?.additionalImages || []).filter((url) => !removedImages.includes(url));
  const discount = Math.min(100, Math.max(0, Number(form.discountPercentage) || 0));
  const price = Number(form.price) || 0;
  const sale = discount > 0 ? price - (price * discount) / 100 : price;

  const statusNote = useMemo(() => {
    if (!editing) return 'Yeni ürün süper admin onayından sonra vitrine çıkar.';
    if (editing.approvalStatus === 'rejected') return 'Reddedilen ürünü kaydettiğinizde tekrar onaya düşer.';
    if (editing.approvalStatus === 'pending') return 'Bu ürün hâlâ onay kuyruğunda. Tüm detayları güncelleyebilirsiniz.';
    return 'Onaylı ürünün başlık, görsel ve ölçü dahil tüm alanlarını siz yönetirsiniz.';
  }, [editing]);

  return (
    <Box>
      <SectionTitle
        overline="ATÖLYE KATALOĞU"
        title={editing ? 'Ürünü düzenle' : 'Yeni ürün'}
        subtitle={statusNote}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<ArrowBackRounded />} onClick={onCancel} sx={{ ...panelButton, color: T.navy, border: `1px solid ${T.line}`, bgcolor: '#fff', px: 2 }}>
              Geri
            </Button>
            <Button onClick={onSave} disabled={saving} sx={primaryButton}>
              {saving ? 'Kaydediliyor...' : editing ? 'Değişiklikleri kaydet' : 'Onaya gönder'}
            </Button>
          </Box>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' }, gap: 2, alignItems: 'start' }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <PanelCard>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Kimlik</Typography>
            <Typography sx={{ color: T.muted, fontSize: '0.82rem', mb: 2 }}>Müşterinin üründe ilk okuduğu başlık, kategori ve hikâye.</Typography>
            <Box sx={{ display: 'grid', gap: 1.8 }}>
              <TextField label="Ürün adı" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required sx={fieldSx} />
              <TextField select label="Kategori" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} sx={fieldSx}>
                {CATEGORY_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Hikâye / açıklama"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                multiline
                minRows={5}
                required
                sx={fieldSx}
              />
            </Box>
          </PanelCard>

          <PanelCard>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Fiyat ve stok</Typography>
            <Typography sx={{ color: T.muted, fontSize: '0.82rem', mb: 2 }}>İndirim girerseniz vitrinde çizili fiyat görünür.</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.6 }}>
              <TextField label="Fiyat (₺)" type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required sx={fieldSx} />
              <TextField label="Stok" type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} required sx={fieldSx} />
              <TextField label="İndirim %" type="number" value={form.discountPercentage} onChange={(e) => setForm((p) => ({ ...p, discountPercentage: e.target.value }))} sx={fieldSx} />
            </Box>
            <Typography sx={{ mt: 1.6, fontWeight: 800, color: T.navy }}>
              Satış fiyatı {money(sale)}
              {discount > 0 ? `  ·  ${discount}% indirim` : ''}
            </Typography>
          </PanelCard>

          <PanelCard>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Varyasyonlar</Typography>
            <Typography sx={{ color: T.muted, fontSize: '0.82rem', mb: 2 }}>Enter ile ekleyin. Müşteri bunları ürün sayfasında seçer.</Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TagField label="Renkler" value={form.colors} onChange={(colors) => setForm((p) => ({ ...p, colors }))} placeholder="Örn. Ekru" hint="Virgül veya Enter ile ekleyin" />
              <TagField label="Beden / ölçü seçenekleri" value={form.sizes} onChange={(sizes) => setForm((p) => ({ ...p, sizes }))} placeholder="Örn. Standart, Mini" hint="Müşterinin seçeceği bedenler" />
              <TagField label="Öne çıkan özellikler" value={form.features} onChange={(features) => setForm((p) => ({ ...p, features }))} placeholder="Örn. El örgüsü" hint="Ürün detayında madde madde görünür" />
            </Box>
          </PanelCard>

          <PanelCard>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Ölçü ve bakım</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 1.5, mt: 1.8 }}>
              <TextField label="En (cm)" type="number" value={form.widthCm} onChange={(e) => setForm((p) => ({ ...p, widthCm: e.target.value }))} sx={fieldSx} />
              <TextField label="Boy (cm)" type="number" value={form.heightCm} onChange={(e) => setForm((p) => ({ ...p, heightCm: e.target.value }))} sx={fieldSx} />
              <TextField label="Derinlik (cm)" type="number" value={form.depthCm} onChange={(e) => setForm((p) => ({ ...p, depthCm: e.target.value }))} sx={fieldSx} />
              <TextField label="Sap (cm)" type="number" value={form.strapCm} onChange={(e) => setForm((p) => ({ ...p, strapCm: e.target.value }))} sx={fieldSx} />
              <TextField label="Ağırlık (g)" type="number" value={form.weightG} onChange={(e) => setForm((p) => ({ ...p, weightG: e.target.value }))} sx={fieldSx} />
              <TextField label="Sığanlar" value={form.fits} onChange={(e) => setForm((p) => ({ ...p, fits: e.target.value }))} placeholder="Telefon, cüzdan" sx={fieldSx} />
            </Box>
            <TextField
              label="Ölçü / kullanım notu"
              value={form.measureNote}
              onChange={(e) => setForm((p) => ({ ...p, measureNote: e.target.value }))}
              sx={{ ...fieldSx, mt: 1.8 }}
            />
            <TextField
              label="Bakım talimatı"
              value={form.careInstructions}
              onChange={(e) => setForm((p) => ({ ...p, careInstructions: e.target.value }))}
              multiline
              minRows={2}
              sx={{ ...fieldSx, mt: 1.8 }}
            />
          </PanelCard>

          <PanelCard>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 0.4 }}>Teslimat</Typography>
            <FormControlLabel
              sx={{ mt: 1, mb: 1.4, '& .MuiFormControlLabel-label': { fontWeight: 700, color: T.navy } }}
              control={<Switch checked={form.immediateDelivery} onChange={(e) => setForm((p) => ({ ...p, immediateDelivery: e.target.checked }))} />}
              label={form.immediateDelivery ? 'Hemen kargoda' : 'Sipariş üzerine üretim'}
            />
            {!form.immediateDelivery ? (
              <TextField
                select
                label="Üretim süresi"
                value={PRODUCTION_TIMES.includes(form.customProductionTime) ? form.customProductionTime : '1-3 İş Günü'}
                onChange={(e) => setForm((p) => ({ ...p, customProductionTime: e.target.value }))}
                sx={{ ...fieldSx, mb: 1.8 }}
              >
                {PRODUCTION_TIMES.map((item) => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </TextField>
            ) : null}
            <TextField
              label="Ürün videosu (isteğe bağlı)"
              value={form.video}
              onChange={(e) => setForm((p) => ({ ...p, video: e.target.value }))}
              placeholder="mp4 bağlantısı"
              sx={fieldSx}
            />
          </PanelCard>
        </Box>

        <Box sx={{ display: 'grid', gap: 2, position: { lg: 'sticky' }, top: { lg: 92 } }}>
          <PanelCard>
            <Typography sx={{ fontWeight: 900, color: T.navy, mb: 1.4 }}>Görseller</Typography>
            <ImageUploader
              label="Kapak görseli"
              value={mainImage}
              onChange={setMainImage}
              hint={editing ? 'Yeni kapak yüklerseniz eskisi değişir' : 'Vitrinde görünen ilk kare · 3:4 önerilir'}
            />
            {editing?.image && !mainImage ? (
              <Box component="img" src={editing.image} alt="" sx={{ mt: 1.4, width: '100%', height: 220, objectFit: 'cover', borderRadius: '18px', bgcolor: T.surfaceSoft }} />
            ) : null}
            <Box sx={{ mt: 2.2 }}>
              <ImageUploader
                label="Galeri"
                multiple
                value={gallery}
                onChange={setGallery}
                existing={galleryPreview}
                onRemoveExisting={(url) => setRemovedImages((prev) => [...prev, url])}
                hint="En fazla 6 ek kare. Detay ve doku çekimleri ekleyin."
                height={110}
              />
            </Box>
          </PanelCard>

          <PanelCard sx={{ overflow: 'hidden', p: 0 }}>
            <Box
              sx={{
                height: 280,
                background: cover
                  ? `center / cover no-repeat url(${cover})`
                  : `linear-gradient(160deg, ${T.creamDeep} 0%, rgba(148,109,109,0.18) 100%)`
              }}
            />
            <Box sx={{ p: 2.2 }}>
              <Typography sx={{ letterSpacing: 1.4, fontWeight: 800, fontSize: 11, color: T.lavender }}>
                {categoryLabel(form.category).toUpperCase()}
              </Typography>
              <Typography sx={{ fontWeight: 900, color: T.navy, fontSize: '1.15rem', mt: 0.4, lineHeight: 1.25 }}>
                {form.title || 'Ürün adı'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                <Typography sx={{ fontWeight: 900, color: T.navy, fontSize: '1.2rem' }}>{money(sale)}</Typography>
                {discount > 0 ? (
                  <Typography sx={{ color: T.muted, textDecoration: 'line-through', fontWeight: 700 }}>{money(price)}</Typography>
                ) : null}
              </Box>
              <Typography sx={{ color: T.muted, fontSize: '0.8rem', mt: 1 }}>
                Stok {form.stock || 0} · {form.immediateDelivery ? 'Hemen kargo' : form.customProductionTime}
              </Typography>
            </Box>
          </PanelCard>
        </Box>
      </Box>
    </Box>
  );
}
