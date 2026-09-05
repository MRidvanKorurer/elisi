const dns = require('dns');
// DNS çözümleme sırasını ve sunucularını ayarla (MongoDB Atlas SRV engelleri için)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Banner = require('./models/Banner');

dotenv.config();

const fakeProducts = [
    // ------------------------------------------------------------------
    // SPONSORLU / ÖNERİLEN ÜRÜNLER (2 ADET)
    // ------------------------------------------------------------------
    {
        title: "El Şekillendirme Seramik Vazo",
        description: "Tamamen el yapımı, modern tasarımlı seramik vazo. Evinize şıklık katar.",
        category: "seramik",
        productCode: "SRM-001",
        price: 450,
        discountPercentage: 0,
        stock: 15,
        immediateDelivery: true,
        image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        isNewProduct: true,
        isActive: true,
        isSponsored: true, // 1. ÖNERİLEN ÜRÜN
        sponsoredUntil: new Date('2027-12-31')
    },
    {
        title: "Ceviz Ağacı Epoksi Sunum Tepsisi",
        description: "Doğal ceviz ağacından üretilmiş, şeffaf epoksi detaylı şık ve lüks sunum tepsisi.",
        category: "ahsap",
        productCode: "AHS-001",
        price: 580,
        discountPercentage: 15,
        stock: 8,
        immediateDelivery: true,
        image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        isNewProduct: true,
        isActive: true,
        isSponsored: true, // 2. ÖNERİLEN ÜRÜN
        sponsoredUntil: new Date('2027-12-31')
    },

    // ------------------------------------------------------------------
    // DİĞER STANDART ÜRÜNLER
    // ------------------------------------------------------------------
    {
        title: "El Şekillendirme Dokulu Seramik Vazo (Test)",
        description: "Özel dokulu yüzeye sahip, koleksiyonluk el yapımı seramik vazo.",
        category: "seramik",
        productCode: "SRM-002",
        price: 7450,
        discountPercentage: 0,
        stock: 15,
        immediateDelivery: true,
        image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        isNewProduct: false,
        isActive: true
    },
    {
        title: "Minimalist Beyaz Seramik Vazo",
        description: "Mat beyaz sırla kaplanmış, modern ev dekorasyonları için ideal seramik obje.",
        category: "seramik",
        productCode: "SRM-003",
        price: 2450,
        discountPercentage: 0,
        stock: 15,
        immediateDelivery: true,
        image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        isNewProduct: true,
        isActive: true
    },
    {
        title: "Bohem Makrome Duvar Süsü",
        description: "100% pamuk iplerden örülmüş, yaşam alanlarınıza sıcaklık katacak makrome duvar süsü.",
        category: "makrome",
        productCode: "MKR-001",
        price: 320,
        discountPercentage: 10,
        stock: 5,
        immediateDelivery: false,
        customProductionTime: "3-5 İş Günü",
        image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
        rating: 4.5,
        isNewProduct: false,
        isActive: true
    },
    {
        title: "925 Ayar Gümüş İnci Kolye",
        description: "Gerçek tatlı su incisi ile tasarlanmış zarif gümüş kolye.",
        category: "taki",
        productCode: "TAK-001",
        price: 390,
        discountPercentage: 0,
        stock: 20,
        immediateDelivery: true,
        image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        isNewProduct: true,
        isActive: true
    },
    {
        title: "Lavanta ve Vanilya Soya Mumu",
        description: "Doğal soya waksından üretilmiş, uzun süre yanan aromaterapi mumu.",
        category: "mum",
        productCode: "MUM-001",
        price: 180,
        discountPercentage: 0,
        stock: 50,
        immediateDelivery: true,
        image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        isNewProduct: false,
        isActive: true
    },
    {
        title: "El Oyması Masif Takı Kutusu",
        description: "Anadolu motifleriyle elde oyulmuş, içi birinci sınıf kadife kaplamalı masif ceviz ağacı takı kutusu.",
        category: "ahsap",
        productCode: "AHS-002",
        price: 850,
        discountPercentage: 0,
        stock: 12,
        immediateDelivery: true,
        colors: ["Ceviz", "Açık Meşe"],
        sizes: ["Standart (20x15cm)"],
        features: ["%100 Masif Ağaç", "Geleneksel El Oyması", "Çizilmeyi Önleyen Kadife İç Yüzey"],
        careInstructions: "Sadece hafif nemli bir bezle siliniz.",
        image: "https://images.unsplash.com/photo-1611078568600-e179ce614399?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        numReviews: 34,
        soldCount: 85,
        isNewProduct: true,
        isActive: true
    },
    {
        title: "Benekli El Yapımı Seramik Kupa",
        description: "Sabah kahvelerinize sanatsal bir dokunuş! Tamamen elde şekillendirilip sırlanmış organik seramik kupa.",
        category: "seramik",
        productCode: "SRM-004",
        price: 350,
        discountPercentage: 0,
        stock: 25,
        immediateDelivery: true,
        colors: ["Krem Benekli", "Buz Mavisi"],
        sizes: ["250ml", "350ml"],
        features: ["Gıdaya Uygun Sır", "Organik Form"],
        careInstructions: "Elde yıkama tavsiye edilir.",
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        numReviews: 128,
        soldCount: 410,
        isNewProduct: false,
        isActive: true
    },
    {
        title: "Okaliptüs & Nane Vegan Soya Mumu",
        description: "%100 doğal soya parafininden ve saf esansiyel yağlardan üretilmiş aromaterapi mumu.",
        category: "mum",
        productCode: "MUM-002",
        price: 220,
        discountPercentage: 15,
        stock: 40,
        immediateDelivery: true,
        colors: [],
        sizes: ["200g (40 Saat Yanma)"],
        features: ["%100 Vegan", "Kurşunsuz Pamuk Fitil"],
        careInstructions: "Her kullanımdan önce fitili 5mm kesin.",
        image: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        numReviews: 56,
        soldCount: 215,
        isNewProduct: true,
        isActive: true
    },
    {
        title: "Bohem Makrome Hamak Salıncak",
        description: "Sıkı dokunmuş pamuk iplerle tasarlanmış sağlam ve konforlu makrome salıncak.",
        category: "makrome",
        productCode: "MKR-002",
        price: 3400,
        discountPercentage: 0,
        stock: 2,
        immediateDelivery: false,
        customProductionTime: "7-10 İş Günü",
        colors: ["Ekru", "Kiremit Rengi"],
        sizes: ["Tek Kişilik"],
        features: ["%100 Pamuk İp", "Paslanmaz Çelik Halka"],
        careInstructions: "Aşırı yağmurdan koruyunuz.",
        image: "https://images.unsplash.com/photo-1596499898739-16ec228cb617?auto=format&fit=crop&w=600&q=80",
        rating: 5.0,
        numReviews: 12,
        soldCount: 18,
        isNewProduct: false,
        isActive: true
    },
    {
        title: "Ham Ametist Doğal Taş Yüzük",
        description: "Doğal formundaki ametist taşının 925 ayar gümüşle muazzam buluşması.",
        category: "taki",
        productCode: "TAK-002",
        price: 550,
        discountPercentage: 0,
        stock: 8,
        immediateDelivery: true,
        colors: ["Gümüş", "Altın Kaplama"],
        sizes: ["Ölçü: 14", "Ölçü: 16"],
        features: ["Gerçek Ametist Taşı", "925 Ayar Gümüş"],
        careInstructions: "Kimyasallardan uzak tutunuz.",
        image: "https://images.unsplash.com/photo-1605100804763-247f67b2548e?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        numReviews: 42,
        soldCount: 110,
        isNewProduct: true,
        isActive: true
    },
    {
        title: "El Örgüsü Makrome Omuz Çantası",
        description: "Doğal pamuk iplik kullanılarak el işçiliği ile üretilmiş şık ve dayanıklı omuz çantası.",
        category: "makrome",
        productCode: "MKR-003",
        price: 650,
        discountPercentage: 10,
        stock: 14,
        immediateDelivery: true,
        colors: ["Krem", "Taba"],
        features: ["%100 Pamuk", "Astarlı İç Kısım"],
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        numReviews: 22,
        soldCount: 60,
        isNewProduct: true,
        isActive: true
    },
    {
        title: "Rustik Ahşap Mumluk Seti (3'lü)",
        description: "Doğal ağaç kütüklerinden elde edilmiş, ev ortamına sıcaklık veren 3 farklı boyda mumluk seti.",
        category: "ahsap",
        productCode: "AHS-003",
        price: 420,
        discountPercentage: 0,
        stock: 20,
        immediateDelivery: true,
        features: ["Koruyucu Doğal Yağ Cilalı", "Tealight Mum Hediyeli"],
        image: "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        numReviews: 18,
        soldCount: 45,
        isNewProduct: false,
        isActive: true
    },
    {
        title: "Minimalist Akik Taşı Bileklik",
        description: "Sakinleştirici enerjisiyle bilinen doğal akik taş tanelerinden oluşan zarif el yapımı bileklik.",
        category: "taki",
        productCode: "TAK-003",
        price: 280,
        discountPercentage: 5,
        stock: 30,
        immediateDelivery: true,
        features: ["Esnek Misina Yapı", "Doğal Akik Taşı"],
        image: "https://images.unsplash.com/photo-1611591475140-13e7774e144a?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        numReviews: 15,
        soldCount: 90,
        isNewProduct: true,
        isActive: true
    }
];

