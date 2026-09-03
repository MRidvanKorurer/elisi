const Iyzipay = require('iyzipay');

const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY || 'sandbox-LTfWvG80f4fA9Yt5L5v0C665wBw7z4m1', // İyzico panelinden alacaksın
    secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-XF1uWfTqG3U9cR0j8o3D8kR2hF2qE9x0',
    uri: 'https://sandbox-api.iyzipay.com'
});

module.exports = iyzipay;