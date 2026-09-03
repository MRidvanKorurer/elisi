const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { 
    type: String, 
    default: 'Hero Banner' 
  },
  url: { 
    type: String, 
    required: [true, 'Banner görsel URL\'si zorunludur.'] 
  },
  isActive: { 
    type: Boolean, 
    default: true // İleride bir banner'ı silmeden gizlemek istersen false yaparsın
  },
  order: { 
    type: Number, 
    default: 0 // Hangi görselin önce çıkacağını belirlemek için sıra numarası
  }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);