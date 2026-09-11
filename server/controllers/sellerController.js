const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ProductQuestion = require('../models/ProductQuestion');
const FeaturedRequest = require('../models/FeaturedRequest');
const { isSuperAdmin } = require('../utils/roles');
const {
    ORDER_STATUSES,
    deriveOrderStatus,
    ensureSellerFulfillments,
    sellerStatusOf
} = require('../utils/orderFulfillment');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
};

const { CATEGORY_LABELS } = require('../constants/categories');
const { serializePublicAtelier } = require('../utils/publicAtelier');
const { magazaTuruEtiket, normalizeMagazaTurleri } = require('../utils/sellerCategories');

const isLocalUpload = (src = '') => String(src).startsWith('/uploads/') || String(src).includes('/uploads/');

const pickCoverImages = (docs = []) => {
    const seen = new Set();
    const local = [];
    const remote = [];

    const take = (src, bucket) => {
        const value = String(src || '').trim();
        if (!value || seen.has(value)) return false;
        if (/images\.unsplash\.com/i.test(value)) return false;
        seen.add(value);
        bucket.push(value);
        return true;
    };

    for (const item of docs) {
        const src = item?.image;
        if (isLocalUpload(src)) take(src, local);
        else if (/^https?:\/\//i.test(String(src || ''))) take(src, remote);
        if (local.length >= 4) break;
    }

    if (local.length < 4) {
        for (const item of docs) {
            for (const src of item?.additionalImages || []) {
                if (isLocalUpload(src)) take(src, local);
                if (local.length >= 4) break;
            }
            if (local.length >= 4) break;
        }
    }

    return [...local, ...remote].slice(0, 4);
};

const sanitizeIban = (iban = '') => String(iban).replace(/\s+/g, '').toUpperCase();

const isValidIbanTr = (iban) => /^TR\d{24}$/.test(iban);

const isValidPhone = (telefon = '') => {
    const digits = String(telefon).replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('5')) return true;
    if (digits.length === 11 && digits.startsWith('05')) return true;
    if (digits.length === 12 && digits.startsWith('90')) return true;
    if (digits.length === 13 && digits.startsWith('905')) return true;
    return false;
};

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());

const isValidTckn = (value = '') => {
    if (!/^\d{11}$/.test(value)) return false;
    if (value[0] === '0') return false;
    const d = value.split('').map(Number);
    const odd = d[0] + d[2] + d[4] + d[6] + d[8];
    const even = d[1] + d[3] + d[5] + d[7];
    if ((((odd * 7) - even) % 10 + 10) % 10 !== d[9]) return false;
    return d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10 === d[10];
};

const serializeSeller = (seller, user) => ({
    id: seller._id,
    magazaAdi: seller.magazaAdi,
    slug: seller.slug,
    hesapTipi: seller.hesapTipi,
    magazaTuru: normalizeMagazaTurleri(seller.magazaTuru),
    magazaTuruEtiket: magazaTuruEtiket(seller.magazaTuru),
    aciklama: seller.aciklama,
    telefon: seller.telefon,
    sehir: seller.sehir,
    ilce: seller.ilce,
    adres: seller.adres,
    iban: seller.iban,
    tcKimlik: seller.tcKimlik,
    vergiNo: seller.vergiNo,
    instagram: seller.instagram,
    website: seller.website,
    durum: seller.durum,
    reddetmeNedeni: seller.reddetmeNedeni,
    createdAt: seller.createdAt,
    kullanici: user
        ? {
            id: user._id,
            adSoyad: user.adSoyad,
            email: user.email,
            telefon: user.telefon,
            rol: user.rol
        }
        : undefined
});

const serializeUser = (user) => ({
    id: user._id,
    adSoyad: user.adSoyad,
    email: user.email,
    telefon: user.telefon || '',
    kampanyaKodu: user.kampanyaKodu,
    rol: user.rol
});

