export const foldTr = (value) =>
  String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

export const matchesHaystack = (haystack, query) => {
  const q = foldTr(query).trim();
  if (!q) return true;
  return foldTr(haystack).includes(q);
};

export const matchesCustomerName = (customer, query) => {
  const q = foldTr(query).trim();
  if (!q) return true;
  const first = foldTr(customer?.firstName);
  const last = foldTr(customer?.lastName);
  const full = `${first} ${last}`.replace(/\s+/g, ' ').trim();
  const compact = `${first}${last}`;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  if (tokens.every((token) => first.includes(token) || last.includes(token) || full.includes(token))) {
    return true;
  }
  return full.includes(q) || compact.includes(q.replace(/\s+/g, ''));
};
