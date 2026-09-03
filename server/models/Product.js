// const mongoose = require('mongoose');
// const slugify = require('slugify'); // (Opsiyonel) Başlıktan otomatik slug üretmek için

// const productSchema = new mongoose.Schema(
//     {
//         // Temel Bilgiler
//         title: {
//             type: String,
//             required: [true, 'Product title is required.'],
//             trim: true
//         },
//         slug: {
//             type: String,
//             unique: true,
//             // Örn: "El Yapımı Vazo" -> "el-yapimi-vazo"
//         },
//         description: {
//             type: String,
//             required: [true, 'Product description is required.']
//         },
//         category: {
//             type: String,
//             required: [true, 'Category selection is required.'],
//             enum: ['seramik', 'makrome', 'ahsap', 'taki', 'mum', 'diger'],
//         },
//         productCode: {
//             type: String,
//             required: [true, 'Product code is required.'],
//             // unique: true,
//             uppercase: true,
//             trim: true
//         },

//         // Fiyat ve Stok
//         price: {
//             type: Number,
//             required: [true, 'Product price is required.']
//         },
//         discountPercentage: {
//             type: Number,
//             default: 0
//         },
//         stock: {
//             type: Number,
//             required: [true, 'Stock quantity is required.'],
//             default: 1
//         },

//         // Varyasyonlar (Renk ve Boyut) - YENİ
//         colors: {
//             type: [String], // Örn: ['Krem', 'Hardal', 'Haki']
//             default: []
//         },
//         sizes: {
//             type: [String], // Örn: ['Standart', 'Büyük', 'S/M']
//             default: []
//         },

//         // Detaylı Özellikler ve Bakım - YENİ
//         features: {
//             type: [String], // Örn: ['%100 Pamuk', 'Elde yıkanabilir', 'Doğal boya']
//             default: []
//         },
//         careInstructions: {
//             type: String, // Örn: 'Sadece nemli bezle siliniz. Kimyasal kullanmayınız.'
//             default: ''
//         },

//         // Üretim ve Teslimat
//         immediateDelivery: {
//             type: Boolean,
//             default: true
//         },
//         customProductionTime: {
//             type: String,
//             default: '1-3 Business Days',
//         },

//         // Medya (Görseller)
//         image: {
//             type: String,
//             required: [true, 'At least one main product image is required.']
//         },
//         additionalImages: {
//             type: [String],
//             default: []
//         },

//         // İstatistikler, Yorumlar ve Rozetler
//         rating: {
//             type: Number,
//             default: 5.0,
//             min: 1,
//             max: 5
//         },
//         numReviews: {
//             type: Number,
//             default: 0 // YENİ: Kaç kişi değerlendirdi? (Örn: 24 Değerlendirme)
//         },
//         soldCount: {
//             type: Number,
//             default: 0 // YENİ: Bu üründen kaç tane satıldı? (Çok Satanları belirlemek için)
//         },
//         isNewProduct: {
//             type: Boolean,
//             default: true
//         },
//         isActive: {
//             type: Boolean,
//             default: true
//         },
//         isSponsored: { type: Boolean, default: false }, // Ek ücret ödeyen tedarikçi ürünü mü?
//         sponsoredUntil: { type: Date }, // Sponsorluk bitiş tarihi 
//     },
//     {
//         timestamps: true
//     }
// );

// // Mongoose Middleware: Ürün kaydedilmeden hemen ÖNCE başlığı alıp slug'a çevirir (Otomatik)
// // function (next) şeklinde düzeltilmeli
// // function (next) şeklinde düzeltilmeli
// // Mongoose'un güncel sürümlerinde senkron işlemler için next() kullanmaya gerek yoktur.
// productSchema.pre('save', function () {
//     if (this.isModified('title') && !this.slug) {
//         this.slug = slugify(this.title, { lower: true, strict: true });
//     }
// });

// module.exports = mongoose.model('Product', productSchema);





const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
    {
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