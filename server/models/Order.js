const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    // required: true YAZMAMALI! (Eğer varsa bu satırı sil)
  },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  image: { type: String }
});

const orderSchema = new mongoose.Schema({
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);