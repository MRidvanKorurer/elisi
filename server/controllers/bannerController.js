const Banner = require('../models/Banner');

// GET /api/banners
exports.getActiveBanners = async (req, res) => {
  try {
    // Sadece aktif olanları getir ve "order" numarasına göre küçükten büyüğe sırala
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Banner görselleri getirilirken hata oluştu.', 
      error: error.message 
    });
  }
};