const fakeCategories = [
    {
        categoryId: 'seramik',
        name: 'Seramik & Obje',
        description: 'El Şekillendirme Sanatı',
        order: 1,
        isActive: true,
        iconName: 'ColorLensOutlined',
        color: '#7A9EBD',
        bgGradient: 'linear-gradient(135deg, #FDF4D2 0%, #B0CDE6 100%)',
        bgRGBA: 'rgba(122, 158, 189, 0.15)'
    },
    {
        categoryId: 'makrome',
        name: 'Örgü & Makrome',
        description: 'Sıcak Dokuma Dokular',
        order: 2,
        isActive: true,
        iconName: 'WavesOutlined',
        color: '#A290B7',
        bgGradient: 'linear-gradient(135deg, #A290B7 0%, #946D6D 100%)',
        bgRGBA: 'rgba(162, 144, 183, 0.15)'
    },
    {
        categoryId: 'ahsap',
        name: 'Ahşap Tasarım',
        description: 'Doğal İnce İşçilik',
        order: 3,
        isActive: true,
        iconName: 'ForestOutlined',
        color: '#DDA15E',
        bgGradient: 'linear-gradient(135deg, #FDF4D2 0%, #946D6D 100%)',
        bgRGBA: 'rgba(221, 161, 94, 0.15)'
    },
    {
        categoryId: 'taki',
        name: 'Takı & Aksesuar',
        description: 'Kişiye Özel Zarafet',
        order: 4,
        isActive: true,
        iconName: 'DiamondOutlined',
        color: '#E29578',
        bgGradient: 'linear-gradient(135deg, #B0CDE6 0%, #FDF4D2 100%)',
        bgRGBA: 'rgba(226, 149, 120, 0.15)'
    },
    {
        categoryId: 'mum',
        name: 'Mum & Aromaterapi',
        description: 'Huzur Veren Esanslar',
        order: 5,
        isActive: true,
        iconName: 'SelfImprovementOutlined',
        color: '#81B29A',
        bgGradient: 'linear-gradient(135deg, #A290B7 0%, #B0CDE6 100%)',
        bgRGBA: 'rgba(129, 178, 154, 0.15)'
    }
];

