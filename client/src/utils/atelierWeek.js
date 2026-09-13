export const ATELIER_WEEK_SLOTS = 3;

export const ATELIER_WEEK_PACKAGE = {
  days: 7,
  price: 6000,
  label: '7 gün',
  hint: 'Haftanın atölyesi'
};

export const ATELIER_WEEK_STATUS = {
  pending: 'Sırada',
  live: 'Vitrinde',
  ended: 'Bitti',
  rejected: 'Reddedildi',
  cancelled: 'İptal'
};

export const isLiveWeek = (item) => item?.status === 'live';
