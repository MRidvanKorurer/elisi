const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const User = require('../models/User');
const { siteUrl } = require('../utils/runtime');

const chromeCandidates = () => {
  if (process.platform === 'win32') {
    const pf = process.env.PROGRAMFILES || 'C:\\Program Files';
    const pf86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return [
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    ];
  }
  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    ];
  }
  return [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
};

const resolveChromeExecutable = () => {
  const fromEnv = String(process.env.PUPPETEER_EXECUTABLE_PATH || '').trim();
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const installed = chromeCandidates().find((candidate) => fs.existsSync(candidate));
  if (installed) return installed;
  try {
    const bundled = require('puppeteer').executablePath();
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch {
    /* puppeteer chrome henüz inmemiş olabilir */
  }
  return undefined;
};

const releaseSessionBrowser = () => {
  try {
    if (process.platform === 'win32') {
      execFileSync('powershell.exe', [
        '-NoProfile',
        '-Command',
        "Get-CimInstance Win32_Process | Where-Object { ($_.Name -match 'chrome|msedge') -and $_.CommandLine -like '*session-nikbagstore*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
      ], { stdio: 'ignore', timeout: 20000, windowsHide: true });
    } else if (process.env.WHATSAPP_KILL_ORPHANS === '1') {
      execFileSync('pkill', ['-f', 'session-nikbagstore'], { stdio: 'ignore', timeout: 8000 });
    }
  } catch {
    /* eşleşen süreç yoksa sorun değil */
  }
  for (const name of ['lockfile', 'DevToolsActivePort', 'SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try {
      fs.rmSync(path.join(SESSION_PROFILE, name), { force: true });
    } catch {
      /* kilit dosyası yok */
    }
  }
};

const SESSION_DIR = process.env.WHATSAPP_SESSION_DIR
  ? path.resolve(process.env.WHATSAPP_SESSION_DIR)
  : path.join(__dirname, '..', '.wwebjs_auth');
const SESSION_PROFILE = path.join(SESSION_DIR, 'session-nikbagstore');
const FROM_PHONE_DIGITS = '905543793235';
const MESSAGE_GAP_MS = () => 1000 + Math.floor(Math.random() * 1000);

const toTrDigits = (raw = '') => {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith('5')) digits = `90${digits}`;
  else if (digits.length === 13 && digits.startsWith('905')) digits = digits.slice(0, 12);
  return /^90\d{10}$/.test(digits) ? digits : '';
};

