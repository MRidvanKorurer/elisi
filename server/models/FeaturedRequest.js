const mongoose = require('mongoose');

const featuredRequestSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    days: {
      type: Number,
      required: true,
      enum: [3, 5, 7]
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'removed'],
      default: 'pending',
      index: true
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 400
    },
    receiptUrl: {
      type: String,
      default: '',
      trim: true
    },
    receiptName: {
      type: String,
      default: '',
      trim: true
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date
    },
    startsAt: {
      type: Date
    },
    endsAt: {
      type: Date
    }
  },
  { timestamps: true }
);

featuredRequestSchema.index({ product: 1, status: 1 });

module.exports = mongoose.model('FeaturedRequest', featuredRequestSchema);
