const mongoose = require('mongoose');
const Product = require('../models/Product');
const AdEvent = require('../models/AdEvent');
const FeaturedRequest = require('../models/FeaturedRequest');
const { slotsOf, expireFeaturedProducts } = require('../controllers/featuredController');
const { FEATURED_SLOTS } = require('./featuredPackages');
const { CATEGORY_LABELS } = require('../constants/categories');

const categoryLabelOf = (value) => CATEGORY_LABELS[String(value || '').toLowerCase()] || value || 'Diğer';
const cleanKey = (value) => String(value || '').trim().replace(/^["']|["']$/g, '');

const callOpenAi = async (messages, maxTokens = 900) => {
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
      temperature: 0.35,
      max_tokens: maxTokens,
      messages
    }),
    signal: AbortSignal.timeout(20000)
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

const callGemini = async (prompt, maxTokens = 900) => {
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
            generationConfig: { temperature: 0.35, maxOutputTokens: maxTokens }
          }),
          signal: AbortSignal.timeout(20000)
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

const parseJsonBlock = (raw) => {
  const text = String(raw || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const FALLBACK_TRENDS = [
  {
    title: 'Kişiselleştirilmiş clutch ve mini çanta',
    why: 'Etsy ve Instagram atölyelerinde isim/harf detaylı küçük çantalar hızlı dönüşüyor; özel gün hediyesi arayanlar buraya kayıyor.',
    platforms: ['Etsy', 'Instagram Shop', 'Trendyol El Yapımı'],
    categoryHint: 'canta'
  },
  {
    title: 'Doğal malzeme + yazlık renkler',
    why: 'Hasır, jüt ve ahşap saplı parçalar yaz sezonunda Trendyol ve Pinterest’te öne çıkıyor; stoklu hızlı kargo avantajı CTR’yi yükseltiyor.',
    platforms: ['Trendyol', 'Pinterest', 'Hepsiburada'],
    categoryHint: 'canta'
  },
  {
    title: 'Ölçüye özel üretim notu açık ürünler',
    why: 'Rakip sitelerde “ölçüye göre” etiketi tıklanma ve sepete dönüşümü artırıyor; reklam metninde teslim süresi yazmak güven veriyor.',
    platforms: ['Etsy', 'Nik Bag vitrin'],
    categoryHint: ''
  },
  {
    title: 'Video’lu ürün kartları',
    why: 'Hareketli kumaş/çanta klipleri Meta ve TikTok reklamlarında duraklamayı uzatıyor; vitrine video’su olan ürünleri almak daha verimli.',
    platforms: ['TikTok', 'Instagram Reels', 'Meta Ads'],
    categoryHint: ''
  }
];

const daysBetween = (from, to) => Math.max(1, Math.ceil((to - from) / (24 * 60 * 60 * 1000)));

const scoreProduct = (product, ads = {}) => {
  const sold = Number(product.soldCount || 0);
  const stock = Number(product.stock || 0);
  const price = Number(product.price || 0);
  const impressions = Number(ads.impressions || 0);
  const clicks = Number(ads.clicks || 0);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  let score = sold * 12 + clicks * 8 + ctr * 4;
  if (!product.isSponsored) score += 25;
  if (stock >= 3) score += 10;
  if (product.video) score += 15;
  if (price >= 800 && price <= 4500) score += 8;
  if (impressions === 0 && sold >= 2) score += 18;
  return Math.round(score);
};

const reasonFor = (product, ads = {}) => {
  const bits = [];
  if (Number(product.soldCount || 0) >= 3) bits.push(`${product.soldCount} satış`);
  if (Number(ads.clicks || 0) > 0) bits.push(`${ads.clicks} tıklama`);
  if (Number(ads.impressions || 0) > 0 && Number(ads.clicks || 0) === 0) bits.push('gösterim var, tıklama zayıf');
  if (!product.isSponsored) bits.push('şu an vitrinde değil');
  if (product.video) bits.push('videolu kart');
  if (Number(product.stock || 0) <= 2) bits.push('stok dikkat');
  return bits.slice(0, 3).join(' · ') || 'Katalogda reklam adayı';
};

/**
 * @param {{ sellerId?: string, audience?: 'admin'|'seller' }} opts
 */
const buildAdsBoard = async (opts = {}) => {
  const sellerId = opts.sellerId ? String(opts.sellerId) : '';
  const audience = opts.audience || (sellerId ? 'seller' : 'admin');

  await expireFeaturedProducts();
  const now = new Date();
  const from30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const productMatch = {
    isActive: true,
    approvalStatus: { $nin: ['pending', 'rejected'] }
  };
  if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
    productMatch.seller = sellerId;
  }

  const [products, platformCategoryRows, adEvents, liveFeatured, slots] = await Promise.all([
    Product.find(productMatch)
      .populate('seller', 'adSoyad email')
      .select('title image price stock soldCount category isSponsored sponsoredUntil video seller approvalStatus createdAt')
      .sort({ soldCount: -1, createdAt: -1 })
      .limit(sellerId ? 120 : 200)
      .lean(),
    sellerId
      ? Product.aggregate([
          { $match: { isActive: true, approvalStatus: { $nin: ['pending', 'rejected'] } } },
          { $group: { _id: '$category', sold: { $sum: { $ifNull: ['$soldCount', 0] } }, count: { $sum: 1 } } },
          { $sort: { sold: -1 } },
          { $limit: 8 }
        ])
      : Promise.resolve([]),
    AdEvent.find({ createdAt: { $gte: from30 } }).select('type product surface createdAt').lean(),
    FeaturedRequest.find({
      status: { $in: ['live', 'approved'] },
      $or: [{ endsAt: { $gt: now } }, { endsAt: null }]
    })
      .populate('product', 'title image')
      .lean(),
    slotsOf()
  ]);

  const productIds = new Set(products.map((item) => String(item._id)));
  const adByProduct = new Map();
  adEvents.forEach((event) => {
    const id = String(event.product || '');
    if (!id) return;
    if (sellerId && !productIds.has(id)) return;
    const row = adByProduct.get(id) || { impressions: 0, clicks: 0 };
    if (event.type === 'impression') row.impressions += 1;
    if (event.type === 'click') row.clicks += 1;
    adByProduct.set(id, row);
  });

  const liveIds = new Set(
    liveFeatured.map((item) => String(item.product?._id || item.product || '')).filter(Boolean)
  );

  const catalog = products.map((product) => {
    const id = String(product._id);
    const ads = adByProduct.get(id) || { impressions: 0, clicks: 0 };
    const impressions = ads.impressions;
    const clicks = ads.clicks;
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0;
    const live = Boolean(product.isSponsored) || liveIds.has(id);
    const eligible = !live && Number(product.stock || 0) > 0;
    return {
      id,
      title: product.title,
      image: product.image || '',
      price: product.price,
      stock: product.stock,
      soldCount: product.soldCount || 0,
      category: product.category || '',
      categoryLabel: categoryLabelOf(product.category),
      video: Boolean(product.video),
      isSponsored: live,
      sponsoredUntil: product.sponsoredUntil || null,
      seller: product.seller
        ? {
            id: String(product.seller._id || product.seller),
            name: product.seller.adSoyad || '',
            email: product.seller.email || ''
          }
        : null,
      impressions,
      clicks,
      ctr,
      eligible,
      score: scoreProduct({ ...product, isSponsored: live }, ads),
      reason: reasonFor({ ...product, isSponsored: live }, ads)
    };
  });

  const eligible = catalog
    .filter((item) => item.eligible)
    .sort((a, b) => b.score - a.score || b.soldCount - a.soldCount)
    .slice(0, 40);

  const live = catalog
    .filter((item) => item.isSponsored)
    .sort((a, b) => b.clicks - a.clicks || b.soldCount - a.soldCount);

  const topAds = [...catalog]
    .filter((item) => item.impressions > 0 || item.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks || b.ctr - a.ctr)
    .slice(0, 12);

  const bestsellers = [...catalog]
    .sort((a, b) => b.soldCount - a.soldCount || b.score - a.score)
    .slice(0, 12);

  const categoryDemand = {};
  catalog.forEach((item) => {
    const key = item.categoryLabel || 'Diğer';
    const row = categoryDemand[key] || { category: key, sold: 0, eligible: 0, live: 0 };
    row.sold += Number(item.soldCount || 0);
    if (item.eligible) row.eligible += 1;
    if (item.isSponsored) row.live += 1;
    categoryDemand[key] = row;
  });
  const categories = Object.values(categoryDemand)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 8);

  const platformCategories = platformCategoryRows.map((row) => ({
    category: categoryLabelOf(row._id),
    sold: row.sold || 0,
    products: row.count || 0
  }));

  const scopedEvents = sellerId
    ? adEvents.filter((event) => productIds.has(String(event.product || '')))
    : adEvents;
  const impressions = scopedEvents.filter((item) => item.type === 'impression').length;
  const clicks = scopedEvents.filter((item) => item.type === 'click').length;

  return {
    audience,
    generatedAt: now.toISOString(),
    windowDays: daysBetween(from30, now),
    slots: {
      total: slots?.total || FEATURED_SLOTS,
      free: slots?.free ?? 0,
      live: live.length,
      nextFreeAt: slots?.nextFreeAt || null
    },
    totals: {
      impressions,
      clicks,
      ctr: impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0,
      eligible: eligible.length,
      catalog: catalog.length
    },
    eligible,
    live,
    topAds,
    bestsellers,
    categories,
    platformCategories,
    aiReady: Boolean(cleanKey(process.env.OPENAI_API_KEY) || cleanKey(process.env.GEMINI_API_KEY))
  };
};

