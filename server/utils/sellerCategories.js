const { CATEGORY_LABELS, CATEGORY_LABELS_EN } = require('../constants/categories');

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalizeMagazaTurleri = (input) => {
  const raw = Array.isArray(input)
    ? input
    : typeof input === 'string' && input.trim()
      ? input.split(/[,\n]/)
      : [];
  const unique = [];
  for (const item of raw) {
    const value = String(item || '').trim().toLowerCase();
    if (!value || !ID_RE.test(value) || unique.includes(value)) continue;
    unique.push(value);
  }
  return unique;
};

const magazaTuruEtiket = (input, lang = 'tr') => {
  const list = normalizeMagazaTurleri(input);
  if (!list.length) return '';
  const labels = lang === 'en' ? CATEGORY_LABELS_EN : CATEGORY_LABELS;
  return list.map((id) => labels[id] || CATEGORY_LABELS[id] || id).join(' · ');
};

module.exports = { normalizeMagazaTurleri, magazaTuruEtiket };
