const FEATURED_PACKAGES = {
  3: { days: 3, price: 2000 },
  5: { days: 5, price: 3500 },
  7: { days: 7, price: 5000 }
};

const packageOf = (days) => FEATURED_PACKAGES[Number(days)] || null;

module.exports = { FEATURED_PACKAGES, packageOf };
