const mongoose = require('mongoose');

const lookbookSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, required: true },
    videoUrl: { type: String, required: true, trim: true },
    posterUrl: { type: String, trim: true, default: '' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lookbook', lookbookSchema);
