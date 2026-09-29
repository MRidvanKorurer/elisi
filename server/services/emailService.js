const nodemailer = require('nodemailer');
const templates = require('./emailTemplates');

let transporter;

const smtpReady = () => Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM
);

const mailer = () => {
  if (!smtpReady()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '') === '1' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const address = String(to || '').trim();
  if (!address) return false;
  const transport = mailer();
  if (!transport) {
    console.warn('E-posta kapalı (SMTP env yok):', subject, '→', address);
    return false;
  }
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
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

  dispatch(jobs.filter((job) => job.to));
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
  notifyOrderCreated,
  notifyOrderStatusChanged
};
