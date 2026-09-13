export const FEATURED_PACKAGES = [
  { days: 3, price: 2000, label: '3 gün', hint: 'Kısa vitrin' },
  { days: 5, price: 3500, label: '5 gün', hint: 'Orta vitrin' },
  { days: 7, price: 5000, label: '7 gün', hint: 'Tam vitrin' }
];

export const FEATURED_SLOTS = 12;

export const FEATURED_BANK = {
  name: '',
  iban: ''
};

export const isReceiptPdf = (value = '') => /\.pdf(\?|$)/i.test(String(value));

export const FEATURED_STATUS = {
  pending: 'Sırada',
  live: 'Vitrinde',
  approved: 'Vitrinde',
  ended: 'Bitti',
  rejected: 'Reddedildi',
  cancelled: 'İptal',
  removed: 'Bitti'
};

export const isLiveFeatured = (item) =>
  item?.status === 'live' || item?.status === 'approved';
