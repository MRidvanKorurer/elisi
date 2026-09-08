const mongoose = require('mongoose');
const ProductQuestion = require('../models/ProductQuestion');
const Product = require('../models/Product');
const { isSuperAdmin } = require('../utils/roles');

const MIN_QUESTION = 10;
const MAX_QUESTION = 500;
const MIN_ANSWER = 8;
const MAX_ANSWER = 1000;
const MAX_OPEN_PER_PRODUCT = 3;

const isObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

const publicProductMatch = (extra = {}) => ({
  isActive: true,
  approvalStatus: { $nin: ['pending', 'rejected'] },
  ...extra
});

const unansweredMatch = {
  $or: [{ answer: { $exists: false } }, { answer: '' }, { answer: null }]
};

const findPublicProduct = async (id) => {
  const query = isObjectId(id)
    ? publicProductMatch({ $or: [{ _id: id }, { slug: id }] })
    : publicProductMatch({ slug: id });
  return Product.findOne(query);
};

const canAnswerProduct = (user, product) => {
  if (!user || !product) return false;
  if (isSuperAdmin(user.rol)) return true;
  return Boolean(product.seller) && String(product.seller) === String(user._id);
};

const serializeQuestion = (doc) => ({
  id: String(doc._id),
  question: String(doc.question || '').trim(),
  answer: String(doc.answer || '').trim(),
  createdAt: doc.createdAt,
  answeredAt: doc.answeredAt || null,
  product: doc.product
    ? {
        id: String(doc.product._id || doc.product),
        title: doc.product.title || '',
        image: doc.product.image || ''
      }
    : null,
  user: {
    id: String(doc.user?._id || doc.user || ''),
    adSoyad: doc.user?.adSoyad || 'Nik Bag üyesi',
    avatarUrl: doc.user?.avatarUrl || ''
  },
  answeredBy: doc.answeredBy
    ? {
        id: String(doc.answeredBy._id || doc.answeredBy),
        adSoyad: doc.answeredBy.adSoyad || 'Satıcı'
      }
    : null
});

const getProductQuestions = async (req, res) => {
  try {
    const product = await findPublicProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, mesaj: 'Ürün bulunamadı.' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
    const skip = (page - 1) * limit;
    const match = { product: product._id, isPublic: true };

    const [questions, total, answered] = await Promise.all([
      ProductQuestion.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'adSoyad avatarUrl')
        .populate('answeredBy', 'adSoyad')
        .lean(),
      ProductQuestion.countDocuments(match),
      ProductQuestion.countDocuments({ ...match, answer: { $nin: ['', null] } })
    ]);

    return res.status(200).json({
      success: true,
      numQuestions: total,
      numAnswered: answered,
      canAnswer: canAnswerProduct(req.user, product),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      },
      questions: questions.map(serializeQuestion)
    });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Sorular getirilemedi.', hata: error.message });
  }
};

const askQuestion = async (req, res) => {
  try {
    const product = await findPublicProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, mesaj: 'Ürün bulunamadı.' });
    }

    if (canAnswerProduct(req.user, product) && !isSuperAdmin(req.user.rol)) {
      return res.status(400).json({ success: false, mesaj: 'Kendi ürününüze soru soramazsınız.' });
    }

    const question = String(req.body.question || '').trim();
    if (question.length < MIN_QUESTION) {
      return res.status(400).json({ success: false, mesaj: `Soru en az ${MIN_QUESTION} karakter olmalıdır.` });
    }
    if (question.length > MAX_QUESTION) {
      return res.status(400).json({ success: false, mesaj: `Soru en fazla ${MAX_QUESTION} karakter olabilir.` });
    }

    const openCount = await ProductQuestion.countDocuments({
      product: product._id,
      user: req.user._id,
      ...unansweredMatch
    });
    if (openCount >= MAX_OPEN_PER_PRODUCT) {
      return res.status(429).json({
        success: false,
        mesaj: 'Bu üründe yanıtsız 3 sorunuz var. Satıcı yanıtladıktan sonra yeni soru sorabilirsiniz.'
      });
    }

    const created = await ProductQuestion.create({
      product: product._id,
      user: req.user._id,
      question
    });

    const populated = await ProductQuestion.findById(created._id)
      .populate('user', 'adSoyad avatarUrl')
      .populate('answeredBy', 'adSoyad')
      .lean();

    return res.status(201).json({
      success: true,
      mesaj: 'Sorunuz iletildi. Satıcı yanıtlayınca burada görünür.',
      question: serializeQuestion(populated)
    });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Soru gönderilemedi.', hata: error.message });
  }
};

