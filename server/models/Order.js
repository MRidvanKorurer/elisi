const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  image: { type: String },
  color: { type: String, default: '' },
  size: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema({
  // Giriş yapmış kullanıcılar; misafir siparişlerinde boş kalır
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  // Müşteri İletişim Bilgileri
  customerInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  // Teslimat Adresi
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true }
  },
  // Sepet ve Fiyatlandırma
  orderItems: [orderItemSchema],
  subtotal: { type: Number, required: true },
  couponCode: { type: String, default: '' },
  couponPercent: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  promoCode: { type: String, default: '' },
  promoPercent: { type: Number, default: 0 },
  promoDiscount: { type: Number, default: 0 },
  shippingCost: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true },
  
  // Ödeme ve Durum Yönetimi
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['credit_card', 'transfer', 'whatsapp'] 
  },
  paymentStatus: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'completed', 'failed'] 
  },
  orderStatus: { 
    type: String, 
    default: 'processing',
    enum: ['processing', 'shipped', 'delivered', 'cancelled']
  },
  sellerFulfillments: [{
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing'
    },
    processingAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);