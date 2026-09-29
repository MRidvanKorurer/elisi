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

const parseFrom = (from) => {
  const match = String(from || '').match(/^(.*)<([^>]+)>\s*$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, '') || 'Nik Bag',
      email: match[2].trim()
    };
  }
  return { name: 'Nik Bag', email: String(from || '').trim() };
};

const brevoKey = () => clean(process.env.BREVO_API_KEY);

const lookupIpv4 = (host) => new Promise((resolve, reject) => {
  dns.lookup(host, { family: 4, all: true }, (error, rows) => {
    if (error) reject(error);
    else resolve((rows || []).map((row) => row.address).filter(Boolean));
  });
});

const sendViaBrevo = async ({ to, subject, html, text }) => {
  const sender = parseFrom(smtpConfig().from);
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoKey(),
      accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: sender.name, email: sender.email },
      to: [{ email: to }],
      subject,
      htmlContent: html || text,
      textContent: text || subject
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.code || `Brevo ${res.status}`);
};

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

const verifySmtp = async () => {
  const { user, from, pass } = smtpConfig();
  console.log('E-posta gönderen:', from || user, '| SMTP', Boolean(user && pass), '| Brevo', Boolean(brevoKey()));
  return Boolean((user && pass) || brevoKey());
};

const sendMail = async ({ to, subject, html, text }) => {
  const address = String(to || '').trim();
  if (!address) return false;
  const errors = [];
  if (brevoKey()) {
    try {
      await sendViaBrevo({ to: address, subject, html, text });
      console.log('E-posta gitti:', subject, '→', address);
      return true;
    } catch (error) {
      errors.push(`Brevo: ${error.message}`);
    }
  }
  try {
    await sendViaSmtp({ to: address, subject, html, text });
    return true;
  } catch (error) {
    errors.push(`SMTP: ${error.message}`);
  }
  console.error('E-posta gönderilemedi:', subject, '→', address, errors.join(' || '));
  return false;
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
  adminEmail
} = {}) => {
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
    jobs.push({ to: email, ...templates.sellerSold({ sellerName: group.sellerName, orderId, buyerName, items: group.items }) });
    jobs.push({
      to: adminEmail || process.env.SUPERADMIN_EMAIL || process.env.CONTACT_EMAIL,
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
      to: adminEmail || process.env.SUPERADMIN_EMAIL || process.env.CONTACT_EMAIL,
      ...templates.adminSale({
        sellerName: 'Satıcı',
        productName: productLabel(items),
        buyerName,
        orderId
      })
    });
  }

  if (buyerEmail) {
    jobs.push({ to: buyerEmail, ...templates.buyerCreated({ buyerName, orderId }) });
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
  trackingCode
} = {}) => {
  if (!buyerEmail) return;
  const mail = templates.buyerStatus({ buyerName, orderId, status, trackingCode });
  dispatch([{ to: buyerEmail, ...mail }]);
};

module.exports = {
  sendMail,
  verifySmtp,
  notifyOrderCreated,
  notifyOrderStatusChanged
};
