const { money } = require('./commission');
const { formatIban, hasBankAccount } = require('./bank');

const sellerUserId = (seller) => {
  const user = seller?.user;
  if (user && typeof user === 'object' && user._id) return String(user._id);
  if (user) return String(user);
  return '';
};

const buildOrderPayouts = (settlements = [], shops = [], platformBank = {}) => {
  const shopByUser = new Map(
    (shops || []).map((shop) => [sellerUserId(shop), shop]).filter(([id]) => id)
  );

  const platformAmount = money((settlements || []).reduce((sum, row) => sum + Number(row.fee || 0), 0));
  const platform = {
    role: 'platform',
    label: 'Site komisyonu',
    holder: String(platformBank?.holder || platformBank?.name || '').trim(),
    name: String(platformBank?.name || '').trim(),
    iban: formatIban(platformBank?.iban || ''),
    amount: platformAmount
  };

  const sellers = (settlements || [])
    .filter((row) => Number(row.net) > 0)
    .map((row) => {
      const shop = shopByUser.get(String(row.seller));
      return {
        role: 'seller',
        seller: String(row.seller),
        label: shop?.magazaAdi ? `${shop.magazaAdi} payı` : 'Atölye payı',
        holder: String(shop?.ibanHolder || '').trim(),
        name: String(shop?.magazaAdi || '').trim(),
        iban: formatIban(shop?.iban || ''),
        amount: money(row.net)
      };
    });

  return { platform, sellers };
};

const payoutTransfersOf = (payouts) => {
  const rows = [];
  if (payouts?.platform && Number(payouts.platform.amount) > 0) rows.push(payouts.platform);
  (payouts?.sellers || []).forEach((row) => {
    if (Number(row.amount) > 0) rows.push(row);
  });
  return rows;
};

const payoutsReady = (payouts) => {
  const rows = payoutTransfersOf(payouts);
  return rows.length > 0 && rows.every((row) => hasBankAccount(row) && Number(row.amount) > 0);
};

module.exports = { buildOrderPayouts, payoutTransfersOf, payoutsReady };