const getSellerQuestions = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).select('_id title image').lean();
    const productIds = products.map((item) => item._id);
    if (!productIds.length) {
      return res.status(200).json({
        success: true,
        unanswered: 0,
        questions: []
      });
    }

    const status = String(req.query.status || 'all');
    const match = { product: { $in: productIds }, isPublic: true };
    if (status === 'unanswered') Object.assign(match, unansweredMatch);
    if (status === 'answered') match.answer = { $nin: ['', null] };

    const [questions, unanswered] = await Promise.all([
      ProductQuestion.find(match)
        .sort({ createdAt: -1 })
        .populate('user', 'adSoyad avatarUrl email')
        .populate('product', 'title image')
        .populate('answeredBy', 'adSoyad')
        .lean(),
      ProductQuestion.countDocuments({ product: { $in: productIds }, isPublic: true, ...unansweredMatch })
    ]);

    const sorted = questions.sort((a, b) => {
      const aOpen = !String(a.answer || '').trim();
      const bOpen = !String(b.answer || '').trim();
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      unanswered,
      questions: sorted.map(serializeQuestion)
    });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Sorular alınamadı.', hata: error.message });
  }
};

const answerQuestion = async (req, res) => {
  try {
    const question = await ProductQuestion.findById(req.params.questionId);
    if (!question || !question.isPublic) {
      return res.status(404).json({ success: false, mesaj: 'Soru bulunamadı.' });
    }

    const product = await Product.findById(question.product);
    if (!product) {
      return res.status(404).json({ success: false, mesaj: 'Ürün bulunamadı.' });
    }
    if (!canAnswerProduct(req.user, product)) {
      return res.status(403).json({ success: false, mesaj: 'Bu soruyu yalnızca ürünün satıcısı yanıtlayabilir.' });
    }

    const answer = String(req.body.answer || '').trim();
    if (answer.length < MIN_ANSWER) {
      return res.status(400).json({ success: false, mesaj: `Yanıt en az ${MIN_ANSWER} karakter olmalıdır.` });
    }
    if (answer.length > MAX_ANSWER) {
      return res.status(400).json({ success: false, mesaj: `Yanıt en fazla ${MAX_ANSWER} karakter olabilir.` });
    }

    question.answer = answer;
    question.answeredBy = req.user._id;
    question.answeredAt = new Date();
    await question.save();

    const populated = await ProductQuestion.findById(question._id)
      .populate('user', 'adSoyad avatarUrl')
      .populate('product', 'title image')
      .populate('answeredBy', 'adSoyad')
      .lean();

    return res.status(200).json({
      success: true,
      mesaj: 'Yanıt kaydedildi.',
      question: serializeQuestion(populated)
    });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Yanıt kaydedilemedi.', hata: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const question = await ProductQuestion.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ success: false, mesaj: 'Soru bulunamadı.' });
    }

    const product = await Product.findById(question.product).select('seller');
    const owner = String(question.user) === String(req.user._id);
    const seller = canAnswerProduct(req.user, product);
    if (!owner && !seller) {
      return res.status(403).json({ success: false, mesaj: 'Bu soruyu silme yetkiniz yok.' });
    }

    await question.deleteOne();
    return res.status(200).json({ success: true, mesaj: 'Soru silindi.' });
  } catch (error) {
    return res.status(500).json({ success: false, mesaj: 'Soru silinemedi.', hata: error.message });
  }
};

module.exports = {
  getProductQuestions,
  askQuestion,
  getSellerQuestions,
  answerQuestion,
  deleteQuestion
};
