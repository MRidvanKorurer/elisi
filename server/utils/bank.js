const SiteSetting = require('../models/SiteSetting');

const compactIban = (iban = '') => String(iban || '').replace(/\s+/g, '').toUpperCase();

const formatIban = (iban = '') => compactIban(iban).replace(/(.{4})/g, '$1 ').trim();

const isValidIbanTr = (iban = '') => /^TR\d{24}$/.test(compactIban(iban));

const envBank = () => ({
  name: String(process.env.BANK_NAME || process.env.FEATURED_BANK_NAME || '').trim(),
  holder: String(process.env.BANK_HOLDER || process.env.BANK_ACCOUNT_HOLDER || '').trim(),
  iban: formatIban(process.env.BANK_IBAN || process.env.FEATURED_BANK_IBAN || '')
});

const hasBankAccount = (account) => isValidIbanTr(account?.iban);

const normalizeBank = ({ name = '', holder = '', iban = '' } = {}) => {
  const shop = String(name || '').trim();
  const person = String(holder || '').trim();
  return {
    name: shop,
    holder: person || shop,
    iban: formatIban(iban)
  };
};

const fromSettings = (settings, fallback) => ({
  name: String(settings?.featuredBankName || fallback.name || '').trim(),
  holder: String(settings?.featuredBankHolder || fallback.holder || '').trim(),
  iban: formatIban(settings?.featuredBankIban || fallback.iban || '')
});

const fromSeller = async () => {
  const Seller = require('../models/Seller');
  const shop = await Seller.findOne({
    durum: 'approved',
    iban: { $exists: true, $nin: [null, ''] }
  })
    .sort({ createdAt: 1 })
    .select('magazaAdi iban ibanHolder user')
    .populate('user', 'adSoyad')
    .lean();
  if (!shop?.iban || !isValidIbanTr(shop.iban)) return { name: '', holder: '', iban: '' };
  return {
    name: String(shop.magazaAdi || 'Nik Bag').trim(),
    holder: String(shop.ibanHolder || shop.user?.adSoyad || '').trim(),
    iban: formatIban(shop.iban)
  };
};

const persistBank = async (account) => {
  if (!hasBankAccount(account)) return;
  await SiteSetting.findOneAndUpdate(
    { key: 'site' },
    {
      $set: {
        featuredBankName: account.name,
        featuredBankHolder: account.holder,
        featuredBankIban: account.iban
      }
    },
    { upsert: true }
  );
};

const resolveBank = async () => {
  const fallback = envBank();
  try {
    const settings = await SiteSetting.findOne({ key: 'site' }).lean();
    const saved = fromSettings(settings, fallback);
    const needsHolder = !saved.holder;
    const shop = (!hasBankAccount(saved) || needsHolder) ? await fromSeller() : { name: '', holder: '', iban: '' };
    const merged = normalizeBank({
      name: saved.name || shop.name,
      holder: saved.holder || shop.holder,
      iban: saved.iban || shop.iban
    });
    if (hasBankAccount(merged) && needsHolder && shop.holder) {
      await persistBank(merged);
    }
    if (!hasBankAccount(merged)) {
      return normalizeBank({ name: merged.name, holder: merged.holder, iban: '' });
    }
    return merged;
  } catch {
    return hasBankAccount(fallback) ? fallback : normalizeBank({ ...fallback, iban: '' });
  }
};

module.exports = { compactIban, envBank, resolveBank, hasBankAccount, formatIban, isValidIbanTr };
