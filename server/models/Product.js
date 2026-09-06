


const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
    {
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        // Temel Bilgiler
        title: {
            type: String,
            required: [true, 'Ürün başlığı zorunludur.'],
            trim: true
        },
        slug: {
            type: String,
            unique: true,
            index: true
        },
        description: {
            type: String,
            required: [true, 'Ürün açıklaması zorunludur.']
        },
        category: {
            type: String,
            required: [true, 'Kategori seçimi zorunludur.'],
            lowercase: true,
            trim: true,
            enum: {
                values: ['seramik', 'makrome', 'ahsap', 'taki', 'mum', 'canta', 'deri', 'aksesuar', 'diger'],
                message: '{VALUE} geçerli bir kategori değil.'
            }
        },
        productCode: {
            type: String,
            uppercase: true,
            trim: true
        },

        // Fiyat ve Stok
        price: {
            type: Number,
            required: [true, 'Ürün fiyatı zorunludur.'],
            min: [0, 'Fiyat 0\'dan küçük olamaz.']
        },
        discountPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        stock: {
            type: Number,
            required: [true, 'Stok miktarı zorunludur.'],
            default: 1,
            min: 0
        },

        // Varyasyonlar
        colors: {
            type: [String],
            default: []
        },
        sizes: {
            type: [String],
            default: []
        },

        // Detaylar
        features: {
            type: [String],
            default: []
        },
        careInstructions: {
            type: String,
            default: ''
        },

        // Üretim ve Teslimat
        immediateDelivery: {
            type: Boolean,
            default: true
        },
        customProductionTime: {
            type: String,
            default: '1-3 İş Günü'
        },

        // Medya
        image: {
            type: String,
            required: [true, 'Ana ürün görseli zorunludur.']
        },
        additionalImages: {
            type: [String],
            default: []
        },
        video: {
            type: String,
            default: '',
            trim: true
        },
        isLookbook: {
            type: Boolean,
            default: false,
            index: true
        },
        lookbookOrder: {
            type: Number,
            default: 0
        },
        lookbookLabel: {
            type: String,
            default: '',
            trim: true
        },

        // İstatistikler & Rozetler
        rating: {
            type: Number,
            default: 5.0,
            min: 1,
            max: 5
        },
        numReviews: {
            type: Number,
            default: 0
        },
        soldCount: {
            type: Number,
            default: 0
        },
        isNewProduct: {
            type: Boolean,
            default: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        // Satıcı ürünleri süper admin onayından sonra yayına girer
        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'approved',
            index: true
        },
        rejectionReason: {
            type: String,
            default: ''
        },
        approvedAt: {
            type: Date
        },
        isSponsored: {
            type: Boolean,
            default: false
        },
        sponsoredUntil: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// --- PRE-SAVE MIDDLEWARE (Otomatik Slug ve ProductCode Üretimi) ---
productSchema.pre('save', async function () {
    try {
        // 1. Otomatik Benzersiz ProductCode Oluşturma (Eğer girilmediyse)
        if (!this.productCode) {
            const prefix = this.category ? this.category.substring(0, 3).toUpperCase() : 'PRD';
            const randomNum = Math.floor(100000 + Math.random() * 900000);
            this.productCode = `${prefix}-${randomNum}`;
        }

        // 2. Otomatik Benzersiz Slug Oluşturma
        if (this.isModified('title') || !this.slug) {
            let baseSlug = slugify(this.title, { lower: true, strict: true, locale: 'tr' });
            let slug = baseSlug;

            // Eğer veritabanında aynı slug varsa sonuna rastgele sayı ekle
            const existingProduct = await this.constructor.findOne({ slug, _id: { $ne: this._id } });
            if (existingProduct) {
                slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
            }
            this.slug = slug;
        }
    } catch (error) {
        throw error; // next(error) YERİNE hatayı fırlatıyoruz
    }
});

module.exports = mongoose.model('Product', productSchema);