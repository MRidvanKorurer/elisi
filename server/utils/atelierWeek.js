const ATELIER_WEEK_SLOTS = 3;

const ATELIER_WEEK_PACKAGE = {
  days: 7,
  price: 6000,
  label: '7 gün',
  hint: 'Haftanın atölyesi'
};

const packageOf = (days) => (Number(days) === ATELIER_WEEK_PACKAGE.days ? ATELIER_WEEK_PACKAGE : null);

const packageList = () => [ATELIER_WEEK_PACKAGE];

module.exports = {
  ATELIER_WEEK_SLOTS,
  ATELIER_WEEK_PACKAGE,
  packageOf,
  packageList
};
