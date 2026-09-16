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

const money = (value) =>
  Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const statusTr = (value) =>
  ({
    processing: 'hazırlanıyor',
    shipped: 'kargoda',
    delivered: 'teslim edildi',
    cancelled: 'iptal',
    pending: 'ödeme bekleniyor',
    completed: 'ödendi',
    failed: 'ödeme başarısız'
  }[value] || value);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const wantsHuman = (text) =>
  /whatsapp|insan|operatör|operator|canlı destek|canli destek|şikayet|sikayet/.test(
    String(text).toLocaleLowerCase('tr-TR')
  );

const forbidden = (text) =>
  /iptal et|iade onay|paramı iade|parami iade|kart numar|cvv|cvc|şifre ver|sifre ver/.test(
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

const productContext = async (message) => {
  const terms = searchTerms(message);
  if (!terms.length) return '';
  const filters = terms.map((term) => ({
    $or: [
      { title: { $regex: escapeRegex(term), $options: 'i' } },
      { category: { $regex: escapeRegex(term), $options: 'i' } }
    ]
  }));
  const products = await Product.find({ isActive: true, $or: filters })
    .select('title price category discountPercentage')
    .limit(5)
    .lean();
  if (!products.length) return '';
  return products
    .map((item) => {
      const discount = Number(item.discountPercentage || 0);
      const price = discount > 0 ? item.price - (item.price * discount) / 100 : item.price;
      return `- ${item.title} (${item.category || 'kategori yok'}): ${money(price)} ₺`;
    })
    .join('\n');
};

const orderContext = async (user) => {
  if (!user?._id) return 'Kullanıcı giriş yapmamış.';
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(3).lean();
  if (!orders.length) return 'Bu hesabın henüz siparişi yok.';
  return orders
    .map((order) => {
      const id = String(order._id).slice(-6).toUpperCase();
      return `- #${id}: ${statusTr(order.orderStatus)} / ödeme ${statusTr(order.paymentStatus)} / ${money(order.totalPrice)} ₺`;
    })
    .join('\n');
};

exports.chat = async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'anon';
    if (!rateOk(String(ip))) {
      return res.status(429).json({ success: false, message: 'Çok sık yazıldı. Bir dakika sonra tekrar dene.' });
    }

    const message = String(req.body.message || '').trim().slice(0, 500);
    if (!message) {
      return res.status(400).json({ success: false, message: 'Bir mesaj yaz.' });
    }

    const history = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];

    if (wantsHuman(message)) {
      return res.json({
        success: true,
        reply: 'Seni insan desteğe alıyorum. Sağ alttaki yeşil WhatsApp düğmesinden yazabilirsin.',
        escalate: true
      });
    }

    if (forbidden(message)) {
      return res.json({
        success: true,
        reply: 'Sipariş iptali, iade onayı veya ödeme işlemlerini ben yapamam. Bunu WhatsApp’tan ekibimizle netleştirelim.',
        escalate: true
      });
    }

    const [catalog, orders] = await Promise.all([
      productContext(message),
      orderContext(req.user)
    ]);

    const faq = matchFaq(message);
    if (faq) {
      let reply = faq;
      const asksOrder = /sipariş|siparis|kargo takip|nerede|durum/.test(
        message.toLocaleLowerCase('tr-TR')
      );
      if (asksOrder && req.user && orders && !orders.startsWith('Kullanıcı') && !orders.startsWith('Bu hesabın')) {
        reply = `Son siparişlerin:\n${orders}\n\n${faq}`;
      }
      return res.json({
        success: true,
        reply,
        escalate: /whatsapp/i.test(reply)
      });
    }

    const system = `Sen Nik Bag müşteri destek asistanısın. Sadece Türkçe, kısa ve net cevap ver.
Kurallar:
- Fiyat uydurma. Katalogda yoksa "emin değilim" de.
- Sipariş iptal etme, iade onaylama, ödeme alma, adres değiştirme.
- Bilmiyorsan WhatsApp'a yönlendir.
Mağaza bilgisi:
${KNOWLEDGE}

Katalog (eşleşen):
${catalog || 'Bu soruya özel ürün eşleşmedi.'}

Kullanıcının son siparişleri:
${orders}`;

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
        reply = await callGemini(`${system}\n\nKullanıcı: ${message}`);
      }
    } catch (error) {
      reply = null;
    }

    if (!reply) reply = faq;
    if (!reply && catalog) {
      reply = `Katalogda şunları gördüm:\n${catalog}\nDetay veya stok için ürün sayfasına bakabilir ya da WhatsApp’tan sorabilirsin.`;
    }
    if (!reply) {
      reply = 'Bunu netleştiremedim. Kargo, iade, ödeme veya sipariş diye sorabilirsin; özel işlem için WhatsApp daha doğru.';
    }

    return res.json({
      success: true,
      reply,
      escalate: /whatsapp/i.test(reply)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Destek asistanı şu an yanıt veremiyor.',
      reply: 'Bir hata oldu. Lütfen WhatsApp’tan yaz.'
    });
  }
};
