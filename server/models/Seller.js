const mongoose = require('mongoose');
const slugify = require('slugify');
const { ALL_CATEGORY_IDS } = require('../constants/categories');

const MAGAZA_TURLERI = ALL_CATEGORY_IDS;

const sellerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        magazaAdi: {
            type: String,
            required: [true, 'Mağaza adı zorunludur.'],
            trim: true,
            minlength: [3, 'Mağaza adı en az 3 karakter olmalıdır.']
        },
        slug: {
            type: String,
            unique: true,
            index: true
        },
        hesapTipi: {
            type: String,
            enum: ['bireysel', 'kurumsal'],
            default: 'bireysel'
        },
        magazaTuru: {
            type: String,
            required: [true, 'Mağaza türü zorunludur.'],
            lowercase: true,
            enum: {
                values: MAGAZA_TURLERI,
                message: '{VALUE} geçerli bir mağaza türü değil.'
            }
        },
        aciklama: {
            type: String,
            default: '',
            maxlength: [1000, 'Mağaza açıklaması en fazla 1000 karakter olabilir.']
        },
        telefon: {
            type: String,
            required: [true, 'Telefon numarası zorunludur.'],
            trim: true
        },
        sehir: { type: String, required: [true, 'Şehir zorunludur.'], trim: true },
        ilce: { type: String, required: [true, 'İlçe zorunludur.'], trim: true },
        adres: { type: String, required: [true, 'Adres zorunludur.'], trim: true },
        iban: { type: String, required: [true, 'IBAN zorunludur.'], trim: true, uppercase: true },
        tcKimlik: { type: String, trim: true, default: '' },
        vergiNo: { type: String, trim: true, default: '' },
        instagram: { type: String, trim: true, default: '' },
        website: { type: String, trim: true, default: '' },
        sozlesmeOnay: { type: Boolean, required: true, default: false },
        durum: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'suspended'],
            default: 'pending'
        },
        reddetmeNedeni: { type: String, default: '' }
    },
    { timestamps: true }
);

sellerSchema.index({ magazaAdi: 1 }, { unique: true });

sellerSchema.pre('save', async function () {
    if (this.iban) {
        this.iban = this.iban.replace(/\s+/g, '').toUpperCase();
    }

    if (this.isModified('magazaAdi') || !this.slug) {
        let baseSlug = slugify(this.magazaAdi, { lower: true, strict: true, locale: 'tr' });
        if (!baseSlug) baseSlug = 'magaza';
        let slug = baseSlug;
        const existing = await this.constructor.findOne({ slug, _id: { $ne: this._id } });
        if (existing) {
            slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        this.slug = slug;
    }
});

module.exports = mongoose.model('Seller', sellerSchema);
module.exports.MAGAZA_TURLERI = MAGAZA_TURLERI;
