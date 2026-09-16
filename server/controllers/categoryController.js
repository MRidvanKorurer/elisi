const slugify = require('slugify');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { CATEGORIES } = require('../constants/categories');
const { publicPath } = require('../middleware/uploadMiddleware');

const publicMatch = {
  isActive: true,
  approvalStatus: { $nin: ['pending', 'rejected'] }
};

const FALLBACKS = Object.fromEntries(CATEGORIES.map((item) => [item.categoryId, item]));
FALLBACKS.makrome = {
  name: 'Makrome',
  description: 'Sıcak dokumalar ve bohem detaylar',
  iconName: 'FilterVintageOutlined',
  color: '#946D6D',
  image: '/uploads/categories/makrome.jpg?v=rose1',
  bgGradient: 'linear-gradient(135deg, #A290B7 0%, #946D6D 100%)',
  bgRGBA: 'rgba(162, 144, 183, 0.15)'
};
FALLBACKS.deri = {
  name: 'Deri',
  description: 'Doğal deri detaylı işçilik',
  iconName: 'WorkOutlineOutlined',
  color: '#6E5252',
  bgGradient: 'linear-gradient(135deg, #6E5252 0%, #946D6D 100%)',
  bgRGBA: 'rgba(110, 82, 82, 0.12)'
};
FALLBACKS.aksesuar = {
  name: 'Aksesuar',
  description: 'Tamamlayıcı el emeği parçalar',
  iconName: 'AutoAwesomeOutlined',
  color: '#946D6D',
  image: '/uploads/categories/aksesuar.jpg?v=rose1',
  bgGradient: 'linear-gradient(135deg, #A290B7 0%, #B0CDE6 100%)',
  bgRGBA: 'rgba(162, 144, 183, 0.14)'
};
FALLBACKS.diger = {
  name: 'Diğer',
  description: 'Atölyeden özel parçalar',
  iconName: 'CategoryOutlined',
  color: '#2E3B55',
  bgGradient: 'linear-gradient(135deg, #2E3B55 0%, #A290B7 100%)',
  bgRGBA: 'rgba(46, 59, 85, 0.08)'
};

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const toSlug = (value = '') =>
  slugify(String(value), { lower: true, strict: true, locale: 'tr' }).slice(0, 64);

const toPublicCategory = (doc, productCount = 0, fallbackImage = '') => ({
  categoryId: doc.categoryId,
  name: doc.name,
  image: doc.image || fallbackImage || '',
  description: doc.description || '',
  order: doc.order || 0,
  isActive: doc.isActive !== false,
  productCount,
  iconName: doc.iconName,
  color: doc.color,
  bgGradient: doc.bgGradient,
  bgRGBA: doc.bgRGBA
});