const registerSeller = async (req, res) => {
    try {
        const {
            adSoyad,
            email,
            sifre,
            telefon,
            magazaAdi,
            magazaTuru,
            hesapTipi = 'bireysel',
            aciklama = '',
            sehir,
            ilce,
            adres,
            iban,
            tcKimlik = '',
            vergiNo = '',
            instagram = '',
            website = '',
            sozlesmeOnay
        } = req.body;

        if (!sozlesmeOnay) {
            return res.status(400).json({ mesaj: 'Satıcı sözleşmesini onaylamanız gerekir.' });
        }

        if (!magazaAdi || String(magazaAdi).trim().length < 3) {
            return res.status(400).json({ mesaj: 'Mağaza adı en az 3 karakter olmalıdır.' });
        }
        if (String(magazaAdi).trim().length > 60) {
            return res.status(400).json({ mesaj: 'Mağaza adı en fazla 60 karakter olabilir.' });
        }

        const turleri = normalizeMagazaTurleri(magazaTuru);
        if (!turleri.length) {
            return res.status(400).json({ mesaj: 'Lütfen en az bir üretim alanı seçin.' });
        }

        if (!telefon || !isValidPhone(telefon)) {
            return res.status(400).json({ mesaj: 'Geçerli bir telefon numarası girin.' });
        }

        if (!sehir || !ilce || !adres) {
            return res.status(400).json({ mesaj: 'Şehir, ilçe ve adres zorunludur.' });
        }

        const cleanIban = sanitizeIban(iban);
        if (!isValidIbanTr(cleanIban)) {
            return res.status(400).json({ mesaj: 'Geçerli bir TR IBAN girin (TR + 24 hane).' });
        }

        const tip = hesapTipi === 'kurumsal' ? 'kurumsal' : 'bireysel';
        if (tip === 'bireysel') {
            const kimlik = String(tcKimlik).trim();
            if (!kimlik) {
                return res.status(400).json({ mesaj: 'T.C. kimlik numarası zorunludur.' });
            }
            if (!isValidTckn(kimlik)) {
                return res.status(400).json({ mesaj: 'Geçerli bir T.C. kimlik numarası girin.' });
            }
        }
        if (tip === 'kurumsal' && !/^\d{10}$/.test(String(vergiNo).trim())) {
            return res.status(400).json({ mesaj: 'Vergi numarası 10 haneli olmalıdır.' });
        }

        let user = req.user || null;
        let createdUser = false;

        if (user) {
            const existingSeller = await Seller.findOne({ user: user._id });
            if (existingSeller) {
                return res.status(400).json({
                    mesaj: 'Bu hesap zaten bir satıcı mağazasına bağlı.',
                    satici: serializeSeller(existingSeller, user)
                });
            }
        } else {
            if (!adSoyad || !email || !sifre) {
                return res.status(400).json({ mesaj: 'Ad soyad, e-posta ve şifre zorunludur.' });
            }
            if (!isValidEmail(email)) {
                return res.status(400).json({ mesaj: 'Geçerli bir e-posta adresi girin.' });
            }
            if (String(sifre).length < 6) {
                return res.status(400).json({ mesaj: 'Şifre en az 6 karakter olmalıdır.' });
            }
            if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(sifre) || !/\d/.test(sifre)) {
                return res.status(400).json({ mesaj: 'Şifre en az bir harf ve bir rakam içermelidir.' });
            }

            const emailNorm = String(email).trim().toLowerCase();
            const userExists = await User.findOne({ email: emailNorm });
            if (userExists) {
                return res.status(400).json({
                    mesaj: 'Bu e-posta ile bir hesap zaten var. Giriş yapıp satıcı başvurusunu tamamlayın.'
                });
            }

            user = await User.create({
                adSoyad: String(adSoyad).trim(),
                email: emailNorm,
                sifre,
                telefon: String(telefon).trim(),
                rol: 'seller'
            });
            createdUser = true;
        }

        const magazaAdiTrim = String(magazaAdi).trim();
        const escapedName = magazaAdiTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const magazaExists = await Seller.findOne({ magazaAdi: new RegExp(`^${escapedName}$`, 'i') });
        if (magazaExists) {
            if (createdUser) await User.findByIdAndDelete(user._id);
            return res.status(400).json({ mesaj: 'Bu mağaza adı kullanılıyor. Farklı bir ad deneyin.' });
        }

        try {
            const seller = await Seller.create({
                user: user._id,
                magazaAdi: magazaAdiTrim,
                hesapTipi: tip,
                magazaTuru: turleri,
                aciklama: String(aciklama).trim(),
                telefon: String(telefon).trim(),
                sehir: String(sehir).trim(),
                ilce: String(ilce).trim(),
                adres: String(adres).trim(),
                iban: cleanIban,
                tcKimlik: tip === 'bireysel' ? String(tcKimlik).trim() : '',
                vergiNo: tip === 'kurumsal' ? String(vergiNo).trim() : '',
                instagram: String(instagram).trim(),
                website: String(website).trim(),
                sozlesmeOnay: true,
                durum: 'pending'
            });

            if (!isSuperAdmin(user.rol)) {
                user.rol = 'seller';
            }
            if (!user.telefon && telefon) {
                user.telefon = String(telefon).trim();
            }
            await user.save();

            if (createdUser) {
                const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
                res.cookie('token', token, COOKIE_OPTIONS);
            }

            return res.status(201).json({
                mesaj: 'Satıcı başvurunuz alındı. İnceleme sonrası mağazanız yayına alınır.',
                kullanici: serializeUser(user),
                satici: serializeSeller(seller, user)
            });
        } catch (createError) {
            if (createdUser) await User.findByIdAndDelete(user._id);
            if (createError.code === 11000) {
                return res.status(400).json({ mesaj: 'Bu mağaza adı veya hesap zaten kayıtlı.' });
            }
            throw createError;
        }
    } catch (error) {
        return res.status(500).json({ mesaj: 'Satıcı kaydı oluşturulamadı.', hata: error.message });
    }
};

