

// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');

// const userSchema = new mongoose.Schema({
//     adSoyad: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     sifre: { type: String, required: true },
//     kampanyaKodu: { type: String, unique: true },
//     // YENİ EKLENEN ALAN
//     rol: { 
//         type: String, 
//         enum: ['user', 'admin'], // Sadece bu iki değeri alabilir
//         default: 'user' 
//     }
// }, { timestamps: true });

// // DÜZELTİLEN KISIM: async function() içine next parametresi almadık ve en alttaki next() sildik.
// userSchema.pre('save', async function() {
    
//     if (this.isModified('sifre')) {
//         const salt = await bcrypt.genSalt(10);
//         this.sifre = await bcrypt.hash(this.sifre, salt);
//     }

//     if (!this.kampanyaKodu) {
//         const rastgeleKarakterler = Math.random().toString(36).substring(2, 8).toUpperCase();
//         this.kampanyaKodu = `KAMP-${rastgeleKarakterler}`;
//     }
// });

// module.exports = mongoose.model('User', userSchema);




const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Adresler için alt şema (Sub-document)
const addressSchema = new mongoose.Schema({
    baslik: { type: String, required: true }, // Ev Adresi, İş Adresi vb.
    adSoyad: { type: String, required: true },
    telefon: { type: String, required: true },
    adres: { type: String, required: true },
    il: { type: String, required: true },
    ilce: { type: String, required: true },
    isDefault: { type: Boolean, default: false } // Varsayılan adres mi?
});

// Kayıtlı Kartlar için alt şema (Sadece Token ve Maskelenmiş Veri)
const savedCardSchema = new mongoose.Schema({
    kartSahibi: { type: String, required: true },
    son4Hane: { type: String, required: true }, // Örn: '4242'
    skt: { type: String, required: true }, // Örn: '12/28'
    kartTipi: { type: String }, // Mastercard, Visa vb.
    cardToken: { type: String, required: true }, // Ödeme altyapısından dönen token
    cardUserKey: { type: String } // Iyzico vb. için kullanıcı tokeni
});

const userSchema = new mongoose.Schema({
    adSoyad: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    sifre: { type: String, required: true },
    kampanyaKodu: { type: String, unique: true },
    rol: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    
    // YENİ EKLENEN PROFİL ALANLARI
    telefon: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    
    // İLİŞKİSEL VE DİZİ ALANLARI
    adresler: [addressSchema],
    kayitliKartlar: [savedCardSchema],
    favoriler: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product' 
    }]
}, { timestamps: true });

// PRE-SAVE MIDDLEWARE
userSchema.pre('save', async function() {
    
    // Sadece şifre değiştiyse veya yeni eklendiyse hashle
    if (this.isModified('sifre')) {
        const salt = await bcrypt.genSalt(10);
        this.sifre = await bcrypt.hash(this.sifre, salt);
    }

    // Kampanya kodu yoksa oluştur
    if (!this.kampanyaKodu) {
        const rastgeleKarakterler = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.kampanyaKodu = `KAMP-${rastgeleKarakterler}`;
    }
});

module.exports = mongoose.model('User', userSchema);