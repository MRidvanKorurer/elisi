const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryId: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    
    // YENİ EKLENEN DİNAMİK TASARIM ALANLARI
    iconName: { type: String, required: true }, // MUI İkon Adı (Örn: 'ColorLensOutlined')
    color: { type: String, required: true }, // Kategori başlık rengi (Örn: '#7A9EBD')
    bgGradient: { type: String, required: true }, // Kart arkasındaki parıltı (Örn: 'linear-gradient(...)')
    bgRGBA: { type: String, required: true } // Başlıktaki ikon kutusu arka planı (Örn: 'rgba(122, 158, 189, 0.15)')
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);