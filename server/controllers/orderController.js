const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const iyzipay = require('../config/iyzipay');
const Iyzipay = require('iyzipay');
const mongoose = require('mongoose');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const FREE_SHIPPING_LIMIT = 500;
const SHIPPING_FEE = 49.9;

const money = (value) => Number(Number(value || 0).toFixed(2));

const formatGsm = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('90') && digits.length >= 12) return `+${digits.slice(0, 12)}`;
    if (digits.startsWith('0') && digits.length >= 11) return `+90${digits.slice(1, 11)}`;
    if (digits.length === 10) return `+90${digits}`;
    return '+905555555555';
};

const initializePayment = (request) => {
    return new Promise((resolve, reject) => {
        iyzipay.checkoutFormInitialize.create(request, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

const retrievePayment = (token) => {
    return new Promise((resolve, reject) => {
        iyzipay.checkoutForm.retrieve({ locale: Iyzipay.LOCALE.TR, token }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

const unitPriceOf = (product) => {
    const discountRate = Number(product.discountPercentage || 0);
    const price = Number(product.price || 0);
    return discountRate > 0 ? money(price - (price * discountRate / 100)) : money(price);
};

exports.createOrder = async (req, res) => {
    try {
        const { customerInfo, shippingAddress, orderItems, paymentMethod, savedCardId } = req.body;

        if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Sepetiniz boş.' });
        }

        const allowedMethods = ['credit_card', 'transfer', 'whatsapp'];
        if (!allowedMethods.includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: 'Geçersiz ödeme yöntemi.' });
        }

        if (!customerInfo?.firstName || !customerInfo?.lastName || !customerInfo?.email || !customerInfo?.phone) {
            return res.status(400).json({ success: false, message: 'İletişim bilgileri eksik.' });
        }
        if (!shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.district) {
            return res.status(400).json({ success: false, message: 'Teslimat adresi eksik.' });
        }

        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerInfo.email).trim());
        if (!emailOk) {
            return res.status(400).json({ success: false, message: 'Geçerli bir e-posta girin.' });
        }

        const normalizedItems = [];
        for (const item of orderItems) {
            const productId = item.product || item.productId || item.id;
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({ success: false, message: 'Sepette geçersiz ürün var.' });
            }

            const product = await Product.findOne({ _id: productId, isActive: true });
            if (!product) {
                return res.status(400).json({ success: false, message: 'Bir ürün artık satışta değil.' });
            }

            const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
            if (product.stock < quantity) {
                return res.status(400).json({ success: false, message: `${product.title} için yetersiz stok.` });
            }

            normalizedItems.push({
                product: product._id,
                name: product.title,
                quantity,
                price: unitPriceOf(product),
                image: product.image,
                color: String(item.color || '').trim(),
                size: String(item.size || '').trim()
            });
        }

        const subtotal = money(normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0));
        const shippingCost = subtotal >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_FEE;
        const totalPrice = money(subtotal + shippingCost);

        const order = new Order({
            user: req.user ? req.user._id : null,
            customerInfo: {
                firstName: customerInfo.firstName.trim(),
                lastName: customerInfo.lastName.trim(),
                email: customerInfo.email.trim().toLowerCase(),
                phone: customerInfo.phone.trim()
            },
            shippingAddress: {
                address: shippingAddress.address.trim(),
                city: shippingAddress.city.trim(),
                district: shippingAddress.district.trim()
            },
            orderItems: normalizedItems,
            subtotal,
            shippingCost,
            totalPrice,
            paymentMethod,
            paymentStatus: 'pending'
        });

        const savedOrder = await order.save();

        if (paymentMethod === 'credit_card' && savedCardId) {
            if (!req.user) {
                await Order.findByIdAndDelete(savedOrder._id);
                return res.status(401).json({ success: false, message: 'Kayıtlı kart için giriş yapmalısınız.' });
            }
            const User = require('../models/User');
            const owner = await User.findById(req.user._id);
            const card = owner?.kayitliKartlar?.id(savedCardId);
            if (!card) {
                await Order.findByIdAndDelete(savedOrder._id);
                return res.status(400).json({ success: false, message: 'Seçilen kart bulunamadı.' });
            }

            await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
            return res.status(201).json({
                success: true,
                message: 'Kayıtlı kart ile sipariş alındı.',
                orderId: savedOrder._id,
                paymentMethod,
                usedSavedCard: true,
                cardLast4: card.son4Hane
            });
        }

        if (paymentMethod === 'credit_card') {
            const basketItems = normalizedItems.map((item, index) => ({
                id: `${item.product.toString()}-${index}`,
                name: String(item.name).slice(0, 120),
                category1: 'El Sanatları',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price: money(item.price * item.quantity).toFixed(2)
            }));

            const basketTotal = money(basketItems.reduce((sum, item) => sum + parseFloat(item.price), 0));

            const request = {
                locale: Iyzipay.LOCALE.TR,
                conversationId: savedOrder._id.toString(),
                price: basketTotal.toFixed(2),
                paidPrice: totalPrice.toFixed(2),
                currency: Iyzipay.CURRENCY.TRY,
                basketId: savedOrder._id.toString(),
                paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
                callbackUrl: `${SERVER_URL}/api/orders/payment/callback`,
                enabledInstallments: [1, 2, 3, 6, 9],
                buyer: {
                    id: req.user ? req.user._id.toString() : `GUEST_${savedOrder._id.toString().slice(-8)}`,
                    name: savedOrder.customerInfo.firstName,
                    surname: savedOrder.customerInfo.lastName,
                    gsmNumber: formatGsm(savedOrder.customerInfo.phone),
                    email: savedOrder.customerInfo.email,
                    identityNumber: '11111111111',
                    registrationAddress: savedOrder.shippingAddress.address,
                    ip: req.ip || '85.34.78.112',
                    city: savedOrder.shippingAddress.city,
                    country: 'Turkey'
                },
                shippingAddress: {
                    contactName: `${savedOrder.customerInfo.firstName} ${savedOrder.customerInfo.lastName}`,
                    city: savedOrder.shippingAddress.city,
                    country: 'Turkey',
                    address: savedOrder.shippingAddress.address
                },
                billingAddress: {
                    contactName: `${savedOrder.customerInfo.firstName} ${savedOrder.customerInfo.lastName}`,
                    city: savedOrder.shippingAddress.city,
                    country: 'Turkey',
                    address: savedOrder.shippingAddress.address
                },
                basketItems
            };

            try {
                const result = await initializePayment(request);
                if (result.status === 'success' && result.paymentPageUrl) {
                    return res.status(201).json({
                        success: true,
                        message: 'Ödeme sayfası oluşturuldu.',
                        paymentUrl: result.paymentPageUrl,
                        orderId: savedOrder._id
                    });
                }

                await Order.findByIdAndDelete(savedOrder._id);
                return res.status(400).json({
                    success: false,
                    message: result.errorMessage || 'Ödeme altyapısı başlatılamadı. Havale/EFT veya WhatsApp ile devam edebilirsiniz.'
                });
            } catch (paymentError) {
                await Order.findByIdAndDelete(savedOrder._id);
                console.error('İyzico başlatma hatası:', paymentError);
                return res.status(502).json({
                    success: false,
                    message: 'Ödeme sayfası şu an açılamıyor. Lütfen havale/EFT deneyin veya daha sonra tekrar deneyin.'
                });
            }
        }

        if (req.user) {
            await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
        }

        res.status(201).json({
            success: true,
            message: 'Sipariş başarıyla oluşturuldu.',
            orderId: savedOrder._id,
            paymentMethod,
            totalPrice
        });
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        res.status(500).json({ success: false, message: 'Sipariş işlenirken hata oluştu.', error: error.message });
    }
};

const finishPaymentCallback = async (req, res) => {
    try {
        const token = req.body.token || req.query.token;
        if (!token) return res.redirect(`${CLIENT_URL}/odeme-basarisiz?reason=${encodeURIComponent('Ödeme bilgisi alınamadı.')}`);

        const paymentResult = await retrievePayment(token);
        const orderId = paymentResult.conversationId;

        if (paymentResult.status === 'success' && paymentResult.paymentStatus === 'SUCCESS') {
            const order = await Order.findById(orderId);
            if (order && order.paymentStatus !== 'completed') {
                order.paymentStatus = 'completed';
                await order.save();

                if (order.user) {
                    await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
                }

                for (const item of order.orderItems) {
                    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, soldCount: item.quantity } });
                }
            }

            return res.redirect(`${CLIENT_URL}/siparis-basarili?orderId=${orderId}`);
        }

        if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
            await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
        }

        const reason = paymentResult.errorMessage || 'Ödeme tamamlanamadı.';
        return res.redirect(`${CLIENT_URL}/odeme-basarisiz?reason=${encodeURIComponent(reason)}`);
    } catch (error) {
        console.error('Callback hatası:', error);
        return res.redirect(`${CLIENT_URL}/odeme-basarisiz?reason=${encodeURIComponent('Sunucu hatası')}`);
    }
};

exports.iyzicoCallback = finishPaymentCallback;

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id || req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Siparişler getirilirken hata:', error);
        res.status(500).json({ success: false, message: 'Siparişleriniz alınamadı.' });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        }

        const userId = req.user._id || req.user.id;
        if (order.user && order.user.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Bu siparişi görüntüleme yetkiniz yok.' });
        }

        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Sipariş detayı alınırken hata:', error);
        res.status(500).json({ success: false, message: 'Sipariş detayı alınamadı.' });
    }
};
