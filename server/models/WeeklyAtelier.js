const mongoose = require('mongoose');

const weeklyAtelierSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Uzatmalarda gün sayısı birikir (7, 14, 21...); paket seçimi denetleyicide doğrulanır.
    days: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'Gün sayısı tam sayı olmalı.' }
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'live', 'ended', 'rejected', 'cancelled'],
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

weeklyAtelierSchema.index({ seller: 1, status: 1 });

module.exports = mongoose.model('WeeklyAtelier', weeklyAtelierSchema);
