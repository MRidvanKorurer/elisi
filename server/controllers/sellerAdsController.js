const { composeAdsResponse } = require('../utils/adsInsights');

const getMyAdsBoard = async (req, res) => {
  try {
    const refreshAi = String(req.query.ai || '') === '1' || String(req.query.refresh || '') === '1';
    const payload = await composeAdsResponse({
      sellerId: req.user._id,
      refreshAi
    });
    return res.json({ success: true, ...payload });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Reklam panosu alınamadı.', hata: error.message });
  }
};

const refreshMyAdsSuggestions = async (req, res) => {
  try {
    const payload = await composeAdsResponse({
      sellerId: req.user._id,
      refreshAi: true
    });
    return res.json({ success: true, ...payload });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Öneri üretilemedi.', hata: error.message });
  }
};

module.exports = {
  getMyAdsBoard,
  refreshMyAdsSuggestions
};
