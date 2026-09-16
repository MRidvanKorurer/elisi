const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { isSuperAdmin } = require('../utils/roles');
const { reviewPublicPath, removeUpload } = require('../middleware/uploadMiddleware');

const isObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

const publicProductMatch = (extra = {}) => ({
  isActive: true,
  approvalStatus: { $nin: ['pending', 'rejected'] },
  ...extra
});

const findProduct = async (id) => {
  const query = isObjectId(id)
    ? publicProductMatch({ $or: [{ _id: id }, { slug: id }] })
    : publicProductMatch({ slug: id });
  return Product.findOne(query);
};

const hasPurchasedProduct = async (userId, productId) => {
  const order = await Order.findOne({
    user: userId,
    orderStatus: { $in: ['processing', 'shipped', 'delivered'] },
    paymentStatus: { $ne: 'failed' },
    'orderItems.product': productId
  }).select('_id');
  return Boolean(order);
};

const syncProductRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  await Product.findByIdAndUpdate(productId, {
    rating: stats ? Math.round(stats.avg * 10) / 10 : 5,
    numReviews: stats ? stats.count : 0
  });
};

const serializeReview = (doc) => ({
  id: String(doc._id),
  rating: doc.rating,
  comment: String(doc.comment || doc.yorum || '').trim(),
  images: doc.images || [],
  createdAt: doc.createdAt,
  user: {
    id: doc.user?._id || doc.user,
    adSoyad: doc.user?.adSoyad || 'Nik Bag üyesi',
    avatarUrl: doc.user?.avatarUrl || ''
  }
});

const getProductReviews = async (req, res) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, mesaj: 'Ürün bulunamadı.' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ product: product._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'adSoyad avatarUrl')
        .lean(),
      Review.countDocuments({ product: product._id })
    ]);

    return res.status(200).json({
      success: true,
      rating: product.rating || 0,
      numReviews: product.numReviews || total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      },
      reviews: reviews.map(serializeReview)
    });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Yorumlar getirilemedi.', hata: error.message });
  }
};

const getReviewEligibility = async (req, res) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, mesaj: 'Ürün bulunamadı.' });
    }

    const purchased = await hasPurchasedProduct(req.user._id, product._id);
    const existing = await Review.findOne({ product: product._id, user: req.user._id }).lean();
    const superAdmin = isSuperAdmin(req.user.rol);
    const allowed = purchased || superAdmin;

    let reason = '';
    if (!allowed) {
      reason = 'Bu ürüne yorum yapmak için kayıtlı hesabınızla satın almış olmanız gerekir.';
    } else if (existing && !superAdmin) {
      reason = 'Bu ürüne zaten yorum yaptınız.';
    }

    return res.status(200).json({
      success: true,
      canReview: allowed && (!existing || superAdmin),
      purchased,
      alreadyReviewed: Boolean(existing),
      reason,
      myReview: existing
        ? serializeReview({ ...existing, user: { _id: req.user._id, adSoyad: req.user.adSoyad, avatarUrl: req.user.avatarUrl } })
        : null
    });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Yorum yetkisi kontrol edilemedi.', hata: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, mesaj: 'Ürün bulunamadı.' });
    }

    const purchased = await hasPurchasedProduct(req.user._id, product._id);
    const superAdmin = isSuperAdmin(req.user.rol);
    if (!purchased && !superAdmin) {
      return res.status(403).json({
        success: false,
        mesaj: 'Yalnızca bu ürünü satın almış kayıtlı kullanıcılar yorum yapabilir.'
      });
    }

    const rating = Math.round(Number(req.body.rating));
    const comment = String(req.body.comment || '').trim();
    const uploaded = (req.files || []).map((file) => reviewPublicPath(file));

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      uploaded.forEach(removeUpload);
      return res.status(400).json({ success: false, mesaj: 'Puan 1 ile 5 arasında olmalıdır.' });
    }
    if (comment.length < 10) {
      uploaded.forEach(removeUpload);
      return res.status(400).json({ success: false, mesaj: 'Yorum en az 10 karakter olmalıdır.' });
    }
    if (comment.length > 800) {
      uploaded.forEach(removeUpload);
      return res.status(400).json({ success: false, mesaj: 'Yorum en fazla 800 karakter olabilir.' });
    }

    const existing = await Review.findOne({ product: product._id, user: req.user._id });
    let images = uploaded;
    if (existing && !uploaded.length) {
      images = existing.images || [];
    } else if (existing && uploaded.length) {
      (existing.images || []).forEach(removeUpload);
    }

    const review = superAdmin || existing
      ? await Review.findOneAndUpdate(
          { product: product._id, user: req.user._id },
          { rating, comment, images },
          { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
        )
      : await Review.create({
          product: product._id,
          user: req.user._id,
          rating,
          comment,
          images
        });

    await syncProductRating(product._id);

    const populated = await Review.findById(review._id).populate('user', 'adSoyad avatarUrl').lean();

    return res.status(201).json({
      success: true,
      mesaj: 'Yorumunuz kaydedildi.',
      review: serializeReview(populated)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, mesaj: 'Bu ürüne zaten yorum yaptınız.' });
    }
    return res.status(500).json({ success: false, mesaj: 'Yorum kaydedilemedi.', hata: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, mesaj: 'Yorum bulunamadı.' });
    }

    const owner = String(review.user) === String(req.user._id);
    if (!owner && !isSuperAdmin(req.user.rol)) {
      return res.status(403).json({ success: false, mesaj: 'Sadece kendi yorumunuzu silebilirsiniz.' });
    }

    (review.images || []).forEach(removeUpload);
    const productId = review.product;
    await review.deleteOne();
    await syncProductRating(productId);

    return res.status(200).json({ success: true, mesaj: 'Yorum silindi.' });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Yorum silinemedi.', hata: error.message });
  }
};

module.exports = { getProductReviews, getReviewEligibility, createReview, deleteReview };
