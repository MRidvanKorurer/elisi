const dns = require('dns');
const nodemailer = require('nodemailer');
const templates = require('./emailTemplates');

const clean = (value) => String(value || '').trim().replace(/^['"]|['"]$/g, '');

const smtpConfig = () => {
  const user = clean(process.env.SMTP_USER);
  const pass = clean(process.env.SMTP_PASS).replace(/\s+/g, '');
  const from = clean(process.env.EMAIL_FROM) || (user.includes('@') ? `Nik Bag <${user}>` : 'Nik Bag <nikbagofficial@gmail.com>');
  const host = clean(process.env.SMTP_HOST) || 'smtp.gmail.com';
  return { host, user, pass, from };
};

const gmailReady = () => Boolean(
  clean(process.env.GMAIL_CLIENT_ID)
  && clean(process.env.GMAIL_CLIENT_SECRET)
  && clean(process.env.GMAIL_REFRESH_TOKEN)
);

let cachedAccessToken = '';
let cachedAccessTokenAt = 0;

const gmailAccessToken = async () => {
  if (cachedAccessToken && Date.now() - cachedAccessTokenAt < 45 * 60 * 1000) return cachedAccessToken;
  const body = new URLSearchParams({
    client_id: clean(process.env.GMAIL_CLIENT_ID),
    client_secret: clean(process.env.GMAIL_CLIENT_SECRET),
    refresh_token: clean(process.env.GMAIL_REFRESH_TOKEN),
    grant_type: 'refresh_token'
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Gmail oturumu yenilenemedi');
  }
  cachedAccessToken = data.access_token;
  cachedAccessTokenAt = Date.now();
  return cachedAccessToken;
};

const encodeRaw = (message) => Buffer.from(message)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

const sendViaGmail = async ({ to, subject, html, text }) => {
  const from = smtpConfig().from;
  const mime = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html || text || subject
  ].join('\r\n');
  const token = await gmailAccessToken();
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodeRaw(mime) })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `Gmail ${res.status}`);
};

const verifySmtp = async () => {
  const { from, user } = smtpConfig();
  if (gmailReady()) {
    console.log('E-posta Gmail API ile gidecek. Gönderen:', from || user);
    return true;
  }
  console.warn('E-posta için GOOGLE_CLIENT_SECRET ve GMAIL_REFRESH_TOKEN gerekli. SMTP portları Render’da kapalı.');
  return false;
};

const sendMail = async ({ to, subject, html, text }) => {
  const address = String(to || '').trim();
  if (!address) return false;
  if (gmailReady()) {
    try {
      await sendViaGmail({ to: address, subject, html, text });
      console.log('E-posta gitti:', subject, '→', address);
      return true;
    } catch (error) {
      console.error('E-posta gönderilemedi:', subject, '→', address, error.message);
      return false;
    }
  }
  if (process.env.RENDER === 'true') {
    console.error('E-posta gönderilemedi:', subject, '→', address, 'Gmail API anahtarı yok (GMAIL_REFRESH_TOKEN).');
    return false;
  }
  try {
    await sendViaSmtp({ to: address, subject, html, text });
    return true;
  } catch (error) {
    console.error('E-posta gönderilemedi:', subject, '→', address, error.message);
    return false;
  }
};

const lookupIpv4 = (host) => new Promise((resolve, reject) => {
  dns.lookup(host, { family: 4, all: true }, (error, rows) => {
    if (error) reject(error);
    else resolve((rows || []).map((row) => row.address).filter(Boolean));
  });
});

const sendViaSmtp = async ({ to, subject, html, text }) => {
  const { host, user, pass, from } = smtpConfig();
  if (!user || !pass) throw new Error('SMTP_USER veya SMTP_PASS yok');
  const addresses = await lookupIpv4(host);
  if (!addresses.length) throw new Error('Gmail IPv4 adresi bulunamadı');
  const ports = [587, 465];
  const errors = [];
  for (const address of addresses) {
    for (const port of ports) {
      const transport = nodemailer.createTransport({
        host: address,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        family: 4,
        auth: { user, pass },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
        socketTimeout: 20000,
        tls: { servername: host, minVersion: 'TLSv1.2' }
      });
      try {
        await transport.sendMail({ from, to, subject, text, html });
        console.log('E-posta SMTP ile gitti:', `${address}:${port}`, '→', to);
        return true;
      } catch (error) {
        errors.push(`${address}:${port} ${error.message}`);
      } finally {
        transport.close();
      }
    }
  }
  throw new Error(errors.join(' | ') || 'SMTP bağlantısı kurulamadı');
};

