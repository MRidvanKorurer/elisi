const crypto = require('crypto');
const { clientUrl, isProd } = require('../utils/runtime');

const configured = () => Boolean(
  process.env.PAYTR_MERCHANT_ID
  && process.env.PAYTR_MERCHANT_KEY
  && process.env.PAYTR_MERCHANT_SALT
);

const clientIp = (req) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const raw = (forwarded || req.ip || '').replace(/^::ffff:/, '');
  const local = !raw || raw === '127.0.0.1' || raw === '::1' || raw.startsWith('10.') || raw.startsWith('192.168.') || raw.startsWith('172.');
  const ip = local ? (process.env.PAYTR_DEV_IP || raw) : raw;
  return String(ip || '').slice(0, 39);
};

const moneyText = (value) => Number(value || 0).toFixed(2);

const basketOf = (order) => {
  const rows = (order.orderItems || []).map((item) => [
    String(item.name || 'Ürün').slice(0, 80),
    moneyText(item.price),
    Number(item.quantity) || 1
  ]);
  if (Number(order.shippingCost) > 0) rows.push(['Kargo', moneyText(order.shippingCost), 1]);
  const sum = rows.reduce((total, row) => total + (Number(row[1]) * Number(row[2])), 0);
  const diff = Number((Number(order.totalPrice) - sum).toFixed(2));
  if (Math.abs(diff) >= 0.01) rows.push([diff < 0 ? 'İndirim' : 'Fark', moneyText(diff), 1]);
  return Buffer.from(JSON.stringify(rows)).toString('base64');
};

const createIframeToken = async ({ order, req }) => {
  if (!configured()) {
    const error = new Error('Kart ödemesi henüz tanımlı değil. PayTR mağaza bilgileri eksik.');
    error.status = 503;
    throw error;
  }

  const merchantId = String(process.env.PAYTR_MERCHANT_ID);
  const merchantKey = String(process.env.PAYTR_MERCHANT_KEY);
  const merchantSalt = String(process.env.PAYTR_MERCHANT_SALT);
  const testMode = process.env.PAYTR_TEST_MODE === '1' ? '1' : '0';
  const ip = clientIp(req);
  const email = String(order.customerInfo.email || '').slice(0, 100);
  const oid = `NB${order._id}`;
  const amount = String(Math.round(Number(order.totalPrice) * 100));
  const basket = basketOf(order);
  const noInstallment = '0';
  const maxInstallment = '0';
  const currency = 'TL';
  const hashSource = `${merchantId}${ip}${oid}${email}${amount}${basket}${noInstallment}${maxInstallment}${currency}${testMode}${merchantSalt}`;
  const paytrToken = crypto.createHmac('sha256', merchantKey).update(hashSource).digest('base64');
  const lang = req.lang === 'en' ? 'en' : 'tr';
  const store = clientUrl();
  const prefix = lang === 'en' ? '/en' : '';
  const body = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: ip,
    merchant_oid: oid,
    email,
    payment_amount: amount,
    paytr_token: paytrToken,
    user_basket: basket,
    debug_on: isProd() ? '0' : '1',
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`.trim().slice(0, 60),
    user_address: `${order.shippingAddress.address} ${order.shippingAddress.district} ${order.shippingAddress.city}`.trim().slice(0, 400),
    user_phone: String(order.customerInfo.phone || '').slice(0, 20),
    merchant_ok_url: `${store}${prefix}/siparis-basarili?orderId=${order._id}&method=credit_card`,
    merchant_fail_url: `${store}${prefix}/odeme-basarisiz?orderId=${order._id}&method=credit_card`,
    timeout_limit: '30',
    currency,
    test_mode: testMode,
    lang,
    iframe_v2: '1'
  });

  const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json().catch(() => ({}));
  if (data.status !== 'success' || !data.token) {
    const error = new Error(data.reason || 'PayTR ödeme formu açılamadı.');
    error.status = 502;
    throw error;
  }
  return data.token;
};

const callbackTrusted = (body = {}) => {
  const merchantKey = String(process.env.PAYTR_MERCHANT_KEY || '');
  const merchantSalt = String(process.env.PAYTR_MERCHANT_SALT || '');
  if (!merchantKey || !merchantSalt || !body.hash) return false;
  const source = `${body.merchant_oid}${merchantSalt}${body.status}${body.total_amount}`;
  const expected = crypto.createHmac('sha256', merchantKey).update(source).digest('base64');
  const left = Buffer.from(expected);
  const right = Buffer.from(String(body.hash));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const orderIdFromOid = (oid = '') => {
  const id = String(oid).replace(/^NB/, '');
  return /^[a-f0-9]{24}$/i.test(id) ? id : '';
};

module.exports = {
  configured,
  createIframeToken,
  callbackTrusted,
  orderIdFromOid
};
