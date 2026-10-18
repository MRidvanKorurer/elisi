const mongoose = require('mongoose');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const User = require('../models/User');
const Lookbook = require('../models/Lookbook');
const Category = require('../models/Category');
const { CATEGORY_IDS, CATEGORY_LABELS_EN } = require('../constants/categories');
const { publicPath, removeUpload } = require('../middleware/uploadMiddleware');
const { HOUSE_ATELIER, serializePublicAtelier } = require('../utils/publicAtelier');
const { expireFeaturedProducts } = require('./featuredController');
const { expireWeeklyAteliers } = require('./atelierWeekController');
const { buildFulfillment } = require('../utils/productFulfillment');
const { localizeBody } = require('../utils/localize');
const { lookupColor } = require('../i18n/contentGlossary');
const { translateTexts } = require('../services/translationService');
const { sanitizeVideoUrl } = require('../utils/productVideo');
const { sanitizeModelUrl } = require('../utils/productModel');
const { notifyFavoritesIfDiscounted } = require('../services/whatsappService');
const { notifyAdmin } = require('../services/emailService');

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
const LIST_SELECT = 'title name image images description price category discountPercentage soldCount rating numReviews stock isNewProduct slug seller vendorName createdAt isSponsored en.title en.description';

const listProjection = {
    title: 1,
    name: 1,
    image: 1,
    images: 1,
    description: 1,
    price: 1,
    category: 1,
    discountPercentage: 1,
    soldCount: 1,
    rating: 1,
    numReviews: 1,
    stock: 1,
    isNewProduct: 1,
    slug: 1,
    seller: 1,
    vendorName: 1,
    createdAt: 1,
    isSponsored: 1,
    sponsoredUntil: 1,
    finalPrice: 1,
    'en.title': 1,
    'en.description': 1
};

const getAllProducts = async (req, res) => {
    try {
        await expireFeaturedProducts();
        const products = await Product.find(publicMatch())
            .select(LIST_SELECT)
            .sort({ isSponsored: -1, createdAt: -1 })
            .limit(24)
            .lean();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Ürünler şu an yüklenemedi. Lütfen tekrar deneyin.' });
    }
};

const getFilteredProducts = async (req, res) => {
    try {
        await expireFeaturedProducts();
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
                { productCode: { $regex: term, $options: 'i' } },
                { 'en.title': { $regex: term, $options: 'i' } },
                { 'en.description': { $regex: term, $options: 'i' } },
                { 'en.features': { $regex: term, $options: 'i' } }
            ];
            const needle = search.trim().toLowerCase();
            const enCategories = Object.entries(CATEGORY_LABELS_EN)
                .filter(([, label]) => label.toLowerCase().includes(needle))
                .map(([id]) => id);
            if (needle.length >= 3 && enCategories.length) matchStage.$or.push({ category: { $in: enCategories } });
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
        } else if (
            immediateDelivery === 'false'
            || immediateDelivery === '0'
            || req.query.custom === '1'
            || req.query.custom === 'true'
        ) {
            matchStage.immediateDelivery = false;
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

        let sortStage = { isSponsored: -1, createdAt: -1 };
        if (sort === 'created') sortStage = { createdAt: -1 };
        if (sort === 'priceAsc') sortStage = { isSponsored: -1, finalPrice: 1 };
        if (sort === 'priceDesc') sortStage = { isSponsored: -1, finalPrice: -1 };
        if (sort === 'rating') sortStage = { isSponsored: -1, rating: -1, soldCount: -1 };
        if (sort === 'popular') sortStage = { isSponsored: -1, soldCount: -1, rating: -1 };
        if (sort === 'discount') sortStage = { isSponsored: -1, discountPercentage: -1, finalPrice: 1 };

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
                products: [
                    { $sort: sortStage },
                    { $skip: skip },
                    { $limit: pageSize },
                    { $project: listProjection }
                ],
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

        await expireWeeklyAteliers();
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
        payload.favoriteCount = await User.countDocuments({ favoriler: product._id }).catch(() => 0);

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

        payload.fulfillment = req.lang === 'en'
            ? buildFulfillment(localizeBody({ product: payload }, 'en').product, 'en')
            : buildFulfillment(payload);

        res.status(200).json({ success: true, product: payload });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Geçersiz ürün ID formatı.' });
        }
        res.status(500).json({ success: false, message: 'Ürün detayı getirilirken hata oluştu.', error: error.message });
    }
};

// POST /api/products/:id/view
const recordProductView = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isObjectId(id)) return res.status(204).end();
        const product = await Product.findOneAndUpdate(
            publicMatch({ _id: id }),
            { $inc: { viewCount: 1 } },
            { returnDocument: 'after', projection: { viewCount: 1 } }
        ).lean();
        if (!product) return res.status(204).end();
        res.status(200).json({ success: true, viewCount: product.viewCount || 0 });
    } catch {
        res.status(204).end();
    }
};

