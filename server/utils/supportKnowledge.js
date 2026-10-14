const KNOWLEDGE = `
Nik Bag (NikBag) el yapımı çanta, takı, seramik, mum ve ev dekorasyonu satan bir atölye pazarıdır.

KARGO
- 1000 ₺ ve üzeri siparişlerde kargo bedava.
- 1000 ₺ altındaki siparişlerde kargo 100 ₺.
- Stoklu / hemen kargoda ürünler sipariş onayından sonra 24 saat içinde kargoya verilir.
- Sipariş üzerine üretimde süre üründe yazar (genelde 1-3 iş günü, sonra kargo).

İADE
- Kullanılmamış ürünler 14 gün içinde iade edilebilir.
- Kişiye özel / sipariş üzerine üretimde iade, kullanılmamış ve kişiselleştirilmemiş ürünlerde geçerlidir.
- İade onayı ve kargo kodu insan destek (WhatsApp) üzerinden netleşir.

ÖDEME
- Kart ödemesi kapalı.
- Havale/EFT: sipariş sonrası banka bilgisi gösterilir; açıklamaya sipariş kodu yazılır.
- WhatsApp ile sipariş de mümkün.

SİPARİŞ
- Giriş yapan kullanıcı siparişlerini Profil > Siparişler'den görür.
- Bot sipariş iptal edemez, iade onaylayamaz, ödeme alamaz, kargo adresini değiştiremez.

SATICI
- Satıcı Ol sayfasından başvuru yapılır, inceleme sonrası onaylanır.
- Satıcı kendi gelen siparişlerinin üretim durumunu panelinden günceller.
- Platform payı, alıcının ödediği son tutarın %10’udur. Kargo ücreti varsa (ör. 300 ₺ ürün + 100 ₺ kargo) pay 40 ₺’dir. Kargo ücretsizse pay yalnızca ürün tutarındandır. Alıcı tek ödeme yapar; komisyon sitede kalır.
- Alıcı site IBAN’ına tüm tutarı yatırır (havale) veya WhatsApp ile sipariş iletir.

HESAP
- Kayıt/giriş /giris sayfasındadır.
- Adres ve kart profilde saklanır.
- Kayıt olan herkese kişisel %10 hoş geldin kodu verilir (NIK10-xxxxxx). Kod yalnızca o hesaba aittir, ilk siparişte ürün tutarına uygulanır, bir kez kullanılır. Profil ve ödeme sayfasında görünür.
- Süper adminin tanımladığı kampanya kodları (ör. 5.000 ₺ üzeri %5) tüm sepette geçerlidir. Satıcılar kendi panelinden yalnızca kendi ürünlerinde geçerli kod açabilir. Her iki tür de checkout’taki kampanya alanına yazılır.
`.trim();

