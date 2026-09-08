const mongoose = require('mongoose');

const productQuestionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500
    },
    answer: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answeredAt: {
      type: Date
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

productQuestionSchema.index({ product: 1, createdAt: -1 });
productQuestionSchema.index({ user: 1, product: 1, createdAt: -1 });

module.exports = mongoose.model('ProductQuestion', productQuestionSchema);
