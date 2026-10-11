const internalText = (value) =>
  /is not defined|ECONN|Mongo|Cast to|ValidationError|Cannot read|E11000|status code \d|timeout of \d|\/node_modules\/|jwt malformed|Unexpected token/i
    .test(String(value || ''));

const publicMessage = (value, fallback) => {
  const text = String(value || '').trim();
  if (!text || internalText(text)) return fallback;
  return text;
};

const hideInternals = (body, statusCode) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const code = Number(statusCode) || 200;
  if (code < 400) return body;
  const detail = body.hata || body.error;
  if (detail && (code >= 500 || internalText(detail))) {
    console.error('İstek hatası:', detail);
    delete body.hata;
    delete body.error;
  }
  const fallback = 'Bir sorun oluştu. Lütfen tekrar deneyin.';
  if (code >= 500) {
    body.mesaj = publicMessage(body.mesaj, body.message && !internalText(body.message) ? body.message : fallback);
    body.message = publicMessage(body.message, body.mesaj || fallback);
  }
  return body;
};

module.exports = { internalText, publicMessage, hideInternals };
