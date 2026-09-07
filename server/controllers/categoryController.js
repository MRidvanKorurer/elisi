const Category = require('../models/Category');
const Product = require('../models/Product');
const { CATEGORIES } = require('../constants/categories');

const publicMatch = {
    isActive: true,
    approvalStatus: { $nin: ['pending', 'rejected'] }
};

const FALLBACKS = Object.fromEntries(
    CATEGORIES.map((item) => [item.categoryId, item])
);
FALLBACKS.makrome = { name: 'Makrome', description: 'Sıcak dokumalar ve bohem detaylar', iconName: 'FilterVintageOutlined', color: '#946D6D', image: '/uploads/categories/makrome.jpg?v=rose1', bgGradient: 'linear-gradient(135deg, #A290B7 0%, #946D6D 100%)', bgRGBA: 'rgba(162, 144, 183, 0.15)' };
FALLBACKS.deri = { name: 'Deri', description: 'Doğal deri detaylı işçilik', iconName: 'WorkOutlineOutlined', color: '#6E5252', bgGradient: 'linear-gradient(135deg, #6E5252 0%, #946D6D 100%)', bgRGBA: 'rgba(110, 82, 82, 0.12)' };
FALLBACKS.aksesuar = { name: 'Aksesuar', description: 'Tamamlayıcı el emeği parçalar', iconName: 'AutoAwesomeOutlined', color: '#946D6D', image: '/uploads/categories/aksesuar.jpg?v=rose1', bgGradient: 'linear-gradient(135deg, #A290B7 0%, #B0CDE6 100%)', bgRGBA: 'rgba(162, 144, 183, 0.14)' };
FALLBACKS.diger = { name: 'Diğer', description: 'Atölyeden özel parçalar', iconName: 'CategoryOutlined', color: '#2E3B55', bgGradient: 'linear-gradient(135deg, #2E3B55 0%, #A290B7 100%)', bgRGBA: 'rgba(46, 59, 85, 0.08)' };

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
            categories.push(toPublicCategory(
                { categoryId: id, ...fallback, order: 80, isActive: true },
                countMap[id],
                imageMap[id]
            ));
        });

        categories.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(String(b.name), 'tr'));

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

module.exports = { getAllCategories };
