const mongoose = require('mongoose');

const adEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['impression', 'click'],
      required: true,
      index: true
    },
    surface: {
      type: String,
      enum: ['featured', 'product', 'atelier', 'banner'],
      default: 'product',
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    session: {
      type: String,
      default: '',
      trim: true,
      maxlength: 64
    },
    path: {
      type: String,
      default: '',
      trim: true,
      maxlength: 180
    }
  },
  { timestamps: true }
);

adEventSchema.index({ createdAt: -1, type: 1, surface: 1 });

module.exports = mongoose.model('AdEvent', adEventSchema);
