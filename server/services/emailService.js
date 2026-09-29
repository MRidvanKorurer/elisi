const templates = require('./emailTemplates');

const clean = (value) => String(value || '').trim().replace(/^['"]|['"]$/g, '');

const smtpConfig = () => {
  const user = clean(process.env.SMTP_USER);
  const from = clean(process.env.EMAIL_FROM) || (user.includes('@') ? `Nik Bag <${user}>` : 'Nik Bag <nikbagofficial@gmail.com>');
  return { user, from };
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
  if (!res.ok) {
    throw new Error(data.message || data.code || `Brevo ${res.status}`);
  }
};

const verifySmtp = async () => {
  const { user, from } = smtpConfig();
  if (brevoKey()) {
    console.log('E-posta Brevo HTTPS ile gidecek. Gönderen:', from || user);
    return true;
  }
  console.warn('Render 587 portunu kapattığı için Gmail SMTP zaman aşımına düşer. BREVO_API_KEY ekleyin.');
  return false;
};

const sendMail = async ({ to, subject, html, text }) => {
  const address = String(to || '').trim();
  if (!address) return false;
  if (!brevoKey()) {
    console.warn('E-posta gönderilmedi (BREVO_API_KEY yok):', subject, '→', address);
    return false;
  }
  await sendViaBrevo({ to: address, subject, html, text });
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