const dispatch = (jobs) => {
  setImmediate(() => {
    Promise.all(jobs.map(async (job) => {
      try {
        await sendMail(job);
      } catch (error) {
        console.error('E-posta gönderilemedi:', job.subject, error.message);
      }
    })).catch((error) => console.error('E-posta kuyruğu:', error.message));
  });
};

const SUPER_ADMIN_EMAIL = 'nikbagadmin@gmail.com';

const superAdminEmail = (explicit) =>
  String(explicit || process.env.SUPERADMIN_EMAIL || SUPER_ADMIN_EMAIL).trim();

const productLabel = (items = []) => {
  const names = [...new Set((items || []).map((item) => item.name || item.title).filter(Boolean))];
  if (!names.length) return 'ürün';
  if (names.length === 1) return names[0];
  return names.join(', ');
};

const notifyOrderCreated = ({
  orderId,
  buyerName,
  buyerEmail,
  sellers = [],
  items = [],
  total,
  paymentCode,
  adminEmail
} = {}) => {
  const admin = superAdminEmail(adminEmail);
  const jobs = [];
  const groups = new Map();
  (sellers || []).forEach((seller) => {
    if (!seller?.email) return;
    const ownItems = (items || []).filter((item) => String(item.seller || '') === String(seller.id || ''));
    groups.set(seller.email, {
      sellerName: seller.name || 'Satıcı',
      items: ownItems.length ? ownItems : items
    });
  });

  groups.forEach((group, email) => {
    jobs.push({ to: email, ...templates.sellerSold({ sellerName: group.sellerName, orderId, buyerName, items: group.items, total }) });
    jobs.push({
      to: admin,
      ...templates.adminSale({
        sellerName: group.sellerName,
        productName: productLabel(group.items),
        buyerName,
        orderId
      })
    });
  });

  if (!groups.size) {
    jobs.push({
      to: admin,
      ...templates.adminSale({
        sellerName: 'Satıcı',
        productName: productLabel(items),
        buyerName,
        orderId
      })
    });
  }

  if (buyerEmail) {
    jobs.push({ to: buyerEmail, ...templates.buyerCreated({ buyerName, orderId, items, total, paymentCode }) });
  }

  const pending = jobs.filter((job) => job.to);
  console.log('Sipariş e-postası kuyruğu:', pending.map((job) => `${job.subject} → ${job.to}`).join(' | ') || 'alıcı yok');
  dispatch(pending);
};

const notifyOrderStatusChanged = ({
  buyerEmail,
  buyerName,
  orderId,
  status,
  trackingCode,
  adminEmail
} = {}) => {
  const jobs = [];
  if (buyerEmail) {
    jobs.push({ to: buyerEmail, ...templates.buyerStatus({ buyerName, orderId, status, trackingCode }) });
  }
  const admin = superAdminEmail(adminEmail);
  if (admin) {
    jobs.push({ to: admin, ...templates.adminStatus({ buyerName, orderId, status, trackingCode }) });
  }
  dispatch(jobs.filter((job) => job.to));
};

const notifyAdminSignup = ({ kind, name, email, phone, shop } = {}) => {
  const admin = superAdminEmail();
  if (!admin) return;
  dispatch([{ to: admin, ...templates.adminSignup({ kind, name, email, phone, shop }) }]);
};

const notifyPaymentReminder = ({ buyerEmail, buyerName, paymentCode, total } = {}) => {
  if (!buyerEmail) return;
  dispatch([{ to: buyerEmail, ...templates.paymentReminder({ buyerName, paymentCode, total }) }]);
};

const notifyPaymentExpired = ({ buyerEmail, buyerName, paymentCode } = {}) => {
  const jobs = [];
  if (buyerEmail) jobs.push({ to: buyerEmail, ...templates.paymentExpired({ buyerName, paymentCode }) });
  const admin = superAdminEmail();
  if (admin) {
    jobs.push({
      to: admin,
      ...templates.adminStatus({
        buyerName,
        orderId: paymentCode,
        status: 'cancelled'
      })
    });
  }
  dispatch(jobs);
};

module.exports = {
  sendMail,
  verifySmtp,
  notifyOrderCreated,
  notifyOrderStatusChanged,
  notifyAdminSignup,
  notifyPaymentReminder,
  notifyPaymentExpired
};
