const mongoose = require('mongoose');

const lookbookSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, required: true },
    subtitle: { type: String, trim: true, default: '' },
    videoUrl: { type: String, trim: true, default: '' },
    posterUrl: { type: String, trim: true, default: '' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    key: { type: String, trim: true, unique: true, sparse: true },
    placement: {
      type: String,
      enum: ['lookbook', 'hero', 'homepage'],
      default: 'lookbook',
      index: true
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    en: {
      title: { type: String, default: '' },
      label: { type: String, default: '' },
      subtitle: { type: String, default: '' },
      sourceHash: { type: String, default: '' },
      translatedAt: { type: Date }
    }
  },
  { timestamps: true }
);

lookbookSchema.post('save', () => require('../services/contentTranslation').scheduleSweep());

module.exports = mongoose.model('Lookbook', lookbookSchema);
