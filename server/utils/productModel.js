const MODEL_EXT = /\.(glb|gltf)(\?|#|$)/i;

/** Yalnızca .glb / .gltf adreslerini kabul eder. Boş değer modeli kaldırır. */
const sanitizeModelUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (raw.startsWith('/uploads/')) {
    return MODEL_EXT.test(raw) ? raw.split(/[?#]/)[0] : '';
  }

  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    if (!MODEL_EXT.test(url.pathname)) return '';
    return url.toString();
  } catch {
    return '';
  }
};

module.exports = { sanitizeModelUrl };