const getMySeller = async (req, res) => {
    try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller) {
            return res.status(404).json({ mesaj: 'Bu hesaba bağlı satıcı kaydı bulunamadı.' });
        }

        return res.json({
            satici: serializeSeller(seller, req.user)
        });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Satıcı bilgisi alınamadı.', hata: error.message });
    }
};

const updateMySeller = async (req, res) => {
    try {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller) {
            return res.status(404).json({ mesaj: 'Bu hesaba bağlı satıcı kaydı bulunamadı.' });
        }
        if (seller.durum !== 'approved') {
            return res.status(403).json({ mesaj: 'Mağaza onaylandıktan sonra bilgileri güncelleyebilirsiniz.' });
        }

        const {
            magazaAdi,
            magazaTuru,
            aciklama = '',
            telefon,
            sehir,
            ilce,
            adres,
            iban,
            instagram = '',
            website = ''
        } = req.body;

        if (!magazaAdi || String(magazaAdi).trim().length < 3) {
            return res.status(400).json({ mesaj: 'Mağaza adı en az 3 karakter olmalıdır.' });
        }
        const turleri = normalizeMagazaTurleri(magazaTuru);
        if (!turleri.length) {
            return res.status(400).json({ mesaj: 'Lütfen en az bir üretim alanı seçin.' });
        }
        if (!telefon || !isValidPhone(telefon)) {
            return res.status(400).json({ mesaj: 'Geçerli bir telefon numarası girin.' });
        }
        if (!sehir || !ilce || !adres) {
            return res.status(400).json({ mesaj: 'Şehir, ilçe ve adres zorunludur.' });
        }
        const cleanIban = sanitizeIban(iban);
        if (!isValidIbanTr(cleanIban)) {
            return res.status(400).json({ mesaj: 'Geçerli bir TR IBAN girin (TR + 24 hane).' });
        }

        const magazaAdiTrim = String(magazaAdi).trim();
        const escapedName = magazaAdiTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const magazaExists = await Seller.findOne({
            magazaAdi: new RegExp(`^${escapedName}$`, 'i'),
            _id: { $ne: seller._id }
        });
        if (magazaExists) {
            return res.status(400).json({ mesaj: 'Bu mağaza adı kullanılıyor.' });
        }

        seller.magazaAdi = magazaAdiTrim;
        seller.magazaTuru = turleri;
        seller.aciklama = String(aciklama).trim();
        seller.telefon = String(telefon).trim();
        seller.sehir = String(sehir).trim();
        seller.ilce = String(ilce).trim();
        seller.adres = String(adres).trim();
        seller.iban = cleanIban;
        seller.instagram = String(instagram).trim();
        seller.website = String(website).trim();
        await seller.save();

        if (telefon && req.user.telefon !== String(telefon).trim()) {
            req.user.telefon = String(telefon).trim();
            await req.user.save();
        }

        return res.json({
            mesaj: 'Mağaza bilgileri güncellendi.',
            satici: serializeSeller(seller, req.user)
        });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Mağaza güncellenemedi.', hata: error.message });
    }
};

