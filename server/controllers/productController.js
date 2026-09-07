const mongoose = require('mongoose');
const Product = require('../models/Product');
const Lookbook = require('../models/Lookbook');
const Category = require('../models/Category');
const { CATEGORY_IDS } = require('../constants/categories');
const { publicPath, removeUpload } = require('../middleware/uploadMiddleware');

const getCatalogCategoryIds = async () => {
    const docs = await Category.find({ isActive: true }).sort({ order: 1 }).select('categoryId').lean();
    if (docs.length) return docs.map((doc) => String(doc.categoryId || '').toLowerCase()).filter(Boolean);
    return CATEGORY_IDS;
};

const mergeCatalogWithUsed = (catalogIds = [], used = []) => {
    const seen = new Set(catalogIds);
    const extras = (used || [])
        .map((id) => String(id || '').toLowerCase())
        .filter((id) => id && !seen.has(id));
    return [...catalogIds, ...extras];
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

// Onay bekleyen veya reddedilen satıcı ürünleri vitrinde görünmez
const publicMatch = (extra = {}) => ({
    isActive: true,
    approvalStatus: { $nin: ['pending', 'rejected'] },
    ...extra
});

// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find(publicMatch()).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching products.', error: error.message });
    }
};

const getFilteredProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            sort = 'newest',
            page = 1,
            limit = 12,
            inStock,
            onSale,
            isNew,
            immediateDelivery,
            color,
            minRating
        } = req.query;

        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.max(1, parseInt(limit, 10) || 12);
        const skip = (currentPage - 1) * pageSize;

        const matchStage = publicMatch();

        if (search && search.trim() !== '') {
            const term = escapeRegex(search.trim());
            matchStage.$or = [
                { title: { $regex: term, $options: 'i' } },
                { name: { $regex: term, $options: 'i' } },
                { description: { $regex: term, $options: 'i' } },
                { category: { $regex: term, $options: 'i' } },
                { colors: { $regex: term, $options: 'i' } },
                { productCode: { $regex: term, $options: 'i' } }
            ];
        }

        if (category) {
            const categories = category.split(',')
                .map((c) => c.trim())
                .filter(Boolean)
                .map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i'));
            if (categories.length) {
                matchStage.category = { $in: categories };
            }
        }

        if (color) {
            const colors = color.split(',').map((c) => c.trim()).filter(Boolean);
            if (colors.length) {
                matchStage.colors = {
                    $in: colors.map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i'))
                };
            }
        }

        if (inStock === 'true' || inStock === '1') {
            matchStage.stock = { $gt: 0 };
        }
        if (onSale === 'true' || onSale === '1') {
            matchStage.discountPercentage = { $gt: 0 };
        }
        if (isNew === 'true' || isNew === '1') {
            matchStage.isNewProduct = true;
        }
        if (immediateDelivery === 'true' || immediateDelivery === '1') {
            matchStage.immediateDelivery = true;
        }

        if (minRating !== undefined && minRating !== '') {
            const ratingValue = parseFloat(minRating);
            if (!Number.isNaN(ratingValue)) {
                matchStage.rating = { $gte: ratingValue };
            }
        }

        const priceFilter = {};
        if (minPrice !== undefined && minPrice !== '') {
            const n = parseFloat(minPrice);
            if (!Number.isNaN(n)) priceFilter.$gte = n;
        }
        if (maxPrice !== undefined && maxPrice !== '') {
            const n = parseFloat(maxPrice);
            if (!Number.isNaN(n)) priceFilter.$lte = n;
        }

        let sortStage = { createdAt: -1 };
        if (sort === 'priceAsc') sortStage = { finalPrice: 1 };
        if (sort === 'priceDesc') sortStage = { finalPrice: -1 };
        if (sort === 'rating') sortStage = { rating: -1, soldCount: -1 };
        if (sort === 'popular') sortStage = { soldCount: -1, rating: -1 };
        if (sort === 'discount') sortStage = { discountPercentage: -1, finalPrice: 1 };

        // Pipeline Çalıştırma
        const pipeline = [
            { $match: matchStage },
            {
                $addFields: {
                    finalPrice: {
                        $cond: {
                            if: { $gt: [{ $ifNull: ['$discountPercentage', 0] }, 0] },
                            then: { $subtract: ['$price', { $multiply: ['$price', { $divide: ['$discountPercentage', 100] }] }] },
                            else: '$price'
                        }
                    }
                }
            }
        ];

        if (Object.keys(priceFilter).length > 0) {
            pipeline.push({ $match: { finalPrice: priceFilter } });
        }

        pipeline.push({
            $facet: {
                products: [{ $sort: sortStage }, { $skip: skip }, { $limit: pageSize }],
                totalCount: [{ $count: 'count' }]
            }
        });

        const [result] = await Product.aggregate(pipeline);
        const products = result ? result.products || [] : [];
        const totalProducts = result && result.totalCount && result.totalCount[0] ? result.totalCount[0].count : 0;

        res.status(200).json({
            success: true,
            pagination: {
                totalProducts,
                totalPages: Math.ceil(totalProducts / pageSize),
                currentPage,
                pageSize
            },
            products
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Filtreleme hatası.', error: error.message });
    }
};




