export const instagramHref = (value = '') => {
  const handle = String(value)
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/.*$/, '')
    .replace(/\?.*$/, '');
  if (!/^[A-Za-z0-9._]{2,30}$/.test(handle)) return '';
  return `https://instagram.com/${handle}`;
};

export const websiteHref = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    const host = url.hostname.replace(/^www\./, '');
    if (!host.includes('.') || host.length < 4) return '';
    return url.toString();
  } catch {
    return '';
  }
};
