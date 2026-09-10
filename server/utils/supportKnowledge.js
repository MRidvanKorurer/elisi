const KNOWLEDGE = `
Nik Bag (NikBag) el yapımı çanta, takı, seramik, mum ve ev dekorasyonu satan bir atölye pazarıdır.

KARGO
- 500 ₺ ve üzeri siparişlerde kargo bedava.
- 500 ₺ altındaki siparişlerde kargo 49,90 ₺.
- Stoklu / hemen kargoda ürünler sipariş onayından sonra 24 saat içinde kargoya verilir.
- Sipariş üzerine üretimde süre üründe yazar (genelde 1-3 iş günü, sonra kargo).

İADE
- Kullanılmamış ürünler 14 gün içinde iade edilebilir.
- Kişiye özel / sipariş üzerine üretimde iade, kullanılmamış ve kişiselleştirilmemiş ürünlerde geçerlidir.
- İade onayı ve kargo kodu insan destek (WhatsApp) üzerinden netleşir.

ÖDEME
- Kredi/banka kartı: İyzico güvenli ödeme sayfası.
- Kayıtlı kart: numarası sitede saklanmaz, sadece son 4 hane ve token tutulur.
- Havale/EFT: sipariş sonrası banka bilgisi gösterilir; açıklamaya sipariş kodu yazılır.
- WhatsApp ile sipariş de mümkün.

SİPARİŞ
- Giriş yapan kullanıcı siparişlerini Profil > Siparişler'den görür.
- Bot sipariş iptal edemez, iade onaylayamaz, ödeme alamaz, kargo adresini değiştiremez.

SATICI
- Satıcı Ol sayfasından başvuru yapılır, inceleme sonrası onaylanır.
- Satıcı kendi gelen siparişlerinin üretim durumunu panelinden günceller.

HESAP
- Kayıt/giriş /auth sayfasındadır.
- Adres ve kart profilde saklanır.
- Kayıt olan herkese kişisel %10 hoş geldin kodu verilir (NIK10-xxxxxx). Kod yalnızca o hesaba aittir, ilk siparişte ürün tutarına uygulanır, bir kez kullanılır. Profil ve ödeme sayfasında görünür.
- Süper adminin tanımladığı kampanya kodları (ör. 5.000 ₺ üzeri %5) tüm sepette geçerlidir. Satıcılar kendi panelinden yalnızca kendi ürünlerinde geçerli kod açabilir. Her iki tür de checkout’taki kampanya alanına yazılır.
`.trim();

const FAQS = [
  {
    keys: ['kargo', 'kargom', 'teslimat', 'ücretsiz kargo', 'ucretsiz kargo', 'shipping', 'ne zaman gelir'],
    answer: '500 ₺ ve üzeri siparişlerde kargo bedava, altında 49,90 ₺. Stoklu ürünler onaydan sonra 24 saat içinde kargoya çıkar. Sipariş üzerine üretimde süre üründe yazar; üretim bitince kargo başlar.'
  },
  {
    keys: ['iade', 'değişim', 'degisim', 'geri gönder', 'geri gonder', 'bozulan'],
    answer: 'Kullanılmamış ürünleri 14 gün içinde iade edebilirsin. Kişiye özel üretimde iade, kullanılmamış ve kişiselleştirilmemiş ürünlerde geçerlidir. İade kodu için WhatsApp’tan yazman yeterli.'
  },
  {
    keys: ['ödeme', 'odeme', 'kart', 'iyzico', 'havale', 'eft', 'taksit'],
    answer: 'Kart ödemesi İyzico güvenli sayfasında alınır; kart numarası sitede saklanmaz. Havale/EFT’de sipariş kodunu açıklamaya yazarsın, ödeme görününce üretim başlar. Taksit seçenekleri İyzico sayfasında çıkar.'
  },
  {
    keys: ['sipariş', 'siparis', 'kargo takip', 'nerede', 'durum'],
    answer: 'Siparişini Profil > Siparişler’den takip edebilirsin. Giriş yaptıysan son sipariş özetini buradan da söyleyebilirim. İptal veya adres değişikliği için WhatsApp’tan insan destek gerekir.'
  },
  {
    keys: ['satıcı', 'satici', 'mağaza aç', 'magaza ac', 'başvuru', 'basvuru', 'atelier', 'atölye'],
    answer: 'Satıcı Ol sayfasından başvur. Başvurun incelenip onaylanınca mağazan yayına alınır. Onay sonrası ürün ekler, gelen siparişlerin üretim durumunu kendi panelinden güncellersin.'
  },
  {
    keys: ['üretim', 'uretim', 'sipariş üzerine', 'hazırlanır', 'kaç gün', 'kac gun'],
    answer: 'Birçok parça sipariş üzerine üretilir. Süre üründe yazar; yoksa genelde 1-3 iş günü. Hemen kargoda işaretli ürünler 24 saat içinde çıkar.'
  },
  {
    keys: ['hesap', 'üye', 'uye', 'giriş', 'giris', 'kayıt', 'kayit', 'şifre', 'sifre'],
    answer: 'Giriş ve kayıt /auth sayfasında. Adres ve kartlarını Profil’den yönetirsin. Şifre için profildeki şifre alanını kullan.'
  },
  {
    keys: ['kupon', 'indirim', 'kampanya', 'kod', 'yüzde 10', 'yuzde 10', '%10', 'nik10', 'hoş geldin', 'hos geldin'],
    answer: 'Kayıt olunca sana özel %10 hoş geldin kodu oluşur; yalnızca ilk siparişte geçerlidir. Site kampanya kodları tüm sepette, satıcı kodları yalnızca o atölyenin ürünlerinde geçerlidir. Kodlar ödeme sayfasındaki kampanya alanına yazılır; minimum tutar kodda belirtilir.'
  },
  {
    keys: ['merhaba', 'selam', 'hey', 'hi', 'help', 'yardım', 'yardim'],
    answer: 'Merhaba, ben Nik Bag destek asistanıyım. Kargo, iade, ödeme, sipariş ve satıcı başvurusu hakkında yardımcı olurum. Özel bir işlem (iptal, iade onayı, ödeme) için WhatsApp’a geçebilirsin.'
  }
];

const STOP = new Set([
  'bir', 'bu', 'da', 'de', 'mi', 'mı', 'mu', 'mü', 'var', 'yok', 'icin', 'için',
  'nasil', 'nasıl', 'nedir', 'ne', 've', 'ile', 'the', 'ben', 'bana', 'lütfen', 'lutfen'
]);

const normalize = (text = '') =>
  String(text)
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const matchFaq = (message) => {
  const hay = normalize(message);
  let best = null;
  let score = 0;
  FAQS.forEach((item) => {
    const hits = item.keys.filter((key) => hay.includes(key)).length;
    if (hits > score) {
      score = hits;
      best = item;
    }
  });
  return score > 0 ? best.answer : null;
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
