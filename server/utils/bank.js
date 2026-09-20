const SiteSetting = require('../models/SiteSetting');

const compactIban = (iban = '') => String(iban || '').replace(/\s+/g, '').toUpperCase();

const formatIban = (iban = '') => compactIban(iban).replace(/(.{4})/g, '$1 ').trim();

const PLATFORM_BANK = {
  name: 'Nik Bag',
  holder: 'Muhammet Rıdvan Korurer',
  iban: 'TR26 0006 2000 5890 0006 6103 80'
};

const envBank = () => normalizeBank({
  name: process.env.BANK_NAME || process.env.FEATURED_BANK_NAME || PLATFORM_BANK.name,
  holder: process.env.BANK_HOLDER || process.env.BANK_ACCOUNT_HOLDER || PLATFORM_BANK.holder,
  iban: process.env.BANK_IBAN || process.env.FEATURED_BANK_IBAN || PLATFORM_BANK.iban
});

const hasBankAccount = (account) => compactIban(account?.iban).length >= 10;

const isValidIbanTr = (iban) => /^TR\d{24}$/.test(compactIban(iban));

function normalizeBank({ name = '', holder = '', iban = '' } = {}) {
  const shop = String(name || '').trim();
  const person = String(holder || '').trim();
  return {
    name: shop,
    holder: person || shop,
    iban: formatIban(iban)
  };
}

const fromSettings = (settings, fallback) => ({
  name: String(settings?.featuredBankName || fallback.name || '').trim(),
  holder: String(settings?.featuredBankHolder || fallback.holder || '').trim(),
  iban: formatIban(settings?.featuredBankIban || fallback.iban || '')
});

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

const upsertPlatformBank = async ({ name = '', holder = '', iban = '' } = {}) => {
  const clean = compactIban(iban);
  if (!isValidIbanTr(clean)) {
    const error = new Error('TR ile başlayan 26 karakterlik geçerli bir IBAN yazın.');
    error.status = 400;
    throw error;
  }
  const User = require('../models/User');
  const Seller = require('../models/Seller');
  const admin = await User.findOne({ rol: 'superadmin' }).sort({ createdAt: 1 }).select('_id adSoyad');
  const shop = admin ? await Seller.findOne({ user: admin._id }) : null;
  const account = normalizeBank({
    name: String(name || shop?.magazaAdi || PLATFORM_BANK.name).trim(),
    holder: String(holder || shop?.ibanHolder || admin?.adSoyad || PLATFORM_BANK.holder).trim(),
    iban: clean
  });
  if (shop) {
    shop.iban = clean;
    shop.ibanHolder = account.holder;
    await shop.save();
    account.name = shop.magazaAdi || account.name;
  }
  if (admin && account.holder && admin.adSoyad !== account.holder) {
    admin.adSoyad = account.holder;
    await admin.save();
  }
  await persistBank(account);
  return account;
};

const ensurePlatformBank = async () => {
  const account = await upsertPlatformBank(envBank());
  return account;
};

const resolveBank = async () => {
  const platform = envBank();
  try {
    await persistBank(platform);
    const User = require('../models/User');
    const Seller = require('../models/Seller');
    const admin = await User.findOne({ rol: 'superadmin' }).sort({ createdAt: 1 }).select('_id');
    if (admin) {
      await Seller.updateOne(
        { user: admin._id },
        { $set: { iban: compactIban(platform.iban), ibanHolder: platform.holder } }
      );
    }
    return platform;
  } catch {
    return platform;
  }
};

module.exports = {
  PLATFORM_BANK,
  envBank,
  resolveBank,
  hasBankAccount,
  formatIban,
  persistBank,
  isValidIbanTr,
  upsertPlatformBank,
  ensurePlatformBank
};