const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = isObjectId(id)
            ? publicMatch({ $or: [{ _id: id }, { slug: id }] })
            : publicMatch({ slug: id });

        const product = await Product.findOne(query);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
        }

        res.status(200).json({ success: true, product });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Geçersiz ürün ID formatı.' });
        }
        res.status(500).json({ success: false, message: 'Ürün detayı getirilirken hata oluştu.', error: error.message });
    }
};

// GET /api/products/bestsellers
const getBestSellers = async (req, res) => {
    try {
        // Sadece aktif ürünleri getir, çok satandan (soldCount) aza doğru sırala
        const bestSellers = await Product.find(publicMatch())
            .sort({ soldCount: -1 })
            .limit(12); // İhtiyacına göre limiti artırabilirsin

        res.status(200).json(bestSellers);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'En çok satan ürünler getirilirken hata oluştu.',
            error: error.message
        });
    }
};

// CREATE A NEW PRODUCT
const createProduct = async (req, res) => {
    try {
        const { productCode } = req.body;

        const existingProduct = await Product.findOne({ productCode });
        if (existingProduct) {
            return res.status(400).json({ message: 'This product code already exists in the system!' });
        }

        const newProduct = await Product.create(req.body);
        res.status(201).json({ message: 'Product successfully created!', product: newProduct });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while creating the product.', error: error.message });
    }
};


// Sponsorlu ürünleri getiren metod
const getSponsoredProducts = async (req, res) => {
    try {
        // isSponsored: true olan aktif ürünleri çek
        const sponsoredProducts = await Product.find(publicMatch({ isSponsored: true })).limit(6);

        res.status(200).json({
            success: true,
            products: sponsoredProducts
        });
    } catch (error) {
        console.error("getSponsoredProducts hatası:", error);
        res.status(500).json({
            success: false,
            message: "Sponsorlu ürünler getirilirken sunucu hatası oluştu."
        });
    }
};

const getCategories = async (req, res) => {
    try {
        const [catalogIds, used] = await Promise.all([
            getCatalogCategoryIds(),
            Product.distinct('category', publicMatch())
        ]);

        res.status(200).json({
            success: true,
            categories: mergeCatalogWithUsed(catalogIds, used)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Kategoriler alınamadı.',
            error: error.message
        });
    }
};

const getFilterOptions = async (req, res) => {
    try {
        const [catalogIds, used, colors, priceAgg] = await Promise.all([
            getCatalogCategoryIds(),
            Product.distinct('category', publicMatch()),
            Product.distinct('colors', publicMatch()),
            Product.aggregate([
                { $match: publicMatch() },
                { $group: { _id: null, maxPrice: { $max: '$price' }, minPrice: { $min: '$price' } } }
            ])
        ]);

        const price = priceAgg[0] || { minPrice: 0, maxPrice: 10000 };

        res.status(200).json({
            success: true,
            categories: mergeCatalogWithUsed(catalogIds, used),
            colors: (colors || []).filter(Boolean).sort(),
            minPrice: Math.max(0, Math.floor(price.minPrice || 0)),
            maxPrice: Math.max(100, Math.ceil(price.maxPrice || 10000))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Filtre seçenekleri alınamadı.',
            error: error.message
        });
    }
};

