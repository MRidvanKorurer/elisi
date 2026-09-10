const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  percent: { type: Number, required: true, min: 1, max: 80 },
  minSubtotal: { type: Number, default: 0, min: 0 },
  note: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
  usedCount: { type: Number, default: 0, min: 0 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
