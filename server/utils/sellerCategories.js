const { ALL_CATEGORY_IDS, CATEGORY_LABELS } = require('../constants/categories');

const ALLOWED = new Set(ALL_CATEGORY_IDS);

const normalizeMagazaTurleri = (input) => {
  const raw = Array.isArray(input)
    ? input
    : typeof input === 'string' && input.trim()
      ? input.split(/[,\n]/)
      : [];
  const unique = [];
  for (const item of raw) {
    const value = String(item || '').trim().toLowerCase();
    if (!value || !ALLOWED.has(value) || unique.includes(value)) continue;
    unique.push(value);
  }
  return unique;
};

const magazaTuruEtiket = (input) => {
  const list = normalizeMagazaTurleri(input);
  if (!list.length) return '';
  return list.map((id) => CATEGORY_LABELS[id] || id).join(' · ');
};

module.exports = { normalizeMagazaTurleri, magazaTuruEtiket };
