const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ProductQuestion = require('../models/ProductQuestion');
const FeaturedRequest = require('../models/FeaturedRequest');
const Review = require('../models/Review');
const PromoCode = require('../models/PromoCode');
const { isSuperAdmin } = require('../utils/roles');
const {
    ORDER_STATUSES,
    deriveOrderStatus,
    ensureSellerFulfillments,
    sellerStatusOf
} = require('../utils/orderFulfillment');
const { stampFulfillment, timingOf } = require('../utils/fulfillmentTiming');

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

        stampFulfillment(mine, orderStatus);
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

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const isoDay = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
};
const isoMonth = (value) => isoDay(value).slice(0, 7);
const bump = (map, key, seed, patch) => {
    const current = map.get(key) || seed(key);
    patch(current);
    map.set(key, current);
    return current;
};
const fillDaily = (from, to, map) => {
    const rows = [];
    const cursor = new Date(from);
    cursor.setUTCHours(0, 0, 0, 0);
    const last = new Date(to);
    last.setUTCHours(0, 0, 0, 0);
    while (cursor <= last) {
        const date = cursor.toISOString().slice(0, 10);
        const row = map.get(date) || { date, orders: 0, revenue: 0, qty: 0, cancelled: 0 };
        rows.push({ ...row, revenue: roundMoney(row.revenue) });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return rows;
};
const fillMonthly = (count, map) => {
    const rows = [];
    const cursor = new Date();
    cursor.setUTCDate(1);
    cursor.setUTCHours(0, 0, 0, 0);
    cursor.setUTCMonth(cursor.getUTCMonth() - (count - 1));
    for (let i = 0; i < count; i += 1) {
        const month = cursor.toISOString().slice(0, 7);
        const row = map.get(month) || { month, orders: 0, revenue: 0, qty: 0, cancelled: 0 };
        rows.push({ ...row, revenue: roundMoney(row.revenue) });
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return rows;
};

const getMyReports = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const products = await Product.find({ seller: sellerId })
            .select('_id title category image stock price rating numReviews')
            .lean();
        const productIds = products.map((item) => item._id);
        const owned = new Set(productIds.map(String));
        const productById = new Map(products.map((item) => [String(item._id), item]));

        const [orders, reviews, questions, promos, featured] = await Promise.all([
            productIds.length
                ? Order.find({ 'orderItems.product': { $in: productIds } }).sort({ createdAt: 1 }).lean()
                : Promise.resolve([]),
            productIds.length ? Review.find({ product: { $in: productIds } }).lean() : Promise.resolve([]),
            productIds.length
                ? ProductQuestion.find({ product: { $in: productIds }, isPublic: true }).lean()
                : Promise.resolve([]),
            PromoCode.find({ seller: sellerId }).lean(),
            FeaturedRequest.find({ seller: sellerId }).sort({ createdAt: -1 }).lean()
        ]);

        const sellerItemsOf = (order) => (order.orderItems || []).filter((item) => owned.has(String(item.product)));
        const statusOf = (order) => sellerStatusOf(order, sellerId);
        const itemQty = (item) => Number(item.quantity) || 0;
        const itemRevenue = (item) => itemQty(item) * Number(item.price || 0);

        const byProduct = new Map(products.map((product) => [String(product._id), {
            id: product._id,
            title: product.title,
            category: product.category || 'diger',
            image: product.image || '',
            stock: product.stock || 0,
            rating: product.rating || 0,
            numReviews: product.numReviews || 0,
            qty: 0,
            revenue: 0,
            orders: 0,
            qty30: 0
        }]));

        const now = new Date();
        const from30 = new Date(now);
        from30.setUTCDate(from30.getUTCDate() - 29);
        from30.setUTCHours(0, 0, 0, 0);
        const from30Ms = from30.getTime();

        const dailyMap = new Map();
        const monthlyMap = new Map();
        const byStatus = { processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
        const payStatus = {
            pending: { count: 0, revenue: 0 },
            completed: { count: 0, revenue: 0 },
            failed: { count: 0, revenue: 0 }
        };
        const payMethod = new Map();
        const colorMap = new Map();
        const sizeMap = new Map();
        const customerMap = new Map();
        const cityMap = new Map();
        const promoSet = new Set(promos.map((item) => String(item.code || '').toUpperCase()).filter(Boolean));
        const promoStats = new Map(promos.map((item) => [String(item.code || '').toUpperCase(), {
            id: item._id,
            code: item.code,
            percent: item.percent,
            usedCount: item.usedCount || 0,
            isActive: item.isActive !== false,
            orders: 0,
            revenue: 0,
            discount: 0
        }]));
        let promoOrders = 0;
        let promoRevenue = 0;
        let plainOrders = 0;
        let plainRevenue = 0;
        let fulfillDaysSum = 0;
        let fulfillDaysCount = 0;

        orders.forEach((order) => {
            const items = sellerItemsOf(order);
            if (!items.length) return;
            const status = statusOf(order);
            const cancelled = status === 'cancelled';
            const qty = items.reduce((sum, item) => sum + itemQty(item), 0);
            const revenue = items.reduce((sum, item) => sum + itemRevenue(item), 0);
            const created = new Date(order.createdAt);
            const day = isoDay(created);
            const month = isoMonth(created);

            byStatus[status] = (byStatus[status] || 0) + 1;
            const timing = timingOf(order, sellerId);
            if (timing.daysToShip != null) {
                fulfillDaysSum += timing.daysToShip;
                fulfillDaysCount += 1;
            }

            bump(dailyMap, day, (key) => ({ date: key, orders: 0, revenue: 0, qty: 0, cancelled: 0 }), (row) => {
                if (cancelled) row.cancelled += 1;
                else {
                    row.orders += 1;
                    row.qty += qty;
                    row.revenue += revenue;
                }
            });
            bump(monthlyMap, month, (key) => ({ month: key, orders: 0, revenue: 0, qty: 0, cancelled: 0 }), (row) => {
                if (cancelled) row.cancelled += 1;
                else {
                    row.orders += 1;
                    row.qty += qty;
                    row.revenue += revenue;
                }
            });

            const payKey = payStatus[order.paymentStatus] ? order.paymentStatus : 'pending';
            payStatus[payKey].count += 1;
            payStatus[payKey].revenue += cancelled ? 0 : revenue;
            const methodKey = order.paymentMethod || 'unknown';
            bump(payMethod, methodKey, (key) => ({ method: key, count: 0, revenue: 0 }), (row) => {
                row.count += 1;
                if (!cancelled) row.revenue += revenue;
            });

            const email = String(order.customerInfo?.email || '').trim().toLowerCase();
            const customerKey = email || String(order.customerInfo?.phone || order._id);
            const city = String(order.shippingAddress?.city || '').trim() || 'Belirtilmedi';
            bump(customerMap, customerKey, () => ({
                key: customerKey,
                email,
                name: `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'Misafir',
                city,
                orders: 0,
                revenue: 0,
                firstAt: created,
                lastAt: created
            }), (row) => {
                row.orders += 1;
                if (!cancelled) row.revenue += revenue;
                if (created < row.firstAt) row.firstAt = created;
                if (created > row.lastAt) row.lastAt = created;
                if (!row.city && city) row.city = city;
            });
            if (!cancelled) {
                bump(cityMap, city, (key) => ({ city: key, orders: 0, revenue: 0 }), (row) => {
                    row.orders += 1;
                    row.revenue += revenue;
                });
            }

            const code = String(order.promoCode || '').toUpperCase();
            if (!cancelled && promoSet.has(code) && promoStats.has(code)) {
                promoOrders += 1;
                promoRevenue += revenue;
                const share = order.subtotal > 0 ? revenue / order.subtotal : 1;
                bump(promoStats, code, () => promoStats.get(code), (row) => {
                    row.orders += 1;
                    row.revenue += revenue;
                    row.discount += Number(order.promoDiscount || 0) * share;
                });
            } else if (!cancelled) {
                plainOrders += 1;
                plainRevenue += revenue;
            }

            const counted = new Set();
            items.forEach((item) => {
                const id = String(item.product);
                const row = byProduct.get(id);
                if (!row) return;
                if (!cancelled) {
                    const qtyValue = itemQty(item);
                    row.qty += qtyValue;
                    row.revenue += itemRevenue(item);
                    if (created.getTime() >= from30Ms) row.qty30 += qtyValue;
                    if (!counted.has(id)) {
                        row.orders += 1;
                        counted.add(id);
                    }
                    const color = String(item.color || '').trim();
                    const size = String(item.size || '').trim();
                    if (color) {
                        bump(colorMap, color.toLowerCase(), () => ({ name: color, qty: 0, revenue: 0 }), (entry) => {
                            entry.qty += qtyValue;
                            entry.revenue += itemRevenue(item);
                        });
                    }
                    if (size) {
                        bump(sizeMap, size.toLowerCase(), () => ({ name: size, qty: 0, revenue: 0 }), (entry) => {
                            entry.qty += qtyValue;
                            entry.revenue += itemRevenue(item);
                        });
                    }
                }
            });
        });

        const productRows = [...byProduct.values()]
            .map((row) => ({
                ...row,
                label: CATEGORY_LABELS[row.category] || row.category,
                revenue: roundMoney(row.revenue),
                dailyRate: Math.round((row.qty30 / 30) * 100) / 100,
                daysLeft: row.qty30 > 0 ? Math.round((row.stock / (row.qty30 / 30)) * 10) / 10 : null
            }))
            .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);

        const categoryMap = new Map();
        productRows.forEach((row) => {
            const key = row.category || 'diger';
            bump(categoryMap, key, () => ({
                category: key,
                label: CATEGORY_LABELS[key] || key,
                qty: 0,
                revenue: 0,
                products: 0,
                soldProducts: 0
            }), (current) => {
                current.products += 1;
                current.qty += row.qty;
                current.revenue += row.revenue;
                if (row.qty > 0) current.soldProducts += 1;
            });
        });
        const categories = [...categoryMap.values()]
            .map((row) => ({ ...row, revenue: roundMoney(row.revenue) }))
            .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);
        const sold = productRows.filter((row) => row.qty > 0);

        const customers = [...customerMap.values()]
            .map((row) => ({
                ...row,
                revenue: roundMoney(row.revenue),
                repeat: row.orders > 1
            }))
            .sort((a, b) => b.revenue - a.revenue);
        const repeatCustomers = customers.filter((row) => row.repeat);
        const firstCustomers = customers.filter((row) => !row.repeat);

        const featuredRows = featured.map((item) => {
            const productId = String(item.product);
            const product = productById.get(productId);
            const start = item.startsAt ? new Date(item.startsAt) : new Date(item.createdAt);
            const end = item.endsAt
                ? new Date(item.endsAt)
                : new Date(start.getTime() + (Number(item.days) || 0) * 86400000);
            let revenue = 0;
            let qty = 0;
            orders.forEach((order) => {
                if (statusOf(order) === 'cancelled') return;
                const created = new Date(order.createdAt);
                if (created < start || created > end) return;
                sellerItemsOf(order).forEach((line) => {
                    if (String(line.product) !== productId) return;
                    qty += itemQty(line);
                    revenue += itemRevenue(line);
                });
            });
            const spent = ['approved', 'removed'].includes(item.status) ? Number(item.price || 0) : 0;
            return {
                id: item._id,
                productId,
                title: product?.title || 'Ürün',
                image: product?.image || '',
                days: item.days,
                status: item.status,
                spent,
                revenue: roundMoney(revenue),
                qty,
                startsAt: start,
                endsAt: end,
                roi: spent > 0 ? Math.round(((revenue - spent) / spent) * 100) : null
            };
        });

        const ratingBuckets = [1, 2, 3, 4, 5].map((star) => ({
            star,
            count: reviews.filter((item) => Number(item.rating) === star).length
        }));
        const answered = questions.filter((item) => String(item.answer || '').trim());
        const answerHours = answered
            .map((item) => {
                if (!item.answeredAt || !item.createdAt) return null;
                return (new Date(item.answeredAt) - new Date(item.createdAt)) / 3600000;
            })
            .filter((value) => value != null && value >= 0 && value < 24 * 60);

        const payMethods = [...payMethod.values()]
            .map((row) => ({ ...row, revenue: roundMoney(row.revenue) }))
            .sort((a, b) => b.revenue - a.revenue);
        const sortNamed = (rows) => rows
            .map((row) => ({ ...row, revenue: roundMoney(row.revenue) }))
            .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);

        return res.json({
            success: true,
            report: {
                performance: {
                    totals: {
                        revenue: roundMoney(sold.reduce((sum, row) => sum + row.revenue, 0)),
                        qty: sold.reduce((sum, row) => sum + row.qty, 0),
                        products: sold.length,
                        categories: categories.filter((row) => row.qty > 0).length
                    },
                    categories,
                    products: productRows
                },
                timeseries: {
                    daily: fillDaily(from30, now, dailyMap),
                    monthly: fillMonthly(12, monthlyMap)
                },
                fulfillment: {
                    byStatus: ['processing', 'shipped', 'delivered', 'cancelled'].map((status) => ({
                        status,
                        count: byStatus[status] || 0
                    })),
                    avgDays: fulfillDaysCount ? Math.round((fulfillDaysSum / fulfillDaysCount) * 10) / 10 : 0,
                    open: (byStatus.processing || 0) + (byStatus.shipped || 0),
                    delivered: byStatus.delivered || 0,
                    cancelled: byStatus.cancelled || 0,
                    total: Object.values(byStatus).reduce((sum, value) => sum + value, 0)
                },
                payments: {
                    byStatus: Object.entries(payStatus).map(([status, row]) => ({
                        status,
                        count: row.count,
                        revenue: roundMoney(row.revenue)
                    })),
                    byMethod: payMethods,
                    totals: {
                        pending: payStatus.pending.count,
                        completed: payStatus.completed.count,
                        failed: payStatus.failed.count,
                        collected: roundMoney(payStatus.completed.revenue),
                        outstanding: roundMoney(payStatus.pending.revenue)
                    }
                },
                stock: {
                    items: productRows
                        .map((row) => ({
                            id: row.id,
                            title: row.title,
                            image: row.image,
                            category: row.label,
                            stock: row.stock,
                            qty: row.qty,
                            qty30: row.qty30,
                            dailyRate: row.dailyRate,
                            daysLeft: row.daysLeft
                        }))
                        .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999) || a.stock - b.stock),
                    lowStock: productRows.filter((row) => row.stock <= 5).length,
                    unsold: productRows.filter((row) => row.qty === 0).length,
                    moving: productRows.filter((row) => row.qty30 > 0).length
                },
                variants: {
                    colors: sortNamed([...colorMap.values()]),
                    sizes: sortNamed([...sizeMap.values()])
                },
                customers: {
                    totals: {
                        all: customers.length,
                        first: firstCustomers.length,
                        repeat: repeatCustomers.length,
                        firstRevenue: roundMoney(firstCustomers.reduce((sum, row) => sum + row.revenue, 0)),
                        repeatRevenue: roundMoney(repeatCustomers.reduce((sum, row) => sum + row.revenue, 0))
                    },
                    cities: [...cityMap.values()]
                        .map((row) => ({ ...row, revenue: roundMoney(row.revenue) }))
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 10),
                    list: customers.slice(0, 20)
                },
                promos: {
                    codes: [...promoStats.values()]
                        .map((row) => ({ ...row, revenue: roundMoney(row.revenue), discount: roundMoney(row.discount) }))
                        .sort((a, b) => b.revenue - a.revenue),
                    withPromo: { orders: promoOrders, revenue: roundMoney(promoRevenue) },
                    withoutPromo: { orders: plainOrders, revenue: roundMoney(plainRevenue) }
                },
                featured: {
                    items: featuredRows,
                    totals: {
                        spent: roundMoney(featuredRows.reduce((sum, row) => sum + row.spent, 0)),
                        revenue: roundMoney(featuredRows.reduce((sum, row) => sum + row.revenue, 0)),
                        live: featuredRows.filter((row) => row.status === 'approved').length
                    }
                },
                quality: {
                    ratings: ratingBuckets,
                    avgRating: reviews.length
                        ? Math.round((reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length) * 10) / 10
                        : 0,
                    reviewCount: reviews.length,
                    questions: {
                        total: questions.length,
                        unanswered: questions.length - answered.length,
                        avgHours: answerHours.length
                            ? Math.round((answerHours.reduce((sum, value) => sum + value, 0) / answerHours.length) * 10) / 10
                            : 0
                    },
                    products: productRows
                        .map((row) => ({
                            id: row.id,
                            title: row.title,
                            image: row.image,
                            rating: row.rating,
                            numReviews: row.numReviews,
                            qty: row.qty
                        }))
                        .sort((a, b) => b.numReviews - a.numReviews || b.rating - a.rating)
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ mesaj: 'Rapor alınamadı.', hata: error.message });
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
    getMyReports,
    getPublicSeller
};
