const nodemailer = require('nodemailer');
const templates = require('./emailTemplates');

let transporter;

const clean = (value) => String(value || '').trim().replace(/^['"]|['"]$/g, '');

const smtpConfig = () => {
  const host = clean(process.env.SMTP_HOST);
  const user = clean(process.env.SMTP_USER);
  const pass = clean(process.env.SMTP_PASS).replace(/\s+/g, '');
  const from = clean(process.env.EMAIL_FROM) || (user.includes('@') ? `Nik Bag <${user}>` : '');
  const port = Number(clean(process.env.SMTP_PORT) || 587);
  return { host, user, pass, from, port };
};

const smtpReady = () => {
  const { host, user, pass, from } = smtpConfig();
  return Boolean(host && user && pass && from);
};

const mailer = () => {
  if (!smtpReady()) return null;
  if (!transporter) {
    const { host, user, pass, port } = smtpConfig();
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: { minVersion: 'TLSv1.2' }
    });
  }
  return transporter;
};

const verifySmtp = async () => {
  const { host, user, from, pass } = smtpConfig();
  if (!smtpReady()) {
    console.warn('E-posta kapalı. Eksik:', {
      SMTP_HOST: Boolean(host),
      SMTP_USER: Boolean(user),
      SMTP_PASS: Boolean(pass),
      EMAIL_FROM: Boolean(from)
    });
    return false;
  }
  try {
    await mailer().verify();
    console.log('SMTP girişi tamam:', user, '→', from);
    return true;
  } catch (error) {
    console.error('SMTP girişi başarısız:', error.message);
    return false;
  }
};

const sendMail = async ({ to, subject, html, text }) => {
  const address = String(to || '').trim();
  if (!address) return false;
  const transport = mailer();
  const { from } = smtpConfig();
  if (!transport) {
    console.warn('E-posta kapalı (SMTP env yok):', subject, '→', address);
    return false;
  }
  await transport.sendMail({
    from,
    to: address,
    subject,
    text,
    html
  });
  console.log('E-posta gitti:', subject, '→', address);
  return true;
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
