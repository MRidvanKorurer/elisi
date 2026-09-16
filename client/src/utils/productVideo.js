import { mediaUrl } from '../api/lookbookService';

const VIDEO_EXT = /\.(mp4|webm|ogg)(\?|#|$)/i;

/** Yalnızca doğrudan video dosyası. YouTube iframe'i sayfayı yormasın diye yok. */
export const resolveProductVideo = (value = '') => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (!VIDEO_EXT.test(url.pathname) && !raw.includes('/uploads/')) return '';
      return raw;
    } catch {
      return '';
    }
  }

  if (raw.startsWith('/uploads/') && VIDEO_EXT.test(raw)) {
    return mediaUrl(raw) || raw;
  }

  return '';
};
