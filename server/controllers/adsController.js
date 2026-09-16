const mongoose = require('mongoose');
const AdEvent = require('../models/AdEvent');
const Product = require('../models/Product');

const SURFACES = new Set(['featured', 'product', 'atelier', 'banner']);
const TYPES = new Set(['impression', 'click']);

const asId = (value) => {
  const text = String(value || '').trim();
  return mongoose.Types.ObjectId.isValid(text) ? text : null;
};

const recordEvents = async (req, res) => {
  try {
    const raw = Array.isArray(req.body?.events) ? req.body.events : [req.body];
    const sliced = raw.filter(Boolean).slice(0, 40);
    if (!sliced.length) return res.json({ success: true, saved: 0 });

    const productIds = [...new Set(sliced.map((item) => asId(item.product)).filter(Boolean))];
    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds } }).select('_id seller').lean()
      : [];
    const sellerByProduct = new Map(products.map((item) => [String(item._id), item.seller]));

    const docs = sliced.map((item) => {
      const productId = asId(item.product);
      const type = TYPES.has(item.type) ? item.type : 'click';
      const surface = SURFACES.has(item.surface) ? item.surface : 'product';
      return {
        type,
        surface,
        product: productId,
        seller: asId(item.seller) || sellerByProduct.get(String(productId)) || null,
        user: req.user?._id || null,
        session: String(item.session || '').slice(0, 64),
        path: String(item.path || '').slice(0, 180)
      };
    });

    if (!docs.length) return res.json({ success: true, saved: 0 });
    await AdEvent.insertMany(docs, { ordered: false });
    return res.json({ success: true, saved: docs.length });
  } catch (error) {
    return res.status(500).json({ mesaj: 'Olay kaydedilemedi.', hata: error.message });
  }
};

module.exports = { recordEvents };
