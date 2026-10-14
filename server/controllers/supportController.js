const Product = require('../models/Product');
const Order = require('../models/Order');
const { KNOWLEDGE, matchFaq, searchTerms } = require('../utils/supportKnowledge');

const buckets = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 20;

const rateOk = (key) => {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  buckets.set(key, hits);
  return hits.length <= RATE_MAX;
};

const money = (value, lang = 'tr') =>
  Number(value || 0).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const STATUS = {
  tr: {
    processing: 'hazırlanıyor',
    shipped: 'kargoda',
    delivered: 'teslim edildi',
    cancelled: 'iptal',
    pending: 'ödeme bekleniyor',
    completed: 'ödendi',
    failed: 'ödeme başarısız'
  },
  en: {
    processing: 'being prepared',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
    pending: 'awaiting payment',
    completed: 'paid',
    failed: 'payment failed'
  }
};
const statusText = (value, lang = 'tr') => STATUS[lang]?.[value] || STATUS.tr[value] || value;

const TEXT = {
  tr: {
    rate: 'Çok sık yazıldı. Bir dakika sonra tekrar dene.',
    empty: 'Bir mesaj yaz.',
    human: 'Seni insan desteğe alıyorum. Sağ alttaki yeşil WhatsApp düğmesinden yazabilirsin.',
    forbidden: 'Sipariş iptali, iade onayı veya ödeme işlemlerini ben yapamam. Bunu WhatsApp’tan ekibimizle netleştirelim.',
    recent: 'Son siparişlerin',
    catalog: (list) => `Katalogda şunları gördüm:\n${list}\nDetay veya stok için ürün sayfasına bakabilir ya da WhatsApp’tan sorabilirsin.`,
    unclear: 'Bunu netleştiremedim. Kargo, iade, ödeme veya sipariş diye sorabilirsin; özel işlem için WhatsApp daha doğru.',
    failed: 'Destek asistanı şu an yanıt veremiyor.',
    failedReply: 'Bir hata oldu. Lütfen WhatsApp’tan yaz.',
    noCategory: 'kategori yok',
    guest: 'Kullanıcı giriş yapmamış.',
    noOrders: 'Bu hesabın henüz siparişi yok.',
    payment: 'ödeme'
  },
  en: {
    rate: 'Too many messages. Try again in a minute.',
    empty: 'Write a message.',
    human: 'Let me hand you over to a person. Use the green WhatsApp button at the bottom right.',
    forbidden: 'I can’t cancel orders, approve returns or take payments. Let’s sort that out with our team on WhatsApp.',
    recent: 'Your latest orders',
    catalog: (list) => `Here’s what I found in the catalog:\n${list}\nFor details or stock, open the product page or ask us on WhatsApp.`,
    unclear: 'I couldn’t quite work that out. Ask about shipping, returns, payment or your order; for anything special, WhatsApp is the better route.',
    failed: 'The support assistant can’t answer right now.',
    failedReply: 'Something went wrong. Please message us on WhatsApp.',
    noCategory: 'no category',
    guest: 'The user is not logged in.',
    noOrders: 'This account has no orders yet.',
    payment: 'payment'
  }
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const wantsHuman = (text) =>
  /whatsapp|insan|operatör|operator|canlı destek|canli destek|şikayet|sikayet|human|real person|agent|complaint/.test(
    String(text).toLocaleLowerCase('tr-TR')
  );

const forbidden = (text) =>
  /iptal et|iade onay|paramı iade|parami iade|kart numar|cvv|cvc|şifre ver|sifre ver|cancel my order|refund my|card number/.test(
    String(text).toLocaleLowerCase('tr-TR')
  );

const cleanKey = (value) => String(value || '').trim().replace(/^["']|["']$/g, '');

const callOpenAi = async (messages) => {
  const key = cleanKey(process.env.OPENAI_API_KEY);
  if (!key) return null;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 280,
      messages
    }),
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
};

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest'
].filter((value, index, list) => value && list.indexOf(value) === index);

const callGemini = async (prompt) => {
  const key = cleanKey(process.env.GEMINI_API_KEY);
  if (!key) return null;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 280 }
          }),
          signal: AbortSignal.timeout(12000)
        }
      );
      if (!response.ok) continue;
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n').trim();
      if (text) return text;
    } catch {
      continue;
    }
  }
  return null;
};

