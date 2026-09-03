const Category = require('../models/Category');

// Tüm aktif kategorileri getir ve sıraya(order) göre diz
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ order: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Kategoriler çekilirken hata oluştu.', error: error.message });
    }
};

module.exports = { getAllCategories };