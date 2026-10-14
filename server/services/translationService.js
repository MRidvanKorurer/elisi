/**
 * Türkçe → İngilizce metin çevirisi.
 * Sıra: sözlük → DeepL (DEEPL_API_KEY) → Gemini (GEMINI_API_KEY) → OpenAI (OPENAI_API_KEY)
 * → Google Cloud (GOOGLE_TRANSLATE_API_KEY) → ücretsiz Google uç noktası.
 * Çevrilemeyen metinler sonuçta yer almaz; çağıran taraf Türkçeye düşer.
 */
const { glossaryTranslate } = require('../i18n/contentGlossary');

const cleanKey = (value) => String(value || '').trim().replace(/^["']|["']$/g, '');
const cache = new Map();
const MAX_CACHE = 5000;

const STYLE_GUIDE = [
  'You translate Turkish copy for Nikbag, an online marketplace for handmade, mostly hand-knitted goods (bags, bath scrubbers, baby knits, blankets).',
  'Write natural, polished US English suitable for product listings. Do not add or drop information.',
  'Keep brand, shop and model names unchanged (e.g. Nikbag, Nik Bag, Nerina, Vera, Mirella, Noir, Mila & Co, Mocha, Zeugma).',
  '"Atölye" means the maker\'s studio: translate it as "atelier". "Lif" (bath item) is a "bath scrubber". "El örgüsü" is "hand-knitted". "El emeği" is "handcrafted".',
  'Keep line breaks, numbers, units and symbols exactly.'
].join(' ');

const postProcess = (text) => String(text || '')
  .replace(/\bNik\s?Bag\s+(?:Workshop|Atelier|Studio)\b/gi, 'Nik Bag Atelier')
  .replace(/\bNikbag\s+(?:Workshop|Atelier|Studio)\b/gi, 'Nikbag Atelier')
  .replace(/\bworkshop(s?)\b/g, 'atelier$1')
  .replace(/\bWorkshop(s?)\b/g, 'Atelier$1')
  .trim();

const remember = (source, translated) => {
  if (!translated) return;
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(source, translated);
};

const parseJsonArray = (raw, length) => {
  const text = String(raw || '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : parsed.t || parsed.translations || parsed.items;
  if (!Array.isArray(list) || list.length !== length) throw new Error('length mismatch');
  return list.map((item) => String(item ?? ''));
};

const viaDeepl = async (texts) => {
  const key = cleanKey(process.env.DEEPL_API_KEY);
  if (!key) return null;
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const response = await fetch(`${host}/v2/translate`, {
    method: 'POST',
    headers: { Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texts, source_lang: 'TR', target_lang: 'EN-US', preserve_formatting: true }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`deepl ${response.status}`);
  const data = await response.json();
  return (data.translations || []).map((item) => item.text);
};

const GEMINI_MODELS = [process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']
  .filter((value, index, list) => value && list.indexOf(value) === index);

const llmPrompt = (texts) => `${STYLE_GUIDE}\nTranslate each item of this JSON array from Turkish to English and reply with only a JSON array of the same length and order.\n${JSON.stringify(texts)}`;

const viaGemini = async (texts) => {
  const key = cleanKey(process.env.GEMINI_API_KEY);
  if (!key) return null;
  let lastError;
  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: llmPrompt(texts) }] }],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
          }),
          signal: AbortSignal.timeout(45000)
        }
      );
      if (!response.ok) throw new Error(`gemini ${response.status}`);
      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
      return parseJsonArray(raw, texts.length);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('gemini failed');
};

const viaOpenAi = async (texts) => {
  const key = cleanKey(process.env.OPENAI_API_KEY);
  if (!key) return null;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `${STYLE_GUIDE} Reply with JSON: {"t": [translations in the same order]}.` },
        { role: 'user', content: JSON.stringify(texts) }
      ]
    }),
    signal: AbortSignal.timeout(45000)
  });
  if (!response.ok) throw new Error(`openai ${response.status}`);
  const data = await response.json();
  return parseJsonArray(data.choices?.[0]?.message?.content, texts.length);
};

const viaGoogleCloud = async (texts) => {
  const key = cleanKey(process.env.GOOGLE_TRANSLATE_API_KEY);
  if (!key) return null;
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, source: 'tr', target: 'en', format: 'text' }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`google ${response.status}`);
  const data = await response.json();
  return (data.data?.translations || []).map((item) => item.translatedText);
};

const viaGoogleFree = async (texts) => {
  if (process.env.DISABLE_FREE_TRANSLATE === '1') return null;
  const out = [];
  for (const text of texts) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`gtx ${response.status}`);
    const data = await response.json();
    out.push((data?.[0] || []).map((part) => part?.[0] || '').join(''));
  }
  return out;
};

const PROVIDERS = [
  ['deepl', viaDeepl],
  ['gemini', viaGemini],
  ['openai', viaOpenAi],
  ['google', viaGoogleCloud],
  ['google-free', viaGoogleFree]
];

const CHUNK = 40;

/**
 * Metinleri çevirir. Dönen Map yalnızca çevrilebilen metinleri içerir (kaynak → İngilizce).
 */
const translateTexts = async (texts = []) => {
  const result = new Map();
  const pending = [];

  [...new Set(texts.map((text) => String(text || '').trim()).filter(Boolean))].forEach((text) => {
    const known = glossaryTranslate(text) || cache.get(text);
    if (known) result.set(text, known);
    else pending.push(text);
  });

  for (let i = 0; i < pending.length; i += CHUNK) {
    const chunk = pending.slice(i, i + CHUNK);
    for (const [name, provider] of PROVIDERS) {
      try {
        const translated = await provider(chunk);
        if (!translated) continue;
        chunk.forEach((source, index) => {
          const value = postProcess(translated[index]);
          if (!value) return;
          remember(source, value);
          result.set(source, value);
        });
        break;
      } catch (error) {
        console.warn(`[translate] ${name} başarısız: ${error.message}`);
      }
    }
  }

  return result;
};

const hasProvider = () => Boolean(
  cleanKey(process.env.DEEPL_API_KEY)
  || cleanKey(process.env.GEMINI_API_KEY)
  || cleanKey(process.env.OPENAI_API_KEY)
  || cleanKey(process.env.GOOGLE_TRANSLATE_API_KEY)
  || process.env.DISABLE_FREE_TRANSLATE !== '1'
);

module.exports = { translateTexts, hasProvider };
