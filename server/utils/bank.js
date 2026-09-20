const SiteSetting = require('../models/SiteSetting');

const compactIban = (iban = '') => String(iban || '').replace(/\s+/g, '').toUpperCase();

const formatIban = (iban = '') => compactIban(iban).replace(/(.{4})/g, '$1 ').trim();

const envBank = () => ({
  name: String(process.env.BANK_NAME || process.env.FEATURED_BANK_NAME || '').trim(),
  iban: formatIban(process.env.BANK_IBAN || process.env.FEATURED_BANK_IBAN || '')
});

const hasBankAccount = (account) => compactIban(account?.iban).length >= 10;

const fromSettings = (settings, fallback) => ({
  name: String(settings?.featuredBankName || fallback.name || '').trim(),
  iban: formatIban(settings?.featuredBankIban || fallback.iban || '')
});

const fromSeller = async () => {
  const Seller = require('../models/Seller');
  const shop = await Seller.findOne({
    durum: 'approved',
    iban: { $exists: true, $nin: [null, ''] }
  })
    .sort({ createdAt: 1 })
    .select('magazaAdi iban')
    .lean();
  if (!shop?.iban) return { name: '', iban: '' };
  return {
    name: String(shop.magazaAdi || 'Nik Bag').trim(),
    iban: formatIban(shop.iban)
  };
};

const resolveBank = async () => {
  const fallback = envBank();
  try {
    const settings = await SiteSetting.findOne({ key: 'site' }).lean();
    const saved = fromSettings(settings, fallback);
    if (hasBankAccount(saved)) return saved;

    const shop = await fromSeller();
    if (!hasBankAccount(shop)) return fallback;

    await SiteSetting.findOneAndUpdate(
      { key: 'site' },
      { $set: { featuredBankName: shop.name, featuredBankIban: shop.iban } },
      { upsert: true }
    );
    return shop;
  } catch {
    return fallback;
  }
};

module.exports = { envBank, resolveBank, hasBankAccount, formatIban };