const heuristicSuggestions = (board) => {
  const picks = board.eligible.slice(0, 6).map((item, index) => ({
    productId: item.id,
    title: item.title,
    image: item.image,
    priority: index + 1,
    reason: item.reason,
    score: item.score
  }));

  const marketTrends = FALLBACK_TRENDS.map((trend) => {
    const match = board.eligible.find((item) =>
      trend.categoryHint ? String(item.category || '').includes(trend.categoryHint) : true
    );
    return {
      ...trend,
      matchedProductId: match?.id || null,
      matchedTitle: match?.title || null
    };
  });

  const summary = board.audience === 'seller'
    ? 'Kendi satış, stok ve vitrin verinize göre öneri üretildi. AI anahtarı varsa pazar eğilimleri zenginleşir; rakip mağaza verisi paylaşılmaz.'
    : 'Yapay zeka anahtarı yoksa katalog satışı, stok ve reklam tıklamalarına göre öneri üretilir.';

  return {
    source: 'heuristic',
    summary,
    picks,
    marketTrends
  };
};

const askAiSuggestions = async (board) => {
  const catalogBrief = board.eligible.slice(0, 24).map((item) => ({
    id: item.id,
    title: item.title,
    category: item.categoryLabel,
    sold: item.soldCount,
    price: item.price,
    stock: item.stock,
    video: item.video,
    impressions: item.impressions,
    clicks: item.clicks,
    ctr: item.ctr,
    score: item.score
  }));

  const sellerPrompt = board.audience === 'seller'
    ? `Sen Nik Bag satıcısına danışmanlık yapan reklam stratejistisin.
Yalnızca bu satıcının ürünlerini öner. Başka satıcı ürünü uydurma.
Öneriler satıcının kendi vitrin talebine (öne çıkan paket) dönüştürülebilir olsun.
Platform kategori talebi anonimdir; rakip mağaza adı yazma.`
    : `Sen Nik Bag el yapımı pazaryeri için reklam stratejistisin.`;

  const system = `${sellerPrompt}
Türkçe yanıt ver. Sadece geçerli JSON döndür, markdown kullanma.
Gerçek zamanlı rakip site verisi çekemezsin; Etsy, Trendyol, Instagram Shop genel eğilimlerini kullan.
Uydurma ürün id yazma; yalnızca verilen katalogdaki id'leri kullan.
JSON şema:
{
  "summary": "2-3 cümle",
  "picks": [{"productId":"...","reason":"...","priority":1}],
  "marketTrends": [{"title":"...","why":"...","platforms":["Etsy"],"categoryHint":"","matchedProductId":null}]
}
En fazla 6 pick, en fazla 5 marketTrends.`;

  const user = JSON.stringify({
    audience: board.audience,
    slots: board.slots,
    totals: board.totals,
    categories: board.categories,
    platformCategories: board.platformCategories || [],
    eligible: catalogBrief,
    liveTitles: board.live.slice(0, 8).map((item) => item.title)
  });

  const openai = await callOpenAi([
    { role: 'system', content: system },
    { role: 'user', content: user }
  ]);
  let parsed = parseJsonBlock(openai);
  if (!parsed) {
    const gemini = await callGemini(`${system}\n\nVeri:\n${user}`);
    parsed = parseJsonBlock(gemini);
  }
  if (!parsed) return null;

  const byId = new Map(board.eligible.concat(board.live).map((item) => [item.id, item]));
  const picks = (Array.isArray(parsed.picks) ? parsed.picks : [])
    .map((pick, index) => {
      const product = byId.get(String(pick.productId || ''));
      if (!product) return null;
      return {
        productId: product.id,
        title: product.title,
        image: product.image,
        priority: Number(pick.priority) || index + 1,
        reason: String(pick.reason || product.reason).slice(0, 220),
        score: product.score
      };
    })
    .filter(Boolean)
    .slice(0, 6);

  const marketTrends = (Array.isArray(parsed.marketTrends) ? parsed.marketTrends : [])
    .map((trend) => {
      const matched =
        byId.get(String(trend.matchedProductId || '')) ||
        board.eligible.find((item) =>
          trend.categoryHint ? String(item.category || '').includes(String(trend.categoryHint)) : false
        );
      return {
        title: String(trend.title || '').slice(0, 120),
        why: String(trend.why || '').slice(0, 320),
        platforms: Array.isArray(trend.platforms)
          ? trend.platforms.map((item) => String(item).slice(0, 40)).slice(0, 4)
          : [],
        categoryHint: String(trend.categoryHint || ''),
        matchedProductId: matched?.id || null,
        matchedTitle: matched?.title || null
      };
    })
    .filter((item) => item.title)
    .slice(0, 5);

  if (!picks.length && !marketTrends.length) return null;

  return {
    source: 'ai',
    summary: String(parsed.summary || 'Vitrin ve pazar eğilimine göre öneriler hazır.').slice(0, 420),
    picks: picks.length ? picks : heuristicSuggestions(board).picks,
    marketTrends: marketTrends.length ? marketTrends : FALLBACK_TRENDS
  };
};

const composeAdsResponse = async ({ sellerId, refreshAi = false } = {}) => {
  const board = await buildAdsBoard({ sellerId, audience: sellerId ? 'seller' : 'admin' });
  const suggestions = refreshAi
    ? (await askAiSuggestions(board)) || heuristicSuggestions(board)
    : heuristicSuggestions(board);
  return { board, suggestions };
};

module.exports = {
  buildAdsBoard,
  heuristicSuggestions,
  askAiSuggestions,
  composeAdsResponse
};