// GET /api/products/bestsellers
const getBestSellers = async (req, res) => {
    try {
        await expireFeaturedProducts();
        const bestSellers = await Product.find(publicMatch())
            .select(LIST_SELECT)
            .sort({ soldCount: -1 })
            .limit(10)
            .lean();

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
        res.status(500).json({ message: 'Ürün eklenemedi. Lütfen tekrar deneyin.' });
    }
};


// Sponsorlu ürünleri getiren metod
const getSponsoredProducts = async (req, res) => {
    try {
        await expireFeaturedProducts();
        const now = new Date();
        const sponsoredProducts = await Product.find(publicMatch({
            isSponsored: true,
            sponsoredUntil: { $gt: now }
        }))
            .select(LIST_SELECT)
            .sort({ sponsoredUntil: -1, updatedAt: -1 })
            .lean();

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

const colorLabelsEn = async (colors = []) => {
    const map = await translateTexts(colors.filter((color) => !lookupColor(color))).catch(() => new Map());
    return Object.fromEntries(colors.map((color) => [color, lookupColor(color) || map.get(color) || color]));
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
        const colorList = (colors || []).filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));

        res.status(200).json({
            success: true,
            categories: mergeCatalogWithUsed(catalogIds, used),
            colors: colorList,
            ...(req.lang === 'en' ? { colorLabels: await colorLabelsEn(colorList) } : {}),
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

const assignModel = (product, body = {}, file) => {
    if (file) {
        const next = publicPath(file);
        if (product.model3dUrl && product.model3dUrl !== next) removeUpload(product.model3dUrl);
        product.model3dUrl = next;
        return;
    }
    if (body.model3dUrl === undefined) return;
    const next = sanitizeModelUrl(body.model3dUrl);
    if (product.model3dUrl && product.model3dUrl !== next) removeUpload(product.model3dUrl);
    product.model3dUrl = next;
};

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
        const modelFile = req.files?.model3d?.[0];

        if (!title || !description || !category || price == null || stock == null || !mainFile) {
            galleryFiles.concat(mainFile ? [mainFile] : [], modelFile ? [modelFile] : []).forEach((file) => removeUpload(publicPath(file)));
            return res.status(400).json({ mesaj: 'Başlık, açıklama, kategori, fiyat, stok ve ana görsel zorunludur.' });
        }

        const product = await Product.create({
            seller: req.user._id,
            title: String(title).trim(),
            description: String(description).trim(),
            category: String(category).toLowerCase(),
            price: Number(price),
            costPrice: Math.max(0, Number(req.body.costPrice) || 0),
            shippingCostCover: Math.max(0, Number(req.body.shippingCostCover) || 0),
            extraCost: Math.max(0, Number(req.body.extraCost) || 0),
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
            model3dUrl: modelFile ? publicPath(modelFile) : sanitizeModelUrl(req.body.model3dUrl),
            approvalStatus: 'pending',
            isActive: false
        });
        res.status(201).json({
            success: true,
            mesaj: 'Ürün onaya gönderildi. Süper admin onayladığında yayına alınır.',
            product
        });
        const shop = await Seller.findOne({ user: req.user._id }).select('magazaAdi').lean().catch(() => null);
        return notifyAdmin({
            subject: 'Onay bekleyen yeni ürün',
            intro: 'Bir satıcı yeni ürün ekledi. Ürün siz onaylayana kadar yayında görünmez.',
            fields: [
                ['Ürün', product.title],
                ['Mağaza', shop?.magazaAdi || req.user.adSoyad],
                ['Fiyat', `${Number(product.price || 0).toLocaleString('tr-TR')} ₺`],
                ['Kategori', product.category],
                ['Stok', product.stock]
            ]
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
        const previousPricing = {
            price: product.price,
            discountPercentage: product.discountPercentage
        };

        const body = req.body || {};
        const onlyToggle = body.isActive !== undefined && Object.keys(body).every((key) =>
            ['isActive'].includes(key)
        ) && !req.files?.image && !req.files?.gallery && !req.files?.model3d;

        if (body.title !== undefined) product.title = String(body.title).trim();
        if (body.description !== undefined) product.description = String(body.description).trim();
        if (body.category !== undefined) product.category = String(body.category).toLowerCase().trim();
        if (body.price !== undefined && body.price !== '') product.price = Number(body.price);
        if (body.costPrice !== undefined) product.costPrice = Math.max(0, Number(body.costPrice) || 0);
        if (body.shippingCostCover !== undefined) product.shippingCostCover = Math.max(0, Number(body.shippingCostCover) || 0);
        if (body.extraCost !== undefined) product.extraCost = Math.max(0, Number(body.extraCost) || 0);
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
        assignModel(product, body, req.files?.model3d?.[0]);
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
        notifyFavoritesIfDiscounted(product, previousPricing)
            .catch((error) => console.error('WhatsApp indirim bildirimi:', error.message));
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
        if (product.model3dUrl) removeUpload(product.model3dUrl);
        await product.deleteOne();
        return res.json({ success: true, mesaj: 'Ürün silindi.', id: req.params.id });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Ürün silinemedi.', hata: error.message });
    }
};

// GET /api/products/sitemap-entries
const getSitemapEntries = async (req, res) => {
    try {
        const [products, sellers, categories, counts] = await Promise.all([
            Product.find(publicMatch())
                .select('_id slug title image category updatedAt createdAt')
                .sort({ updatedAt: -1 })
                .limit(5000)
                .lean(),
            Seller.find({ durum: 'approved', slug: { $exists: true, $ne: '' } })
                .select('slug user updatedAt')
                .lean(),
            Category.find({ isActive: true }).select('categoryId updatedAt').lean(),
            Product.aggregate([
                { $match: publicMatch() },
                { $group: { _id: { $toLower: '$category' }, count: { $sum: 1 }, seller: { $addToSet: '$seller' }, updatedAt: { $max: '$updatedAt' } } }
            ])
        ]);

        const countByCategory = new Map(counts.map((row) => [row._id, row]));
        const sellersWithProducts = new Set(
            counts.flatMap((row) => (row.seller || []).filter(Boolean).map(String))
        );

        res.set('Cache-Control', 'public, max-age=300');
        res.status(200).json({
            success: true,
            products: products.map((item) => ({
                id: String(item._id),
                slug: item.slug || '',
                title: item.title,
                image: item.image || '',
                updatedAt: item.updatedAt || item.createdAt
            })),
            ateliers: sellers
                .filter((item) => sellersWithProducts.has(String(item.user)))
                .map((item) => ({ slug: item.slug, updatedAt: item.updatedAt })),
            categories: categories
                .map((item) => {
                    const row = countByCategory.get(String(item.categoryId || '').toLowerCase());
                    return row ? { id: item.categoryId, count: row.count, updatedAt: row.updatedAt || item.updatedAt } : null;
                })
                .filter(Boolean)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Site haritası verisi alınamadı.' });
    }
};

const getCategoryHighlights = async (req, res) => {
    try {
        const [docs, groups] = await Promise.all([
            Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
            Product.aggregate([
                { $match: publicMatch() },
                { $sort: { soldCount: -1, createdAt: -1 } },
                {
                    $group: {
                        _id: { $toLower: '$category' },
                        products: {
                            $push: {
                                _id: '$_id',
                                title: '$title',
                                image: '$image',
                                price: '$price',
                                discountPercentage: '$discountPercentage',
                                soldCount: '$soldCount',
                                slug: '$slug',
                                category: '$category',
                                stock: '$stock',
                                en: { title: '$en.title', description: '$en.description' }
                            }
                        }
                    }
                }
            ])
        ]);

        const byId = new Map(groups.filter((row) => row._id).map((row) => [row._id, row.products || []]));
        const seen = new Set();
        const highlights = [];

        const pushGroup = (id, name, image, order = 0, en = null) => {
            const products = (byId.get(id) || []).slice(0, 3);
            if (!products.length) return;
            seen.add(id);
            highlights.push({
                categoryId: id,
                name: name || id,
                image: image || products[0].image || '',
                order,
                productCount: (byId.get(id) || []).length,
                products,
                ...(en?.name ? { en: { name: en.name } } : {})
            });
        };

        docs.forEach((doc) => {
            const id = String(doc.categoryId || '').toLowerCase();
            if (!id) return;
            pushGroup(id, doc.name, doc.image, doc.order || 0, doc.en);
        });

        byId.forEach((products, id) => {
            if (seen.has(id)) return;
            pushGroup(id, id, products[0]?.image || '', 80);
        });

        highlights.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(String(b.name), 'tr'));
        return res.json({ success: true, highlights });
    } catch (error) {
        console.error('getCategoryHighlights hatası:', error);
        return res.status(500).json({ success: false, message: 'Kategori vitrini şu an yüklenemedi. Lütfen tekrar deneyin.' });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    getProductById,
    recordProductView,
    getSitemapEntries,
    getBestSellers,
    getSponsoredProducts,
    getCategoryHighlights,
    getFilteredProducts,
    getCategories,
    getFilterOptions,
    getMyProducts,
    createMyProduct,
    updateMyProduct,
    deleteMyProduct
};