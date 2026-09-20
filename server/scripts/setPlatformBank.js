require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const { ensurePlatformBank, envBank } = require('../utils/bank');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 20000 });
  const bank = await ensurePlatformBank();
  const expected = envBank();
  if (bank.iban.replace(/\s/g, '') !== expected.iban.replace(/\s/g, '')) {
    throw new Error('Site IBAN kaydı beklenen hesapla eşleşmedi.');
  }
  console.log(JSON.stringify({
    holder: bank.holder,
    name: bank.name,
    iban: bank.iban
  }));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
