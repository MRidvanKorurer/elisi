const { composeAdsResponse } = require('../utils/adsInsights');

const getAdsBoard = async (req, res) => {
  try {
    const refreshAi = String(req.query.ai || '') === '1' || String(req.query.refresh || '') === '1';
    const payload = await composeAdsResponse({ refreshAi });
    return res.json({ success: true, ...payload });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Reklam panosu alınamadı.', hata: error.message });
  }
};

const refreshAdsSuggestions = async (req, res) => {
  try {
    const payload = await composeAdsResponse({ refreshAi: true });
    return res.json({ success: true, ...payload });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Öneri üretilemedi.', hata: error.message });
  }
};

module.exports = {
  getAdsBoard,
  refreshAdsSuggestions
};
