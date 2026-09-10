const mongoose = require('mongoose');

const lookbookSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    label: { type: String, trim: true, required: true },
    videoUrl: { type: String, required: true, trim: true },
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
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lookbook', lookbookSchema);
