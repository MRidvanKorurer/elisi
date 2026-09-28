const graphVersion = () => String(process.env.WHATSAPP_GRAPH_VERSION || 'v21.0').replace(/^\/*/, '');

const token = () =>
  String(process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_CLOUD_TOKEN || process.env.META_WHATSAPP_TOKEN || '').trim();

const phoneNumberId = () => String(process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();

const configured = () => Boolean(token() && phoneNumberId());

const toDigits = (raw = '') => {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = `90${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith('5')) digits = `90${digits}`;
  else if (digits.length === 13 && digits.startsWith('905')) digits = digits.slice(0, 12);
  return /^90\d{10}$/.test(digits) ? digits : '';
};

const sanitizeParam = (value) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 1024);
  return text || '-';
};

const templateName = (kind) => {
  if (kind === 'order') return String(process.env.WHATSAPP_TEMPLATE_ORDER || 'siparis_geldi').trim();
  if (kind === 'status') return String(process.env.WHATSAPP_TEMPLATE_STATUS || '').trim();
  if (kind === 'discount') return String(process.env.WHATSAPP_TEMPLATE_DISCOUNT || '').trim();
  if (kind === 'test') return String(process.env.WHATSAPP_TEMPLATE_TEST || '').trim();
  return '';
};

const graphSend = async (payload) => {
  const res = await fetch(
    `https://graph.facebook.com/${graphVersion()}/${phoneNumberId()}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        ...payload
      })
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = data.error || {};
    throw new Error(err.error_user_msg || err.message || `Meta WhatsApp ${res.status}`);
  }
  return data;
};

const sendTemplate = async (to, name, params = []) => {
  const language = String(process.env.WHATSAPP_TEMPLATE_LANG || 'tr').trim() || 'tr';
  return graphSend({
    to,
    type: 'template',
    template: {
      name,
      language: { code: language },
      components: params.length
        ? [{
          type: 'body',
          parameters: params.map((value) => ({ type: 'text', text: sanitizeParam(value) }))
        }]
        : undefined
    }
  });
};

const sendSessionText = async (to, text) =>
  graphSend({
    to,
    type: 'text',
    text: { preview_url: false, body: String(text || '').slice(0, 4096) }
  });

const send = async (phone, text, { kind, params } = {}) => {
  if (!configured()) throw new Error('Meta Cloud API anahtarları yok (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID).');
  const to = toDigits(phone);
  if (!to) throw new Error('WhatsApp alıcı numarası geçersiz.');
  const name = templateName(kind);
  if (name) {
    try {
      await sendTemplate(to, name, params && params.length ? params : [text]);
      return true;
    } catch (error) {
      const msg = error.message || '';
      if (!/template|132001|132000|133010/i.test(msg) && kind !== 'test') throw error;
      console.warn('WhatsApp şablon gönderilemedi, serbest metin deneniyor:', msg);
    }
  }
  await sendSessionText(to, text);
  return true;
};

module.exports = {
  configured,
  send,
  toDigits
};