// Satıcı yalnızca kendi ürünlerinin geçtiği siparişleri ve kendi tutarını görür
const buildSellerOrders = (orders, productIds, sellerId) => {
    const owned = new Set(productIds.map(String));
    return orders
        .map((order) => {
            const items = (order.orderItems || []).filter((item) => owned.has(String(item.product)));
            if (!items.length) return null;
            const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const sellerStatus = sellerStatusOf(order, sellerId);
            return {
                _id: order._id,
                createdAt: order.createdAt,
                orderStatus: sellerStatus,
                overallStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                customerInfo: {
                    firstName: order.customerInfo?.firstName,
                    lastName: order.customerInfo?.lastName,
                    email: order.customerInfo?.email,
                    phone: order.customerInfo?.phone
                },
                shippingAddress: {
                    address: order.shippingAddress?.address,
                    city: order.shippingAddress?.city,
                    district: order.shippingAddress?.district
                },
                orderItems: items,
                sellerTotal: total
            };
        })
        .filter(Boolean);
};

const getMyOrders = async (req, res) => {
    try {
        const productIds = await Product.find({ seller: req.user._id }).distinct('_id');
        if (!productIds.length) return res.json({ success: true, orders: [] });

        const orders = await Order.find({ 'orderItems.product': { $in: productIds } })
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        return res.json({ success: true, orders: buildSellerOrders(orders, productIds, req.user._id) });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Siparişler alınamadı.', hata: error.message });
    }
};

const updateMyOrder = async (req, res) => {
    try {
        const { orderStatus } = req.body;
        if (!ORDER_STATUSES.includes(orderStatus)) {
            return res.status(400).json({ mesaj: 'Geçersiz sipariş durumu.' });
        }

        const productIds = await Product.find({ seller: req.user._id }).distinct('_id');
        const order = await Order.findOne({
            _id: req.params.id,
            'orderItems.product': { $in: productIds }
        });
        if (!order) {
            return res.status(404).json({ mesaj: 'Bu siparişte size ait ürün bulunamadı.' });
        }

        if (['shipped', 'delivered'].includes(orderStatus) && order.paymentStatus === 'failed') {
            return res.status(400).json({ mesaj: 'Ödemesi başarısız sipariş kargoya verilemez.' });
        }

        await ensureSellerFulfillments(order);
        let mine = (order.sellerFulfillments || []).find(
            (row) => String(row.seller) === String(req.user._id)
        );
        if (!mine) {
            order.sellerFulfillments.push({
                seller: req.user._id,
                status: order.orderStatus || 'processing'
            });
            mine = order.sellerFulfillments[order.sellerFulfillments.length - 1];
        }

        mine.status = orderStatus;
        order.orderStatus = deriveOrderStatus(order.sellerFulfillments);
        await order.save();

        const serialized = buildSellerOrders([order.toObject()], productIds, req.user._id)[0];
        return res.json({
            success: true,
            mesaj: 'Sipariş durumu güncellendi.',
            order: serialized
        });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Sipariş güncellenemedi.', hata: error.message });
    }
};

const getMyOverview = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id })
            .select('_id price stock isActive approvalStatus')
            .lean();
        const productIds = products.map((p) => p._id);

        const orders = productIds.length
            ? await Order.find({ 'orderItems.product': { $in: productIds } }).sort({ createdAt: -1 }).limit(200).lean()
            : [];
        const sellerOrders = buildSellerOrders(orders, productIds, req.user._id);
        const revenue = sellerOrders
            .filter((order) => order.paymentStatus === 'completed')
            .reduce((sum, order) => sum + order.sellerTotal, 0);

        const unansweredQuestions = productIds.length
            ? await ProductQuestion.countDocuments({
                product: { $in: productIds },
                isPublic: true,
                $or: [{ answer: { $exists: false } }, { answer: '' }, { answer: null }]
            })
            : 0;
        const pendingFeatured = await FeaturedRequest.countDocuments({ seller: req.user._id, status: 'pending' });

        return res.json({
            success: true,
            overview: {
                products: products.length,
                published: products.filter((p) => p.isActive && p.approvalStatus !== 'pending').length,
                pendingApproval: products.filter((p) => p.approvalStatus === 'pending').length,
                rejected: products.filter((p) => p.approvalStatus === 'rejected').length,
                lowStock: products.filter((p) => p.stock <= 5).length,
                orders: sellerOrders.length,
                openOrders: sellerOrders.filter((order) => order.orderStatus === 'processing').length,
                unansweredQuestions,
                pendingFeatured,
                revenue,
                recentOrders: sellerOrders.slice(0, 6)
            }
        });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Mağaza özeti alınamadı.', hata: error.message });
    }
};

