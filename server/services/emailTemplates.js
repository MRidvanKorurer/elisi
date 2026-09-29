const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const site = () => String(process.env.CLIENT_URL || process.env.SITE_URL || 'https://nikbagstore.com').replace(/\/$/, '');
const logoUrl = () => `${site()}/logo.svg`;

const money = (value) =>
  `${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;

const layout = ({ title, intro, rows, note }) => `<!doctype html>
<html lang="tr">
  <body style="margin:0;background:#f6f1ea;font-family:Georgia,serif;color:#1c2430;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border-radius:18px;overflow:hidden;">
          <tr><td style="padding:28px 28px 8px;" align="center">
            <img src="${logoUrl()}" alt="Nik Bag" width="180" style="display:block;border:0;height:auto;max-width:180px;" />
          </td></tr>
          <tr><td style="padding:8px 28px 0;">
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapeHtml(title)}</h1>
            <p style="margin:0 0 18px;line-height:1.55;color:#3d4654;">${escapeHtml(intro)}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eadfd2;">
              ${rows}
            </table>
            <p style="margin:18px 0 0;line-height:1.55;color:#3d4654;">${escapeHtml(note)}</p>
            <p style="margin:22px 0 28px;">
              <a href="${site()}" style="color:#936e6d;font-weight:700;text-decoration:none;">nikbagstore.com</a>
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const row = (label, value) => `<tr>
  <td style="padding:10px 0;color:#8a7358;font-size:13px;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
  <td style="padding:10px 0;font-size:15px;vertical-align:top;">${escapeHtml(value)}</td>
</tr>`;

const statusLabel = (status) => {
  const key = String(status || '').toLowerCase();
  const map = {
    processing: 'Hazırlanıyor',
    hazirlaniyor: 'Hazırlanıyor',
    shipped: 'Kargoya verildi',
    kargoda: 'Kargoya verildi',
    delivered: 'Teslim edildi',
    teslim: 'Teslim edildi',
    cancelled: 'İptal edildi',
    iptal: 'İptal edildi',
    pending: 'Ödeme bekleniyor'
  };
  return map[key] || String(status || 'Güncellendi');
};

const itemLines = (items = []) => (items || []).map((item) => {
  const qty = Number(item.quantity || 1);
  const name = item.name || item.title || 'Ürün';
  const price = item.price != null ? ` (${money(Number(item.price) * qty)})` : '';
  return `${qty} adet ${name}${price}`;
});

const rowHtml = (label, html) => `<tr>
  <td style="padding:10px 0;color:#8a7358;font-size:13px;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
  <td style="padding:10px 0;font-size:15px;line-height:1.5;vertical-align:top;">${html}</td>
</tr>`;

const productHtml = (items = []) => itemLines(items).map((line) => escapeHtml(line)).join('<br>') || 'Ürün bilgisi yok';

const sellerSold = ({ sellerName, orderId, buyerName, items, total }) => {
  const products = itemLines(items).join(', ') || 'Ürün bilgisi yok';
  const text = [
    `${sellerName || 'Merhaba'}, mağazanızdan yeni bir sipariş alındı.`,
    'Ürünü hazırlayıp panelden sipariş durumunu güncelleyin.',
    `Sipariş no: ${orderId}`,
    `Alıcı: ${buyerName || '—'}`,
    `Ürünler: ${products}`,
    total != null ? `Tutar: ${money(total)}` : ''
  ].filter(Boolean).join('\n');
  return {
    subject: `Yeni sipariş: ${orderId}`,
    text,
    html: layout({
      title: 'Mağazanızdan sipariş geldi',
      intro: `${sellerName || 'Merhaba'}, bir müşteri ürününüzü satın aldı. Siparişi panelden açıp hazırlamaya başlayın. Hazır olunca durumu güncelleyin; alıcıya ayrıca haber gider.`,
      rows: [
        row('Sipariş no', String(orderId)),
        row('Alıcı', buyerName || '—'),
        rowHtml('Ürünler', productHtml(items)),
        total != null ? row('Tutar', money(total)) : ''
      ].join(''),
      note: 'Ödeme havale ise, ödeme onayını bekleyip sonra kargoya verin.'
    })
  };
};

const buyerCreated = ({ buyerName, orderId, items, total }) => {
  const products = itemLines(items).join(', ') || 'Ürün bilgisi yok';
  const text = [
    `${buyerName || 'Merhaba'}, siparişiniz alındı.`,
    `Sipariş no: ${orderId}`,
    `Ürünler: ${products}`,
    total != null ? `Toplam: ${money(total)}` : '',
    'Havale ile ödediyseniz açıklamaya sipariş numarasını yazın. Atölye hazırlayınca durum maili gelir.'
  ].filter(Boolean).join('\n');
  return {
    subject: `Siparişiniz alındı (${orderId})`,
    text,
    html: layout({
      title: 'Siparişiniz oluşturuldu',
      intro: `${buyerName || 'Merhaba'}, siparişiniz Nik Bag’e ulaştı. Atölye ürünü hazırlamaya başladığında size yeniden yazacağız.`,
      rows: [
        row('Sipariş no', String(orderId)),
        rowHtml('Ürünler', productHtml(items)),
        total != null ? row('Toplam', money(total)) : ''
      ].join(''),
      note: 'Havale veya EFT yaptıysanız açıklama kısmına bu sipariş numarasını yazın. Böylece ödemeniz eşleşir.'
    })
  };
};

const adminSale = ({ sellerName, productName, buyerName, orderId }) => {
  const text = `${sellerName || 'Satıcı'} isimli satıcının ${productName || 'ürün'} ürünü, ${buyerName || 'alıcı'} tarafından satın alındı. Sipariş no: ${orderId}.`;
  return {
    subject: `Yeni satış: ${sellerName || 'Satıcı'}`,
    text,
    html: layout({
      title: 'Yeni satış bildirimi',
      intro: 'Mağazada yeni bir sipariş oluştu. Satıcı ve alıcıya da ayrı mail gitti.',
      rows: [
        row('Satıcı', sellerName || '—'),
        row('Ürün', productName || '—'),
        row('Alıcı', buyerName || '—'),
        row('Sipariş no', String(orderId))
      ].join(''),
      note: 'Ayrıntı için yönetim panelindeki sipariş listesine bakın.'
    })
  };
};

const buyerStatus = ({ buyerName, orderId, status, trackingCode }) => {
  const label = statusLabel(status);
  const track = trackingCode ? ` Takip kodu: ${trackingCode}.` : '';
  const text = `${buyerName || 'Merhaba'}, ${orderId} numaralı siparişinizin durumu ${label} olarak güncellendi.${track}`;
  return {
    subject: `Siparişiniz ${label}`,
    text,
    html: layout({
      title: `Siparişiniz ${label}`,
      intro: `${buyerName || 'Merhaba'}, ${orderId} numaralı siparişinizin durumu güncellendi.`,
      rows: [
        row('Sipariş no', String(orderId)),
        row('Yeni durum', label),
        trackingCode ? row('Takip kodu', trackingCode) : ''
      ].join(''),
      note: label === 'Kargoya verildi'
        ? 'Kargo firmasının sitesinde takip koduyla gönderinizi izleyebilirsiniz.'
        : 'Başka bir değişiklik olursa yine mail göndereceğiz.'
    })
  };
};

module.exports = {
  sellerSold,
  buyerCreated,
  adminSale,
  buyerStatus,
  statusLabel
};