const productContext = async (message, lang = 'tr') => {
  const terms = searchTerms(message);
  if (!terms.length) return '';
  const filters = terms.map((term) => ({
    $or: [
      { title: { $regex: escapeRegex(term), $options: 'i' } },
      { 'en.title': { $regex: escapeRegex(term), $options: 'i' } },
      { category: { $regex: escapeRegex(term), $options: 'i' } }
    ]
  }));
  const products = await Product.find({ isActive: true, $or: filters })
    .select('title price category discountPercentage en.title')
    .limit(5)
    .lean();
  if (!products.length) return '';
  return products
    .map((item) => {
      const discount = Number(item.discountPercentage || 0);
      const price = discount > 0 ? item.price - (item.price * discount) / 100 : item.price;
      const title = lang === 'en' ? item.en?.title || item.title : item.title;
      return `- ${title} (${item.category || TEXT[lang].noCategory}): ${money(price, lang)} ₺`;
    })
    .join('\n');
};

const orderContext = async (user, lang = 'tr') => {
  if (!user?._id) return '';
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(3).lean();
  if (!orders.length) return '';
  return orders
    .map((order) => {
      const id = String(order._id).slice(-6).toUpperCase();
      return `- #${id}: ${statusText(order.orderStatus, lang)} / ${TEXT[lang].payment} ${statusText(order.paymentStatus, lang)} / ${money(order.totalPrice, lang)} ₺`;
    })
    .join('\n');
};

exports.chat = async (req, res) => {
  const lang = req.lang === 'en' ? 'en' : 'tr';
  const text = TEXT[lang];
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'anon';
    if (!rateOk(String(ip))) {
      return res.status(429).json({ success: false, message: text.rate });
    }

    const message = String(req.body.message || '').trim().slice(0, 500);
    if (!message) {
      return res.status(400).json({ success: false, message: text.empty });
    }

    const history = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];

    if (wantsHuman(message)) {
      return res.json({
        success: true,
        reply: text.human,
        escalate: true
      });
    }

    if (forbidden(message)) {
      return res.json({
        success: true,
        reply: text.forbidden,
        escalate: true
      });
    }

    const [catalog, orders] = await Promise.all([
      productContext(message, lang),
      orderContext(req.user, lang)
    ]);

    const faq = matchFaq(message, lang);
    if (faq) {
      let reply = faq;
      const asksOrder = /sipariş|siparis|kargo takip|nerede|durum|order|tracking|where is|status/.test(
        message.toLocaleLowerCase('tr-TR')
      );
      if (asksOrder && orders) {
        reply = `${text.recent}:\n${orders}\n\n${faq}`;
      }
      return res.json({
        success: true,
        reply,
        escalate: /whatsapp/i.test(reply)
      });
    }

    const languageRule = lang === 'en'
      ? 'Sadece İngilizce (English), kısa ve net cevap ver. Mağaza bilgisi Türkçe olsa da cevabın İngilizce olmalı.'
      : 'Sadece Türkçe, kısa ve net cevap ver.';
    const system = `Sen Nik Bag müşteri destek asistanısın. ${languageRule}
Kurallar:
- Fiyat uydurma. Katalogda yoksa "emin değilim" de.
- Sipariş iptal etme, iade onaylama, ödeme alma, adres değiştirme.
- Bilmiyorsan WhatsApp'a yönlendir.
Mağaza bilgisi:
${KNOWLEDGE}

Katalog (eşleşen):
${catalog || 'Bu soruya özel ürün eşleşmedi.'}

Kullanıcının son siparişleri:
${orders || (req.user ? TEXT.tr.noOrders : TEXT.tr.guest)}`;

    let reply = null;
    try {
      reply = await callOpenAi([
        { role: 'system', content: system },
        ...history
          .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
          .map((item) => ({ role: item.role, content: String(item.content || '').slice(0, 400) })),
        { role: 'user', content: message }
      ]);
      if (!reply) {
        reply = await callGemini(`${system}\n\n${lang === 'en' ? 'User' : 'Kullanıcı'}: ${message}`);
      }
    } catch (error) {
      reply = null;
    }

    if (!reply) reply = faq;
    if (!reply && catalog) {
      reply = text.catalog(catalog);
    }
    if (!reply) {
      reply = text.unclear;
    }

    return res.json({
      success: true,
      reply,
      escalate: /whatsapp/i.test(reply)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: text.failed,
      reply: text.failedReply
    });
  }
};