const getPublicSeller = async (req, res) => {
    try {
        const slug = String(req.params.slug || '').trim().toLowerCase();
        if (!slug) {
            return res.status(404).json({ success: false, mesaj: 'Atölye bulunamadı.' });
        }

        const seller = await Seller.findOne({ slug, durum: 'approved' }).lean();
        if (!seller) {
            return res.status(404).json({ success: false, mesaj: 'Atölye bulunamadı.' });
        }

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 8));
        const skip = (page - 1) * limit;
        const sortKey = String(req.query.sort || 'newest');
        const category = String(req.query.category || '').trim().toLowerCase();

        const publicMatch = {
            isActive: true,
            approvalStatus: { $nin: ['pending', 'rejected'] },
            seller: seller.user
        };

        const productMatch = { ...publicMatch };
        if (category) productMatch.category = category;

        let sortStage = { createdAt: -1 };
        if (sortKey === 'popular') sortStage = { soldCount: -1, rating: -1, createdAt: -1 };
        if (sortKey === 'rating') sortStage = { rating: -1, numReviews: -1 };
        if (sortKey === 'priceAsc') sortStage = { price: 1 };
        if (sortKey === 'priceDesc') sortStage = { price: -1 };

        const [maker, products, filteredCount, stats, categoryDocs, coverDocs] = await Promise.all([
            User.findById(seller.user).select('adSoyad avatarUrl').lean(),
            Product.find(productMatch).sort(sortStage).skip(skip).limit(limit).lean(),
            Product.countDocuments(productMatch),
            Product.aggregate([
                { $match: publicMatch },
                {
                    $group: {
                        _id: null,
                        productCount: { $sum: 1 },
                        soldCount: { $sum: { $ifNull: ['$soldCount', 0] } },
                        reviewCount: { $sum: { $ifNull: ['$numReviews', 0] } },
                        ratingWeight: { $sum: { $ifNull: ['$numReviews', 0] } },
                        ratingSum: {
                            $sum: {
                                $multiply: [
                                    { $ifNull: ['$rating', 0] },
                                    { $ifNull: ['$numReviews', 0] }
                                ]
                            }
                        }
                    }
                }
            ]),
            Product.aggregate([
                { $match: publicMatch },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Product.find(publicMatch)
                .sort({ soldCount: -1, createdAt: -1 })
                .select('image additionalImages')
                .limit(16)
                .lean()
        ]);

        const summary = stats[0] || {};
        const productCount = summary.productCount || 0;
        const reviewCount = summary.reviewCount || 0;
        const rating = reviewCount > 0 && summary.ratingWeight
            ? Math.round((summary.ratingSum / summary.ratingWeight) * 10) / 10
            : 0;

        const categories = (categoryDocs || [])
            .filter((row) => row._id)
            .map((row) => ({
                id: row._id,
                label: CATEGORY_LABELS[row._id] || row._id,
                count: row.count
            }));

        const coverImages = pickCoverImages(coverDocs);

        return res.status(200).json({
            success: true,
            atelier: serializePublicAtelier(seller, maker, {
                productCount,
                soldCount: summary.soldCount || 0,
                reviewCount,
                rating,
                categories,
                coverImages
            }),
            products,
            pagination: {
                page,
                limit,
                total: filteredCount,
                totalPages: Math.max(1, Math.ceil(filteredCount / limit)),
                hasMore: skip + products.length < filteredCount
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, mesaj: 'Atölye bilgisi alınamadı.', hata: error.message });
    }
};

module.exports = {
    registerSeller,
    getMySeller,
    updateMySeller,
    getMyOrders,
    updateMyOrder,
    getMyOverview,
    getPublicSeller
};
