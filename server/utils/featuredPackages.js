const FEATURED_SLOTS = 12;

const FEATURED_PACKAGES = {
  3: { days: 3, price: 2000, label: '3 gün', hint: 'Kısa vitrin' },
  5: { days: 5, price: 3500, label: '5 gün', hint: 'Orta vitrin' },
  7: { days: 7, price: 5000, label: '7 gün', hint: 'Tam vitrin' }
};

const { envBank } = require('./bank');

const DEFAULT_BANK = envBank();

const packageOf = (days) => FEATURED_PACKAGES[Number(days)] || null;

const packageList = () => Object.values(FEATURED_PACKAGES);

const liveStatusMatch = () => ({ status: { $in: ['live', 'approved'] } });

module.exports = {
  FEATURED_SLOTS,
  FEATURED_PACKAGES,
  DEFAULT_BANK,
  packageOf,
  packageList,
  liveStatusMatch
};