const toAdminCategory = (doc, productCount = 0) => ({
  _id: doc._id,
  categoryId: doc.categoryId,
  name: doc.name,
  image: doc.image || '',
  description: doc.description || '',
  order: doc.order || 0,
  isActive: doc.isActive !== false,
  iconName: doc.iconName || 'CategoryOutlined',
  color: doc.color || '#946D6D',
  bgGradient: doc.bgGradient || 'linear-gradient(135deg, #FDF4D2 0%, #B0CDE6 100%)',
  bgRGBA: doc.bgRGBA || 'rgba(148, 109, 109, 0.12)',
  productCount,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const productCountMap = async () => {
  const rows = await Product.aggregate([
    { $match: publicMatch },
    { $group: { _id: { $toLower: '$category' }, count: { $sum: 1 } } }
  ]);
  return Object.fromEntries(rows.filter((row) => row._id).map((row) => [row._id, row.count]));
};

const getAllCategories = async (req, res) => {
  try {
    const [docs, countRows, imageRows] = await Promise.all([
      Category.find({ isActive: true }).sort({ order: 1 }).lean(),
      Product.aggregate([
        { $match: publicMatch },
        { $group: { _id: { $toLower: '$category' }, count: { $sum: 1 } } }
      ]),
      Product.aggregate([
        { $match: { ...publicMatch, image: { $exists: true, $nin: [null, ''] } } },
        { $sort: { soldCount: -1, createdAt: -1 } },
        { $group: { _id: { $toLower: '$category' }, image: { $first: '$image' } } }
      ])
    ]);

    const countMap = {};
    let totalProducts = 0;
    countRows.forEach((row) => {
      if (!row._id) return;
      countMap[row._id] = row.count;
      totalProducts += row.count;
    });

    const imageMap = {};
    imageRows.forEach((row) => {
      if (row._id && row.image) imageMap[row._id] = row.image;
    });

    const seen = new Set();
    const categories = docs.map((doc) => {
      const id = String(doc.categoryId || '').toLowerCase();
      seen.add(id);
      return toPublicCategory(doc, countMap[id] || 0, imageMap[id]);
    });

    Object.keys(countMap).forEach((id) => {
      if (seen.has(id)) return;
      const fallback = FALLBACKS[id] || FALLBACKS.diger;
      categories.push(
        toPublicCategory({ categoryId: id, ...fallback, order: 80, isActive: true }, countMap[id], imageMap[id])
      );
    });

    categories.sort(
      (a, b) => (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(String(b.name), 'tr')
    );

    res.status(200).json({
      success: true,
      totalProducts,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kategoriler çekilirken hata oluştu.',
      error: error.message
    });
  }
};

const listAdminCategories = async (req, res) => {
  try {
    const [docs, counts] = await Promise.all([
      Category.find({}).sort({ order: 1, name: 1 }).lean(),
      productCountMap()
    ]);
    res.status(200).json({
      success: true,
      categories: docs.map((doc) => toAdminCategory(doc, counts[String(doc.categoryId || '').toLowerCase()] || 0))
    });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kategoriler alınamadı.', error: error.message });
  }
};

const createAdminCategory = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, mesaj: 'Kategori adı zorunludur.' });

    let categoryId = toSlug(req.body.categoryId || name);
    if (!categoryId || !ID_RE.test(categoryId)) {
      return res.status(400).json({ success: false, mesaj: 'Geçerli bir kategori kimliği girin (ör. el-orgu).' });
    }

    const exists = await Category.findOne({ categoryId });
    if (exists) {
      return res.status(400).json({ success: false, mesaj: 'Bu kategori kimliği zaten kayıtlı.' });
    }

    const maxOrder = await Category.findOne({}).sort({ order: -1 }).select('order').lean();
    const order = Number.isFinite(Number(req.body.order))
      ? Number(req.body.order)
      : (maxOrder?.order || 0) + 1;

    const image = publicPath(req.file) || String(req.body.image || '').trim();

    const created = await Category.create({
      categoryId,
      name,
      description: String(req.body.description || '').trim(),
      order,
      isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
      iconName: String(req.body.iconName || 'CategoryOutlined').trim() || 'CategoryOutlined',
      color: String(req.body.color || '#946D6D').trim() || '#946D6D',
      bgGradient:
        String(req.body.bgGradient || '').trim() ||
        'linear-gradient(135deg, #FDF4D2 0%, #B0CDE6 100%)',
      bgRGBA: String(req.body.bgRGBA || '').trim() || 'rgba(148, 109, 109, 0.12)',
      image
    });

    res.status(201).json({
      success: true,
      mesaj: 'Kategori eklendi.',
      category: toAdminCategory(created.toObject(), 0)
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, mesaj: 'Bu kategori kimliği zaten kayıtlı.' });
    }
    res.status(500).json({ success: false, mesaj: 'Kategori eklenemedi.', error: error.message });
  }
};

const updateAdminCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, mesaj: 'Kategori bulunamadı.' });

    if (req.body.name != null) {
      const name = String(req.body.name || '').trim();
      if (!name) return res.status(400).json({ success: false, mesaj: 'Kategori adı boş olamaz.' });
      category.name = name;
    }
    if (req.body.description != null) category.description = String(req.body.description || '').trim();
    if (req.body.order != null && req.body.order !== '') category.order = Number(req.body.order) || 0;
    if (req.body.isActive != null) {
      category.isActive = !(req.body.isActive === 'false' || req.body.isActive === false);
    }
    if (req.body.iconName != null) {
      category.iconName = String(req.body.iconName || 'CategoryOutlined').trim() || 'CategoryOutlined';
    }
    if (req.body.color != null) category.color = String(req.body.color || '#946D6D').trim() || '#946D6D';
    if (req.body.bgGradient != null) {
      category.bgGradient =
        String(req.body.bgGradient || '').trim() ||
        'linear-gradient(135deg, #FDF4D2 0%, #B0CDE6 100%)';
    }
    if (req.body.bgRGBA != null) {
      category.bgRGBA = String(req.body.bgRGBA || '').trim() || 'rgba(148, 109, 109, 0.12)';
    }

    const uploaded = publicPath(req.file);
    if (uploaded) category.image = uploaded;
    else if (req.body.image != null) category.image = String(req.body.image || '').trim();

    // categoryId değişimine izin verme — ürünler bu id’ye bağlı
    await category.save();
    const counts = await productCountMap();
    res.status(200).json({
      success: true,
      mesaj: 'Kategori güncellendi.',
      category: toAdminCategory(
        category.toObject(),
        counts[String(category.categoryId || '').toLowerCase()] || 0
      )
    });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kategori güncellenemedi.', error: error.message });
  }
};

const deleteAdminCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, mesaj: 'Kategori bulunamadı.' });

    const used = await Product.countDocuments({
      category: new RegExp(`^${String(category.categoryId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    });
    if (used > 0) {
      category.isActive = false;
      await category.save();
      return res.status(200).json({
        success: true,
        mesaj: `Bu kategoride ${used} ürün var; kategori yayından alındı (silinmedi).`,
        soft: true,
        category: toAdminCategory(category.toObject(), used)
      });
    }

    await category.deleteOne();
    res.status(200).json({ success: true, mesaj: 'Kategori silindi.', soft: false });
  } catch (error) {
    res.status(500).json({ success: false, mesaj: 'Kategori silinemedi.', error: error.message });
  }
};

module.exports = {
  getAllCategories,
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory
};
