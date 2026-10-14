/**
 * Çok dilli içerik: belgelerde Türkçe alanların yanında `en` alt nesnesi tutulur
 * (ör. { title, description, en: { title, description } }).
 * İstek ?lang=en ile gelirse yanıttaki her `en` değeri Türkçe alanın üzerine yazılır;
 * Türkçe yanıtlarda `en` nesneleri gönderilmez.
 */

const { translateMessage } = require('../i18n/messagesEn');

const META_KEYS = new Set(['sourceHash', 'translatedAt', 'manual']);

const requestLang = (req) => {
  const raw = String(req?.query?.lang || '').toLowerCase();
  return raw === 'en' ? 'en' : 'tr';
};

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return value !== undefined && value !== null && String(value).trim() !== '';
};

const transform = (value, lang, depth = 0) => {
  if (depth > 14 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => transform(item, lang, depth + 1));

  if (isPlainObject(value.en)) {
    if (lang === 'en') {
      Object.entries(value.en).forEach(([key, translated]) => {
        if (META_KEYS.has(key) || !hasValue(translated)) return;
        if (isPlainObject(translated) && isPlainObject(value[key])) {
          value[key] = { ...value[key], ...translated };
        } else {
          value[key] = translated;
        }
      });
    }
    delete value.en;
  }

  Object.keys(value).forEach((key) => {
    value[key] = transform(value[key], lang, depth + 1);
  });
  return value;
};

const MESSAGE_KEYS = ['message', 'mesaj'];

const translateMessages = (body, lang) => {
  if (lang !== 'en' || !isPlainObject(body)) return body;
  const keys = MESSAGE_KEYS.filter((key) => typeof body[key] === 'string');
  if (!keys.length) return body;
  const out = { ...body };
  keys.forEach((key) => {
    out[key] = translateMessage(body[key]);
  });
  return out;
};

/** res.json gövdesini dile göre dönüştürür; `en` içermeyen yanıtlara dokunmaz. */
const localizeBody = (body, lang) => {
  if (!body || typeof body !== 'object') return body;
  let json;
  try {
    json = JSON.stringify(body);
  } catch {
    return body;
  }
  if (!json || !json.includes('"en":{')) return translateMessages(body, lang);
  return translateMessages(transform(JSON.parse(json), lang), lang);
};

module.exports = { requestLang, localizeBody, transform };