const fakeBanners = [
    {
        title: 'Soft Seramik Koleksiyonu',
        url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1400&q=75',
        isActive: true,
        order: 1
    },
    {
        title: 'Doğal Pamuk Makrome',
        url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1400&q=75',
        isActive: true,
        order: 2
    },
    {
        title: 'Sıcak Atölye Esintisi',
        url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1400&q=75',
        isActive: true,
        order: 3
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.DB_URI);
        console.log('✅ Veritabanına başarıyla bağlanıldı.');

        await Product.deleteMany();
        console.log('🧹 Eski ürünler temizlendi.');

        await Category.deleteMany();
        console.log('🧹 Eski kategoriler temizlendi.');

        await Banner.deleteMany();
        console.log('🧹 Eski bannerlar temizlendi.');

        for (const product of fakeProducts) {
            await Product.create(product);
        }
        console.log(`🎉 Başarılı! Toplam ${fakeProducts.length} adet ürün veritabanına eklendi.`);

        await Category.insertMany(fakeCategories);
        console.log('🎉 Başarılı! Kategoriler veritabanına eklendi.');

        await Banner.insertMany(fakeBanners);
        console.log('🎉 Başarılı! Bannerlar veritabanına eklendi.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata oluştu:', error);
        process.exit(1);
    }
};

seedDatabase();