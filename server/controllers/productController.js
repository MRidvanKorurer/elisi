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

module.exports = {
    getAllProducts,
    createProduct,
    getProductById,
    getBestSellers,
    getSponsoredProducts
};