const expectedFromDigits = () =>
  toTrDigits(process.env.WHATSAPP_FROM_PHONE || process.env.WHATSAPP_NUMBER || FROM_PHONE_DIGITS) || FROM_PHONE_DIGITS;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatTry = (value) =>
  `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

const salePriceOf = (product = {}) => {
  const price = Number(product.price || 0);
  const discount = Number(product.discountPercentage || 0);
  if (discount <= 0) return Number(price.toFixed(2));
  return Number((price - (price * discount) / 100).toFixed(2));
};

const formatPhoneNumber = (raw = '') => {
  const digits = toTrDigits(raw);
  return digits ? `${digits}@c.us` : '';
};

const uniquePhones = (...values) => {
  const seen = new Set();
  return values
    .flat()
    .map((value) => formatPhoneNumber(value))
    .filter((chatId) => {
      if (!chatId || seen.has(chatId)) return false;
      seen.add(chatId);
      return true;
    });
};

let client = null;
let ready = false;
let starting = false;
let lastQr = '';
let connectedDigits = '';

const destroyClient = async () => {
  ready = false;
  starting = false;
  lastQr = '';
  connectedDigits = '';
  const current = client;
  client = null;
  if (!current) return;
  try {
    await current.destroy();
  } catch {
    /* oturum zaten kapalı olabilir */
  }
};

const ensureClient = () => {
  if (client) return client;

  const executablePath = resolveChromeExecutable();
  if (executablePath) {
    console.log('WhatsApp tarayıcı:', executablePath);
  } else {
    console.warn('Sistem Chrome yok; Puppeteer kendi Chrome’unu deneyecek.');
  }

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'nikbagstore',
      dataPath: SESSION_DIR
    }),
    puppeteer: {
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--no-zygote'
      ]
    }
  });

  client.on('qr', (qr) => {
    lastQr = qr;
    ready = false;
    console.log(`WhatsApp QR hazır. Panel > WhatsApp veya 0554 379 32 35 ile Bağlı cihazlar.`);
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    const connected = toTrDigits(client.info?.wid?.user || '');
    const expected = expectedFromDigits();
    connectedDigits = connected;
    if (connected && connected !== expected) {
      ready = false;
      console.error(
        `WhatsApp yanlış hesap bağlı (${connected}). Mesajlar ${expected} numarasından gidecek. server/.wwebjs_auth silinip o telefonla QR tarayın.`
      );
      return;
    }
    lastQr = '';
    ready = true;
    console.log(`WhatsApp bağlandı (whatsapp-web.js). Gönderen: ${connected || expected}`);
    flushPending().catch((error) => console.error('WhatsApp kuyruk hatası:', error.message));
  });

  client.on('authenticated', () => {
    console.log('WhatsApp oturumu kaydedildi (LocalAuth).');
  });

  client.on('auth_failure', (message) => {
    ready = false;
    console.error('WhatsApp kimlik doğrulama hatası:', message);
  });

  client.on('disconnected', (reason) => {
    console.warn('WhatsApp bağlantısı koptu:', reason);
    destroyClient()
      .then(() => {
        setTimeout(() => {
          initWhatsApp().catch((error) => {
            console.error('WhatsApp yeniden bağlanamadı:', error.message);
          });
        }, 4000);
      })
      .catch(() => {});
  });

  return client;
};

const initWhatsApp = async () => {
  if (process.env.WHATSAPP_DISABLED === '1') {
    console.log('WhatsApp bildirimleri kapalı (WHATSAPP_DISABLED=1).');
    return;
  }
  if (starting || ready) return;
  starting = true;
  releaseSessionBrowser();
  try {
    const wa = ensureClient();
    await wa.initialize();
  } catch (error) {
    const busy = /already running/i.test(error.message || '');
    if (busy) {
      client = null;
      releaseSessionBrowser();
      await sleep(1500);
      try {
        const wa = ensureClient();
        await wa.initialize();
        return;
      } catch (retryError) {
        starting = false;
        client = null;
        console.error('WhatsApp başlatılamadı:', retryError.message);
        return;
      }
    }
    starting = false;
    client = null;
    console.error('WhatsApp başlatılamadı:', error.message);
  }
};

const sendText = async (phone, text) => {
  const chatId = formatPhoneNumber(phone);
  if (!chatId || !text) return false;
  if (!ready || !client) {
    pendingSends.push({ chatId, text });
    console.warn('WhatsApp hazır değil, mesaj kuyruğa alındı:', chatId);
    return false;
  }
  await client.sendMessage(chatId, text);
  console.log('WhatsApp mesajı gitti:', chatId);
  return true;
};

const pendingSends = [];

const flushPending = async () => {
  while (pendingSends.length && ready && client) {
    const job = pendingSends.shift();
    try {
      await client.sendMessage(job.chatId, job.text);
      console.log('WhatsApp kuyruk mesajı gitti:', job.chatId);
    } catch (error) {
      console.error('WhatsApp kuyruk gönderimi:', error.message);
    }
    if (pendingSends.length) await sleep(MESSAGE_GAP_MS());
  }
};

const waitUntilReady = (timeoutMs = 180000) =>
  new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (ready && client) {
        resolve(true);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('WhatsApp 3 dakikada bağlanmadı. Terminaldeki QR’ı 0554 379 32 35 ile tarayın.'));
        return;
      }
      setTimeout(tick, 500);
    };
    tick();
  });

const notifyNewOrder = async ({
  orderId,
  customerName,
  customerPhone,
  items = [],
  totalPrice,
  sellerPhone,
  sellerPhones = [],
  superAdminPhone
} = {}) => {
  try {
    const lines = (items || []).map((item) => {
      const qty = Number(item.quantity || 1);
      const name = item.name || item.title || 'Ürün';
      const lineTotal = Number(item.price || 0) * qty;
      return `• ${qty}x ${name} — ${formatTry(lineTotal)}`;
    }).join('\n');

    const message = [
      '🛒 *Yeni sipariş alındı*',
      '',
      `*Sipariş:* ${orderId}`,
      `*Müşteri:* ${customerName || '—'}`,
      `*Telefon:* ${customerPhone || '—'}`,
      '',
      '*Sepet:*',
      lines || '• (kalem yok)',
      '',
      `*Toplam:* *${formatTry(totalPrice)}*`
    ].join('\n');

    const targets = uniquePhones(
      sellerPhones,
      sellerPhone,
      superAdminPhone,
      process.env.SELLER_PHONE,
      process.env.SUPER_ADMIN_PHONE,
      expectedFromDigits()
    );

    if (!targets.length) {
      console.warn('WhatsApp sipariş bildirimi: gönderilecek telefon yok.');
      return;
    }

    for (const chatId of targets) {
      await sendText(chatId, message);
      if (targets.length > 1) await sleep(MESSAGE_GAP_MS());
    }
  } catch (error) {
    console.error('notifyNewOrder hatası:', error.message);
  }
};

const statusCopy = (status, cargoTrackingCode) => {
  const key = String(status || '').toLowerCase();
  if (key === 'processing' || key === 'hazirlaniyor') {
    return { title: 'HAZIRLANIYOR', body: 'Siparişin atölyede hazırlanmaya başladı.' };
  }
  if (key === 'shipped' || key === 'kargoda') {
    const track = String(cargoTrackingCode || '').trim();
    return {
      title: 'KARGODA',
      body: track
        ? `Siparişin kargoya verildi.\n*Takip kodu:* ${track}`
        : 'Siparişin kargoya verildi.'
    };
  }
  if (key === 'cancelled' || key === 'iptal') {
    return { title: 'İPTAL', body: 'Siparişin iptal edildi. Sorun olursa bize yazabilirsin.' };
  }
  if (key === 'delivered' || key === 'teslim') {
    return { title: 'TESLİM EDİLDİ', body: 'Siparişin teslim edildi. Keyifle kullanmanı dileriz.' };
  }
  return { title: String(status || 'GÜNCELLENDİ').toUpperCase(), body: 'Sipariş durumunda bir güncelleme var.' };
};

const notifyOrderStatusUpdate = async ({
  customerPhone,
  customerName,
  orderId,
  status,
  cargoTrackingCode
} = {}) => {
  try {
    const copy = statusCopy(status, cargoTrackingCode);
    const greeting = customerName ? `Merhaba ${customerName} 👋` : 'Merhaba 👋';
    const message = [
      greeting,
      '',
      `*${orderId}* numaralı siparişinin durumu güncellendi.`,
      '',
      `Durum: *${copy.title}*`,
      copy.body
    ].join('\n');

    await sendText(customerPhone, message);
  } catch (error) {
    console.error('notifyOrderStatusUpdate hatası:', error.message);
  }
};

const notifyDiscountToUsers = async ({
  users = [],
  productName,
  oldPrice,
  newPrice,
  productUrl
} = {}) => {
  try {
    const phones = uniquePhones(users);
    const message = [
      '💫 Favorindeki ürün *indirime* girdi!',
      '',
      `*${productName || 'Ürün'}*`,
      `~${formatTry(oldPrice)}~ → *${formatTry(newPrice)}*`,
      productUrl ? `\n${productUrl}` : ''
    ].filter(Boolean).join('\n');

    for (let i = 0; i < phones.length; i += 1) {
      await sendText(phones[i], message);
      if (i < phones.length - 1) await sleep(MESSAGE_GAP_MS());
    }
  } catch (error) {
    console.error('notifyDiscountToUsers hatası:', error.message);
  }
};

const notifyFavoritesIfDiscounted = async (product, previous = {}) => {
  try {
    if (!product?._id) return;
    const oldPrice = salePriceOf(previous);
    const newPrice = salePriceOf(product);
    if (!(newPrice < oldPrice - 0.009)) return;

    const fans = await User.find({
      favoriler: product._id,
      telefon: { $nin: [null, ''] }
    }).select('telefon').lean();

    const users = fans.map((user) => user.telefon).filter(Boolean);
    if (!users.length) return;

    await notifyDiscountToUsers({
      users,
      productName: product.title,
      oldPrice,
      newPrice,
      productUrl: `${siteUrl()}/urun/${product.slug || product._id}`
    });
  } catch (error) {
    console.error('notifyFavoritesIfDiscounted hatası:', error.message);
  }
};

const getWhatsAppStatus = () => ({
  ready,
  from: expectedFromDigits(),
  connected: connectedDigits || '',
  qr: lastQr || '',
  pending: pendingSends.length
});

module.exports = {
  initWhatsApp,
  waitUntilReady,
  sendText,
  destroyClient,
  getWhatsAppStatus,
  formatPhoneNumber,
  salePriceOf,
  notifyNewOrder,
  notifyOrderStatusUpdate,
  notifyDiscountToUsers,
  notifyFavoritesIfDiscounted
};