const FAQS = [
  {
    keys: ['kargo', 'kargom', 'teslimat', 'ücretsiz kargo', 'ucretsiz kargo', 'shipping', 'ne zaman gelir'],
    answer: '1000 ₺ ve üzeri siparişlerde kargo bedava, altında 100 ₺. Stoklu ürünler onaydan sonra 24 saat içinde kargoya çıkar. Sipariş üzerine üretimde süre üründe yazar; üretim bitince kargo başlar.',
    keysEn: ['delivery', 'ship', 'arrive', 'free shipping'],
    answerEn: "Orders of 1,000 ₺ or more ship free; below that, shipping is 100 ₺. In-stock pieces ship within 24 hours of confirmation. Made-to-order pieces list their making time on the product page; shipping starts once the piece is finished."
  },
  {
    keys: ['iade', 'değişim', 'degisim', 'geri gönder', 'geri gonder', 'bozulan'],
    answer: 'Kullanılmamış ürünleri 14 gün içinde iade edebilirsin. Kişiye özel üretimde iade, kullanılmamış ve kişiselleştirilmemiş ürünlerde geçerlidir. İade kodu için WhatsApp’tan yazman yeterli.',
    keysEn: ['return', 'refund', 'exchange', 'send back'],
    answerEn: "You can return unused items within 14 days. For made-to-order pieces, returns apply to unused, non-personalized items. Message us on WhatsApp for a return code."
  },
  {
    keys: ['ödeme', 'odeme', 'kart', 'iyzico', 'havale', 'eft', 'taksit'],
    answer: 'Ödeme havale/EFT veya WhatsApp siparişi ile alınır. Havale/EFT’de sipariş kodunu açıklamaya yazarsın; ödeme görününce üretim başlar.',
    keysEn: ['payment', 'pay', 'card', 'bank transfer', 'wire', 'installment'],
    answerEn: "We accept bank transfer (EFT/wire) or orders placed on WhatsApp. For a transfer, add your order code to the description; making starts once the payment shows up."
  },
  {
    keys: ['sipariş', 'siparis', 'kargo takip', 'nerede', 'durum'],
    answer: 'Siparişini Profil > Siparişler’den takip edebilirsin. Giriş yaptıysan son sipariş özetini buradan da söyleyebilirim. İptal veya adres değişikliği için WhatsApp’tan insan destek gerekir.',
    keysEn: ['order', 'tracking', 'where is', 'status'],
    answerEn: "Track your order under Profile > Orders. If you're logged in, I can also give you a quick summary of your latest orders here. Cancellations or address changes need a person on WhatsApp."
  },
  {
    keys: ['satıcı', 'satici', 'mağaza aç', 'magaza ac', 'başvuru', 'basvuru', 'atelier', 'atölye', 'komisyon', 'platform pay', 'yüzde 8', 'yuzde 8', '%8'],
    answer: 'Satıcı Ol sayfasından başvur. Alıcı tek ödeme yapar; site komisyonu arka planda kalır. Pay, kargo dahil son tutarın %10’udur.',
    keysEn: ['seller', 'sell', 'open a shop', 'apply', 'commission'],
    answerEn: "Apply on the Sell on Nik Bag page. Buyers make a single payment; the site commission is handled in the background. The fee is 10% of the final amount, shipping included."
  },
  {
    keys: ['üretim', 'uretim', 'sipariş üzerine', 'hazırlanır', 'kaç gün', 'kac gun'],
    answer: 'Birçok parça sipariş üzerine üretilir. Süre üründe yazar; yoksa genelde 1-3 iş günü. Hemen kargoda işaretli ürünler 24 saat içinde çıkar.',
    keysEn: ['made to order', 'how long', 'how many days', 'production'],
    answerEn: "Many pieces are made to order. The making time is listed on the product page; if not, it's usually 1-3 business days. Pieces marked ready to ship go out within 24 hours."
  },
  {
    keys: ['hesap', 'üye', 'uye', 'giriş', 'giris', 'kayıt', 'kayit', 'şifre', 'sifre'],
    answer: 'Giriş ve kayıt /giris sayfasında. Adres ve kartlarını Hesabım’dan yönetirsin. Şifre için profildeki şifre alanını kullan.',
    keysEn: ['account', 'sign up', 'register', 'login', 'log in', 'password'],
    answerEn: "Log in or sign up on the login page. Manage your addresses and cards under My account. To change your password, use the password section in your profile."
  },
  {
    keys: ['kupon', 'indirim', 'kampanya', 'kod', 'yüzde 10', 'yuzde 10', '%10', 'nik10', 'hoş geldin', 'hos geldin'],
    answer: 'Kayıt olunca sana özel %10 hoş geldin kodu oluşur; yalnızca ilk siparişte geçerlidir. Site kampanya kodları tüm sepette, satıcı kodları yalnızca o atölyenin ürünlerinde geçerlidir. Komisyon, indirimden sonra alıcının ödediği son tutardan alınır; kargo ücreti varsa dahildir, ücretsiz kargoda yalnızca ürün tutarı üzerinden hesaplanır.',
    keysEn: ['coupon', 'discount', 'promo', 'code', 'welcome'],
    answerEn: "When you sign up, you get a personal 10% welcome code, valid on your first order only. Site promo codes apply to the whole bag; seller codes apply only to that atelier's pieces."
  },
  {
    keys: ['merhaba', 'selam', 'hey', 'hi', 'help', 'yardım', 'yardim'],
    answer: 'Merhaba, ben Nik Bag destek asistanıyım. Kargo, iade, ödeme, sipariş ve satıcı başvurusu hakkında yardımcı olurum. Özel bir işlem (iptal, iade onayı, ödeme) için WhatsApp’a geçebilirsin.',
    keysEn: ['hello', 'hey', 'hi', 'help'],
    answerEn: "Hi, I'm the Nik Bag support assistant. I can help with shipping, returns, payment, orders and seller applications. For anything that needs a person (cancellations, return approval, payments), switch to WhatsApp."
  }
];

const STOP = new Set([
  'bir', 'bu', 'da', 'de', 'mi', 'mı', 'mu', 'mü', 'var', 'yok', 'icin', 'için',
  'nasil', 'nasıl', 'nedir', 'ne', 've', 'ile', 'the', 'ben', 'bana', 'lütfen', 'lutfen',
  'what', 'when', 'where', 'which', 'with', 'have', 'does', 'your', 'this', 'that', 'there', 'please', 'about'
]);

const normalize = (text = '') =>
  String(text)
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasKey = (hay, key) => (key.length <= 3 ? hay.split(' ').includes(key) : hay.includes(key));

const matchFaq = (message, lang = 'tr') => {
  const hay = normalize(message);
  let best = null;
  let score = 0;
  FAQS.forEach((item) => {
    const keys = lang === 'en' ? [...item.keysEn, ...item.keys] : item.keys;
    const hits = keys.filter((key) => hasKey(hay, key)).length;
    if (hits > score) {
      score = hits;
      best = item;
    }
  });
  if (score === 0) return null;
  return lang === 'en' ? best.answerEn : best.answer;
};

const searchTerms = (message) =>
  normalize(message)
    .split(' ')
    .filter((word) => word.length >= 4 && !STOP.has(word))
    .slice(0, 4);

module.exports = {
  KNOWLEDGE,
  matchFaq,
  searchTerms
};
