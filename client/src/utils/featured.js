export const FEATURED_PACKAGES = [
  { days: 3, price: 2000, label: '3 gün', hint: 'Kısa vitrin' },
  { days: 5, price: 3500, label: '5 gün', hint: 'Orta vitrin' },
  { days: 7, price: 5000, label: '7 gün', hint: 'Tam vitrin' }
];

export const FEATURED_BANK = {
  name: 'NikBag El Sanatları',
  iban: 'TR00 0000 0000 0000 0000 0000 00'
};

export const isReceiptPdf = (value = '') => /\.pdf(\?|$)/i.test(String(value));

export const FEATURED_STATUS = {
  pending: 'Onay bekliyor',
  approved: 'Yayında',
  rejected: 'Reddedildi',
  cancelled: 'İptal',
  removed: 'Vitrinden alındı'
};
