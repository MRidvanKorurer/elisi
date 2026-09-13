const Iyzipay = require('iyzipay');
const { isProd } = require('../utils/runtime');

const SANDBOX_URI = 'https://sandbox-api.iyzipay.com';
const SANDBOX_KEY = 'sandbox-LTfWvG80f4fA9Yt5L5v0C665wBw7z4m1';
const SANDBOX_SECRET = 'sandbox-XF1uWfTqG3U9cR0j8o3D8kR2hF2qE9x0';

const uri = process.env.IYZICO_BASE_URL || (isProd() ? 'https://api.iyzipay.com' : SANDBOX_URI);

const apiKey = process.env.IYZICO_API_KEY || (isProd() ? '' : SANDBOX_KEY);
const secretKey = process.env.IYZICO_SECRET_KEY || (isProd() ? '' : SANDBOX_SECRET);

let client = null;
if (apiKey && secretKey) {
  client = new Iyzipay({ apiKey, secretKey, uri });
} else {
  console.error('İyzico anahtarları yok. Kart ödemesi kapalı; diğer API çalışır.');
}

const missing = () => {
  const error = new Error('İyzico yapılandırılmamış.');
  error.status = 503;
  return error;
};

module.exports = {
  get checkoutFormInitialize() {
    if (!client) throw missing();
    return client.checkoutFormInitialize;
  },
  get checkoutForm() {
    if (!client) throw missing();
    return client.checkoutForm;
  }
};
