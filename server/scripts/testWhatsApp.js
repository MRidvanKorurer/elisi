/**
 * WhatsApp bağlantısını dener ve 0554 379 32 35'e test mesajı atar.
 * Kullanım (server klasöründe): npm run test:whatsapp
 * Başka numaraya: node scripts/testWhatsApp.js 05xxxxxxxxx
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { initWhatsApp, waitUntilReady, sendText, destroyClient } = require('../services/whatsappService');

const target = process.argv[2] || process.env.WHATSAPP_FROM_PHONE || process.env.WHATSAPP_NUMBER || '905543793235';

(async () => {
  console.log('WhatsApp başlatılıyor. QR çıkarsa 0554 379 32 35 ile tarayın.');
  await initWhatsApp();
  await waitUntilReady();
  const ok = await sendText(target, 'Nikbagstore test: whatsapp-web.js çalışıyor.');
  if (!ok) {
    console.error('Mesaj gönderilemedi. Bağlantı hazır değil veya numara geçersiz:', target);
    await destroyClient();
    process.exit(1);
  }
  console.log('Test mesajı gitti:', target);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await destroyClient();
  process.exit(0);
})().catch(async (error) => {
  console.error(error.message);
  await destroyClient().catch(() => {});
  process.exit(1);
});