const getLookbook = async (req, res) => {
    try {
        const clips = await Lookbook.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).limit(12);
        return res.status(200).json({
            success: true,
            products: clips.map((clip) => ({
                _id: clip.product || clip._id,
                productId: clip.product || null,
                title: clip.title,
                lookbookLabel: clip.label || clip.title,
                video: clip.videoUrl,
                image: clip.posterUrl || ''
            }))
        });
    } catch (error) {
        console.error('getLookbook hatası:', error);
        return res.status(500).json({
            success: false,
            message: 'Lookbook ürünleri getirilemedi.',
            products: []
        });
    }
};

const getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
        return res.json({ success: true, products });
    } catch (error) {
        return res.status(500).json({ success: false, mesaj: 'Ürünler alınamadı.', hata: error.message });
    }
};

const createMyProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            price,
            stock,
            discountPercentage = 0,
            immediateDelivery = 'true',
            colors = '',
            sizes = '',
            careInstructions = ''
        } = req.body;

        const mainFile = req.files?.image?.[0];
        const galleryFiles = req.files?.gallery || [];

        if (!title || !description || !category || price == null || stock == null || !mainFile) {
            galleryFiles.concat(mainFile ? [mainFile] : []).forEach((file) => removeUpload(publicPath(file)));
            return res.status(400).json({ mesaj: 'Başlık, açıklama, kategori, fiyat, stok ve ana görsel zorunludur.' });
        }

        const toList = (value) =>
            String(value)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);

        const product = await Product.create({
            seller: req.user._id,
            title: String(title).trim(),
            description: String(description).trim(),
            category: String(category).toLowerCase(),
            price: Number(price),
            stock: Number(stock),
            image: publicPath(mainFile),
            additionalImages: galleryFiles.map(publicPath),
            colors: toList(colors),
            sizes: toList(sizes),
            careInstructions: String(careInstructions).trim(),
            discountPercentage: Math.min(100, Math.max(0, Number(discountPercentage) || 0)),
            immediateDelivery: String(immediateDelivery) !== 'false',
            approvalStatus: 'pending',
            isActive: false
        });
        return res.status(201).json({
            success: true,
            mesaj: 'Ürün onaya gönderildi. Süper admin onayladığında yayına alınır.',
            product
        });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Ürün eklenemedi.', hata: error.message });
    }
};

// Satıcı fiyat, stok ve açıklamayı yönetir; görsel/başlık/kategori süper adminde kalır
const SELLER_EDITABLE = ['description', 'price', 'stock', 'discountPercentage', 'immediateDelivery'];

const updateMyProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
        if (!product) {
            return res.status(404).json({ mesaj: 'Ürün bulunamadı.' });
        }

        SELLER_EDITABLE.forEach((field) => {
            if (req.body[field] === undefined) return;
            if (field === 'price' || field === 'stock') product[field] = Number(req.body[field]);
            else if (field === 'discountPercentage') product[field] = Math.min(100, Math.max(0, Number(req.body[field]) || 0));
            else if (field === 'immediateDelivery') product[field] = Boolean(req.body[field]);
            else product[field] = String(req.body[field]).trim();
        });

        if (req.body.isActive !== undefined) {
            if (product.approvalStatus !== 'approved') {
                return res.status(403).json({ mesaj: 'Ürün onaylanmadan yayına alınamaz.' });
            }
            product.isActive = Boolean(req.body.isActive);
        }

        await product.save();
        return res.json({ success: true, mesaj: 'Ürün güncellendi.', product });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Ürün güncellenemedi.', hata: error.message });
    }
};

const deleteMyProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
        if (!product) {
            return res.status(404).json({ mesaj: 'Ürün bulunamadı.' });
        }
        removeUpload(product.image);
        (product.additionalImages || []).forEach(removeUpload);
        await product.deleteOne();
        return res.json({ success: true, mesaj: 'Ürün silindi.', id: req.params.id });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Ürün silinemedi.', hata: error.message });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    getProductById,
    getBestSellers,
    getSponsoredProducts,
    getFilteredProducts,
    getCategories,
    getFilterOptions,
    getLookbook,
    getMyProducts,
    createMyProduct,
    updateMyProduct,
    deleteMyProduct
};