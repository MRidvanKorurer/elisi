const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const layout = ({ title, body }) => `<!doctype html>
<html lang="tr">
  <body style="margin:0;background:#f6f3ee;font-family:Georgia,serif;color:#1c2430;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;padding:28px;">
          <tr><td>
            <p style="margin:0 0 8px;letter-spacing:.12em;font-size:12px;color:#8a7358;">NIK BAG</p>
            <h1 style="margin:0 0 16px;font-size:22px;">${escapeHtml(title)}</h1>
            ${body}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const paragraph = (text) => `<p style="margin:0 0 12px;line-height:1.5;">${escapeHtml(text)}</p>`;

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
    pending: 'Beklemede'
  };
  return map[key] || String(status || 'Güncellendi');
};

const itemLines = (items = []) => (items || []).map((item) => {
  const qty = Number(item.quantity || 1);
  const name = item.name || item.title || 'Ürün';
  return `${qty}x ${name}`;
});

const sellerSold = ({ sellerName, orderId, buyerName, items }) => {
  const products = itemLines(items).join(', ') || 'ürün';
  const text = `${sellerName || 'Satıcı'}, ürününüz satıldı. Lütfen siparişinizi kontrol edin. Sipariş: ${orderId}. Alıcı: ${buyerName || '—'}. Ürünler: ${products}.`;
  return {
    subject: 'Ürününüz satıldı',
    text,
    html: layout({
      title: 'Ürününüz satıldı',
      body: `${paragraph('Ürününüz satıldı, lütfen siparişinizi kontrol edin.')}${paragraph(`Sipariş: ${orderId}`)}${paragraph(`Alıcı: ${buyerName || '—'}`)}${paragraph(`Ürünler: ${products}`)}`
    })
  };
};

const buyerCreated = ({ buyerName, orderId }) => {
  const text = `${buyerName || 'Merhaba'}, siparişiniz başarıyla oluşturulmuştur. Sipariş numarası: ${orderId}.`;
  return {
    subject: 'Siparişiniz oluşturuldu',
    text,
    html: layout({
      title: 'Siparişiniz oluşturuldu',
      body: `${paragraph(`${buyerName || 'Merhaba'}, siparişiniz başarıyla oluşturulmuştur.`)}${paragraph(`Sipariş numarası: ${orderId}`)}`
    })
  };
};

const adminSale = ({ sellerName, productName, buyerName, orderId }) => {
  const text = `${sellerName || 'Satıcı'} isimli satıcının ${productName || 'ürün'} ürünü, ${buyerName || 'alıcı'} kullanıcısı tarafından satın alınmıştır. Sipariş: ${orderId}.`;
  return {
    subject: 'Yeni satış bildirimi',
    text,
    html: layout({
      title: 'Yeni satış',
      body: paragraph(text)
    })
  };
};

const buyerStatus = ({ buyerName, orderId, status, trackingCode }) => {
  const label = statusLabel(status);
  const track = trackingCode ? ` Takip kodu: ${trackingCode}.` : '';
  const text = `${buyerName || 'Merhaba'}, siparişinizin durumu ${label} olarak güncellenmiştir. Sipariş: ${orderId}.${track}`;
  return {
    subject: `Sipariş durumu: ${label}`,
    text,
    html: layout({
      title: 'Sipariş durumu güncellendi',
      body: `${paragraph(`${buyerName || 'Merhaba'}, siparişinizin durumu ${label} olarak güncellenmiştir.`)}${paragraph(`Sipariş: ${orderId}`)}${trackingCode ? paragraph(`Takip kodu: ${trackingCode}`) : ''}`
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
