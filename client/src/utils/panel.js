// NikBag marka paleti
export const T = {
  cream: '#FDF4D2',
  creamDeep: '#F7EBC0',
  navy: '#2E3B55',
  navyDeep: '#232E43',
  rose: '#946D6D',
  roseSoft: 'rgba(148,109,109,0.12)',
  lavender: '#A290B7',
  blue: '#B0CDE6',
  muted: '#6E5252',
  line: 'rgba(148,109,109,0.16)',
  surface: '#FFFFFF',
  surfaceSoft: '#FBF7EE'
};

export const ORDER_STATUS = {
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim edildi',
  cancelled: 'İptal'
};

export const PAYMENT_STATUS = {
  pending: 'Ödeme bekliyor',
  completed: 'Ödendi',
  failed: 'Başarısız'
};

export const PAYMENT_METHOD = {
  credit_card: 'Kredi kartı',
  transfer: 'Havale / EFT',
  whatsapp: 'WhatsApp'
};

export const APPROVAL_STATUS = {
  pending: 'Onay bekliyor',
  approved: 'Onaylı',
  rejected: 'Reddedildi'
};

export const SELLER_STATUS = {
  pending: 'İncelemede',
  approved: 'Onaylı',
  rejected: 'Reddedildi',
  suspended: 'Askıda'
};

export const money = (value = 0) =>
  `₺${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const when = (value) =>
  value
    ? new Date(value).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';
