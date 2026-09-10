const mongoose = require('mongoose');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');
const Lookbook = require('../models/Lookbook');
const Category = require('../models/Category');
const { CATEGORY_IDS } = require('../constants/categories');
const { publicPath, removeUpload } = require('../middleware/uploadMiddleware');
const { HOUSE_ATELIER, serializePublicAtelier } = require('../utils/publicAtelier');
const { buildFulfillment } = require('../utils/productFulfillment');
const { sanitizeVideoUrl } = require('../utils/productVideo');

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
            limit = 8,
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

        const ownVideo = sanitizeVideoUrl(product.video);
        const clipPromise = ownVideo
            ? Promise.resolve(null)
            : Lookbook.findOne({ product: product._id, isActive: true }).select('videoUrl').lean();

        const payload = product.toObject();
        payload.atelier = HOUSE_ATELIER;

        if (product.seller) {
            const sellerDoc = await Seller.findOne({ user: product.seller, durum: 'approved' }).lean();
            if (sellerDoc) {
                const [maker, productCount] = await Promise.all([
                    User.findById(product.seller).select('adSoyad avatarUrl').lean(),
                    Product.countDocuments(publicMatch({ seller: product.seller }))
                ]);
                payload.atelier = serializePublicAtelier(sellerDoc, maker, { productCount });
            }
        }

        if (!ownVideo) {
            const clip = await clipPromise;
            payload.video = sanitizeVideoUrl(clip?.videoUrl);
        } else {
            payload.video = ownVideo;
        }

        payload.fulfillment = buildFulfillment(payload);

        res.status(200).json({ success: true, product: payload });
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
        const clips = await Lookbook.find({
            isActive: true,
            $or: [{ placement: 'lookbook' }, { placement: { $exists: false } }, { placement: null }]
        }).sort({ order: 1, createdAt: -1 }).limit(12);
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

const toList = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const asBool = (value) => value === true || value === 'true' || value === '1';

const readDimensions = (body = {}) => {
    const num = (key) => {
        if (body[key] === undefined || body[key] === '') return null;
        const value = Number(body[key]);
        return Number.isFinite(value) ? value : null;
    };
    return {
        widthCm: num('widthCm'),
        heightCm: num('heightCm'),
        depthCm: num('depthCm'),
        strapCm: num('strapCm'),
        weightG: num('weightG'),
        fits: String(body.fits || '').trim()
    };
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
            features = '',
            careInstructions = '',
            customProductionTime = '1-3 İş Günü',
            measureNote = ''
        } = req.body;

        const mainFile = req.files?.image?.[0];
        const galleryFiles = req.files?.gallery || [];

        if (!title || !description || !category || price == null || stock == null || !mainFile) {
            galleryFiles.concat(mainFile ? [mainFile] : []).forEach((file) => removeUpload(publicPath(file)));
            return res.status(400).json({ mesaj: 'Başlık, açıklama, kategori, fiyat, stok ve ana görsel zorunludur.' });
        }

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
            features: toList(features),
            careInstructions: String(careInstructions).trim(),
            discountPercentage: Math.min(100, Math.max(0, Number(discountPercentage) || 0)),
            immediateDelivery: String(immediateDelivery) !== 'false',
            customProductionTime: String(customProductionTime).trim() || '1-3 İş Günü',
            measureNote: String(measureNote).trim(),
            dimensions: readDimensions(req.body),
            video: sanitizeVideoUrl(req.body.video),
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

const updateMyProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
        if (!product) {
            return res.status(404).json({ mesaj: 'Ürün bulunamadı.' });
        }

        const body = req.body || {};
        const onlyToggle = body.isActive !== undefined && Object.keys(body).every((key) =>
            ['isActive'].includes(key)
        ) && !req.files?.image && !req.files?.gallery;

        if (body.title !== undefined) product.title = String(body.title).trim();
        if (body.description !== undefined) product.description = String(body.description).trim();
        if (body.category !== undefined) product.category = String(body.category).toLowerCase().trim();
        if (body.price !== undefined && body.price !== '') product.price = Number(body.price);
        if (body.stock !== undefined && body.stock !== '') product.stock = Number(body.stock);
        if (body.discountPercentage !== undefined) {
            product.discountPercentage = Math.min(100, Math.max(0, Number(body.discountPercentage) || 0));
        }
        if (body.immediateDelivery !== undefined) product.immediateDelivery = asBool(body.immediateDelivery);
        if (body.customProductionTime !== undefined) {
            product.customProductionTime = String(body.customProductionTime).trim() || '1-3 İş Günü';
        }
        if (body.measureNote !== undefined) product.measureNote = String(body.measureNote).trim();
        if (body.careInstructions !== undefined) product.careInstructions = String(body.careInstructions).trim();
        if (body.video !== undefined) product.video = sanitizeVideoUrl(body.video);
        if (body.colors !== undefined) product.colors = toList(body.colors);
        if (body.sizes !== undefined) product.sizes = toList(body.sizes);
        if (body.features !== undefined) product.features = toList(body.features);
        if (['widthCm', 'heightCm', 'depthCm', 'strapCm', 'weightG', 'fits'].some((key) => body[key] !== undefined)) {
            product.dimensions = readDimensions(body);
        }

        if (body.removeImages) {
            const removals = toList(body.removeImages);
            product.additionalImages = (product.additionalImages || []).filter((url) => !removals.includes(url));
            removals.forEach(removeUpload);
        }

        const mainFile = req.files?.image?.[0];
        if (mainFile) {
            removeUpload(product.image);
            product.image = publicPath(mainFile);
        }

        const galleryFiles = req.files?.gallery || [];
        if (galleryFiles.length) {
            product.additionalImages = [...(product.additionalImages || []), ...galleryFiles.map(publicPath)].slice(0, 8);
        }

        if (body.isActive !== undefined) {
            if (product.approvalStatus !== 'approved') {
                return res.status(403).json({ mesaj: 'Ürün onaylanmadan yayına alınamaz.' });
            }
            product.isActive = asBool(body.isActive);
        }

        if (!onlyToggle && product.approvalStatus === 'rejected') {
            product.approvalStatus = 'pending';
            product.rejectionReason = '';
            product.isActive = false;
        }

        await product.save();
        return res.json({
            success: true,
            mesaj: product.approvalStatus === 'pending'
                ? 'Ürün güncellendi ve onaya gönderildi.'
                : 'Ürün güncellendi.',
            product
        });
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