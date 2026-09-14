const Lookbook = require('../models/Lookbook');
const { removeUpload } = require('../utils/uploadStore');

const listLookbook = async (req, res) => {
  try {
    const includeInactive = Boolean(req.adminAll) || (req.user?.rol === 'superadmin' && req.query.all === '1');
    const filter = includeInactive ? {} : { isActive: true };
    const placement = String(req.query.placement || '').trim();
    if (placement) filter.placement = placement;
    else if (!includeInactive) {
      filter.$or = [{ placement: 'lookbook' }, { placement: { $exists: false } }, { placement: null }];
    }
    const items = await Lookbook.find(filter).sort({ order: 1, createdAt: -1 });
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Lookbook alınamadı.', hata: error.message });
  }
};

const PLACEMENTS = ['lookbook', 'hero', 'homepage'];

const placementOf = (value) => (PLACEMENTS.includes(value) ? value : 'lookbook');

const productIdOf = (value) => {
  const id = String(value || '').trim();
  return id || null;
};

const createLookbook = async (req, res) => {
  try {
    const videoFile = req.files?.video?.[0];
    const posterFile = req.files?.poster?.[0];
    const placement = placementOf(req.body.placement);

    if (placement === 'hero' && !posterFile) {
      return res.status(400).json({ mesaj: 'Hero banner için bir görsel seçin.' });
    }
    if (placement !== 'hero' && !videoFile) {
      return res.status(400).json({ mesaj: 'Hareketli klip için bir video seçin.' });
    }

    const last = await Lookbook.findOne({ placement }).sort({ order: -1 }).select('order').lean();
    const item = await Lookbook.create({
      title: String(req.body.title || '').trim(),
      label: String(req.body.label || req.body.title || (placement === 'hero' ? 'Hero' : 'Klip')).trim(),
      videoUrl: videoFile?.storedUrl || '',
      posterUrl: posterFile?.storedUrl || '',
      product: productIdOf(req.body.productId),
      placement,
      order: Number(req.body.order) || (Number(last?.order) || 0) + 1,
      isActive: req.body.isActive !== 'false'
    });

    return res.status(201).json({
      success: true,
      item,
      mesaj: placement === 'hero' ? 'Hero görseli eklendi.' : 'Klip eklendi.'
    });
  } catch (error) {
    removeUpload(req.files?.video?.[0]?.storedUrl);
    removeUpload(req.files?.poster?.[0]?.storedUrl);
    return res.status(500).json({ success: false, mesaj: 'İçerik eklenemedi.', hata: error.message });
  }
};

const updateLookbook = async (req, res) => {
  try {
    const item = await Lookbook.findById(req.params.id);
    if (!item) return res.status(404).json({ mesaj: 'Kayıt bulunamadı.' });

    if (req.body.label != null) item.label = String(req.body.label || '').trim() || item.label;
    if (req.body.title != null) item.title = String(req.body.title || '').trim();
    if (req.body.order != null && req.body.order !== '') item.order = Number(req.body.order) || 0;
    if (req.body.isActive != null) item.isActive = req.body.isActive === true || req.body.isActive === 'true';
    if (req.body.placement) item.placement = placementOf(req.body.placement);
    if (req.body.productId != null) item.product = productIdOf(req.body.productId);

    const videoFile = req.files?.video?.[0];
    const posterFile = req.files?.poster?.[0];
    if (videoFile?.storedUrl) {
      removeUpload(item.videoUrl);
      item.videoUrl = videoFile.storedUrl;
    }
    if (posterFile?.storedUrl) {
      removeUpload(item.posterUrl);
      item.posterUrl = posterFile.storedUrl;
    }
    if (!item.videoUrl && !item.posterUrl) {
      return res.status(400).json({ mesaj: 'Görsel veya video gerekli.' });
    }

    await item.save();
    return res.json({ success: true, item, mesaj: 'İçerik güncellendi.' });
  } catch (error) {
    removeUpload(req.files?.video?.[0]?.storedUrl);
    removeUpload(req.files?.poster?.[0]?.storedUrl);
    return res.status(500).json({ success: false, mesaj: 'İçerik güncellenemedi.', hata: error.message });
  }
};

const setLookbookPublished = async (req, res) => {
  try {
    const item = await Lookbook.findById(req.params.id);
    if (!item) return res.status(404).json({ mesaj: 'Kayıt bulunamadı.' });
    item.isActive = req.body.isActive === true || req.body.isActive === 'true';
    await item.save();
    return res.json({
      success: true,
      item,
      mesaj: item.isActive
        ? 'Yeniden yayına alındı.'
        : 'Yayından alındı. Klip silinmedi, tekrar yayınlayabilirsiniz.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Yayın durumu güncellenemedi.', hata: error.message });
  }
};

const deleteLookbook = async (req, res) => {
  try {
    const item = await Lookbook.findById(req.params.id);
    if (!item) return res.status(404).json({ mesaj: 'Kayıt bulunamadı.' });

    removeUpload(item.videoUrl);
    removeUpload(item.posterUrl);
    await item.deleteOne();
    return res.json({ success: true, mesaj: 'Kayıt silindi.' });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Silinemedi.', hata: error.message });
  }
};

module.exports = { listLookbook, createLookbook, updateLookbook, setLookbookPublished, deleteLookbook };
