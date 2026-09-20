const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  image: { type: String },
  color: { type: String, default: '' },
  size: { type: String, default: '' },
  customBrief: {
    neededBy: { type: String, default: '', maxlength: 80 },
    fitNote: { type: String, default: '', maxlength: 400 },
    colorNote: { type: String, default: '', maxlength: 400 },
    occasion: { type: String, default: '', maxlength: 200 },
    extra: { type: String, default: '', maxlength: 800 }
  }
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
    phone: { type: String, required: true },
    identityNumber: { type: String, default: '' }
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
  promoSeller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  shippingCost: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true },
  platformFeePercent: { type: Number, default: 10, min: 0, max: 100 },
  platformFee: { type: Number, default: 0, min: 0 },
  sellerSettlements: [{
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    percent: { type: Number, default: 10 },
    gross: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    payoutStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }
  }],
  payouts: {
    platform: {
      label: { type: String, default: 'Site komisyonu' },
      holder: { type: String, default: '' },
      name: { type: String, default: '' },
      iban: { type: String, default: '' },
      amount: { type: Number, default: 0 }
    },
    sellers: [{
      seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      label: { type: String, default: 'Atölye payı' },
      holder: { type: String, default: '' },
      name: { type: String, default: '' },
      iban: { type: String, default: '' },
      amount: { type: Number, default: 0 }
    }]
  },
  
  // Ödeme ve Durum Yönetimi
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['credit_card', 'transfer', 'whatsapp'] 
  },
  bankAccount: {
    name: { type: String, default: '' },
    holder: { type: String, default: '' },
    iban: { type: String, default: '' }
  },
  paymentStatus: { 
    type: String, 
    default: 'pending', 
    enum: ['pending', 'completed', 'failed'] 
  },
  stockAdjusted: { type: Boolean, default: false },
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
  }],
  makerNotes: [{
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    authorRole: { type: String, enum: ['buyer', 'seller'], required: true },
    authorName: { type: String, default: '', maxlength: 80 },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);