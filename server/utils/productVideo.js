const VIDEO_EXT = /\.(mp4|webm|ogg)(\?|#|$)/i;

const sanitizeVideoUrl = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (raw.startsWith('/uploads/')) {
    return VIDEO_EXT.test(raw) ? raw.split(/[?#]/)[0] : '';
  }

  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    if (!VIDEO_EXT.test(url.pathname)) return '';
    return url.toString();
  } catch {
    return '';
  }
};

module.exports = { sanitizeVideoUrl };
