

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    adSoyad: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    sifre: { type: String, required: true },
    kampanyaKodu: { type: String, unique: true },
    // YENİ EKLENEN ALAN
    rol: { 
        type: String, 
        enum: ['user', 'admin'], // Sadece bu iki değeri alabilir
        default: 'user' 
    }
}, { timestamps: true });

// DÜZELTİLEN KISIM: async function() içine next parametresi almadık ve en alttaki next() sildik.
userSchema.pre('save', async function() {
    
    if (this.isModified('sifre')) {
        const salt = await bcrypt.genSalt(10);
        this.sifre = await bcrypt.hash(this.sifre, salt);
    }

    if (!this.kampanyaKodu) {
        const rastgeleKarakterler = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.kampanyaKodu = `KAMP-${rastgeleKarakterler}`;
    }
});

module.exports = mongoose.model('User', userSchema);