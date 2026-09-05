const Product = require('../models/Product');

// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching products.', error: error.message });
    }
};

const getFilteredProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice, sort = 'newest', page = 1, limit = 12 } = req.query;

        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.max(1, parseInt(limit, 10) || 12);
        const skip = (currentPage - 1) * pageSize;

        // $match koşulları
        const matchStage = {};

        if (search && search.trim() !== '') {
            matchStage.$or = [
                { title: { $regex: search.trim(), $options: 'i' } },
                { name: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        if (category) {
            const categories = category.split(',').map(c => new RegExp(`^${c.trim()}$`, 'i'));
            matchStage.category = { $in: categories };
        }

        const priceFilter = {};
        if (minPrice !== undefined && minPrice !== '') priceFilter.$gte = parseFloat(minPrice);
        if (maxPrice !== undefined && maxPrice !== '') priceFilter.$lte = parseFloat(maxPrice);

        let sortStage = { createdAt: -1 };
        if (sort === 'priceAsc') sortStage = { finalPrice: 1 };
        if (sort === 'priceDesc') sortStage = { finalPrice: -1 };

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
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }

        res.status(200).json(product);
    } catch (error) {
        // Eğer gönderilen ID formatı MongoDB ID'si formatında değilse (CastError) hata çökmesini engelliyoruz
        if (error.name === 'CastError') {
            return res.status(404).json({ message: 'Geçersiz ürün ID formatı.' });
        }
        res.status(500).json({ message: 'Ürün detayı getirilirken hata oluştu.', error: error.message });
    }
};

// GET /api/products/bestsellers
const getBestSellers = async (req, res) => {
    try {
        // Sadece aktif ürünleri getir, çok satandan (soldCount) aza doğru sırala
        const bestSellers = await Product.find({ isActive: true })
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
        const sponsoredProducts = await Product.find({
            isSponsored: true,
            isActive: true
        }).limit(6);

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
        // Veritabanındaki ürünlerden benzersiz kategori listesini çek
        const categories = await Product.distinct('category');
        
        // Boş veya null olanları temizle
        const validCategories = categories.filter(c => c && c.trim() !== '');

        res.status(200).json({
            success: true,
            categories: validCategories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Kategoriler alınamadı.',
            error: error.message
        });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    getProductById,
    getBestSellers,
    getSponsoredProducts,
    getFilteredProducts,
    getCategories
};