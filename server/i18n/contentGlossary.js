/**
 * Ürün içeriğinde sık geçen Türkçe ifadelerin İngilizce karşılıkları.
 * Çeviri servisi önce burada tam eşleşme arar; bulamazsa makine çevirisine gider.
 */

const lower = (value) => String(value || '').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');

const COLORS = {
  'adaçayı yeşili': 'Sage green',
  'altın rengi zincir': 'Gold chain',
  antrasit: 'Anthracite',
  'açık mavi': 'Light blue',
  'açık kahve': 'Light brown',
  bej: 'Beige',
  beyaz: 'White',
  bordo: 'Burgundy',
  'derin siyah': 'Deep black',
  ekru: 'Ecru',
  fuşya: 'Fuchsia',
  gri: 'Grey',
  gökyüzü: 'Sky blue',
  'gül kurusu': 'Dusty rose',
  hardal: 'Mustard',
  kahve: 'Brown',
  kahverengi: 'Brown',
  kiremit: 'Brick red',
  krem: 'Cream',
  'kum beji': 'Sand beige',
  kırmızı: 'Red',
  lacivert: 'Navy',
  lavanta: 'Lavender',
  lila: 'Lilac',
  limon: 'Lemon',
  mavi: 'Blue',
  mercan: 'Coral',
  'mercan kırmızısı': 'Coral red',
  mint: 'Mint',
  mor: 'Purple',
  eflatun: 'Lilac',
  narçiçeği: 'Pomegranate red',
  naturel: 'Natural',
  pas: 'Rust',
  'pastel pembe': 'Pastel pink',
  pembe: 'Pink',
  petrol: 'Petrol blue',
  sarı: 'Yellow',
  siyah: 'Black',
  somon: 'Salmon',
  'sütlü kahve': 'Latte',
  taba: 'Tan',
  terracotta: 'Terracotta',
  turkuaz: 'Turquoise',
  turuncu: 'Orange',
  vizon: 'Mink',
  yeşil: 'Green',
  zeytin: 'Olive',
  'zeytin yeşili': 'Olive green',
  zümrüt: 'Emerald',
  'çimen yeşili': 'Grass green',
  'çok renkli': 'Multicolor',
  indigo: 'Indigo',
  şeftali: 'Peach',
  altın: 'Gold',
  gümüş: 'Silver',
  'gümüş rengi zincir': 'Silver chain',
  mocha: 'Mocha'
};

const PHRASES = {
  // Özellikler
  '%100 el örgüsü': '100% hand-knitted',
  '12 granny square': '12 granny squares',
  '12 granny square birleşim': '12 joined granny squares',
  'akşam / özel gün kullanımı': 'Evenings / special occasions',
  'asimetrik renk blokları': 'Asymmetric color blocks',
  'aynı renk omuz sapları': 'Matching shoulder straps',
  'açık file orta panel': 'Open mesh center panel',
  'açık file örgü': 'Open mesh knit',
  'bambu sap': 'Bamboo handle',
  'banyo / duş kullanımı': 'For bath and shower',
  'benekli krem panel': 'Speckled cream panel',
  'bohem yaz stili': 'Bohemian summer style',
  'canlı renk paleti': 'Vivid color palette',
  'delikli örgü desen': 'Openwork knit pattern',
  'delikli örgü gövde': 'Openwork knit body',
  'doğal bambu halka sap': 'Natural bamboo ring handles',
  'el yapımı': 'Handmade',
  'el örgüsü/dokuma': 'Hand-knitted / woven',
  'el örgüsü': 'Hand-knitted',
  'el örgüsü türk lifi': 'Hand-knitted Turkish bath scrubber',
  'el örgüsü mesh gövde': 'Hand-knitted mesh body',
  'geniş iç hacim': 'Roomy interior',
  'geniş hacim': 'Roomy interior',
  'geometrik kabartma desenli el örgüsü/dokuması.': 'Hand-knitted / woven with a raised geometric pattern',
  'gümüş renk zincir': 'Silver-tone chain',
  'hafif ve katlanabilir': 'Lightweight and foldable',
  'hafif ve nefes alan doku': 'Light, breathable texture',
  'hasır görünümlü örgü': 'Straw-look knit',
  'hediye edilebilir': 'Gift-ready',
  'kabuk / kabarcık örgü': 'Shell / bobble stitch',
  'kabuk kenar': 'Shell-stitch edging',
  'kahve tonu birleşim ve kenar': 'Brown joins and edging',
  'klasik file örgü': 'Classic mesh knit',
  'krem suni deri omuz sapı': 'Cream faux-leather shoulder strap',
  'makrome / örgü gövde': 'Macramé / knit body',
  mekanizmalı: 'Frame clasp',
  'metal aksam': 'Metal hardware',
  'metal halka bağlantı': 'Metal ring fittings',
  'metal halka ve perçin detay': 'Metal ring and rivet details',
  'modern nursery stili': 'Modern nursery style',
  'nik bag atölyesi üretimi': 'Made at Nik Bag Atelier',
  'sapısız clutch form': 'Handle-free clutch shape',
  'sağlam sıkı taban': 'Sturdy, tightly knit base',
  'sıkı örgü taban': 'Tightly knit base',
  'tek kemer bambu sap': 'Single arched bamboo handle',
  'yapılı dikdörtgen form': 'Structured rectangular shape',
  'yaz / plaj stili': 'Summer / beach style',
  'yazlık / plaj kullanımı': 'Summer / beach use',
  'yelek + patik 2’li set': 'Two-piece set: vest + booties',
  "yelek + patik 2'li set": 'Two-piece set: vest + booties',
  'yumuşak bebek ipliği': 'Soft baby yarn',
  'yumuşak ovma dokusu': 'Gentle scrubbing texture',
  'çerçeve üst kapama': 'Framed top closure',
  'çift bambu halka sap': 'Double bamboo ring handles',
  'çiçek detaylı patik': 'Booties with flower details',
  'ön bağcıklı açık yelek': 'Open vest with front ties',
  'şeftali kabuk kenar': 'Peach shell-stitch edging',
  'örgü omuz sapı': 'Knitted shoulder strap',

  // Bakım
  '30°c hassas yıkama veya elde yıkayın. sererek kurutun.': 'Delicate wash at 30°C or hand wash. Dry flat.',
  '40°c hassas program veya elde yıkayın. sererek kurutun; sıkmayın.': 'Delicate cycle at 40°C or hand wash. Dry flat; do not wring.',
  '40°c hassas yıkama. sererek kurutun.': 'Delicate wash at 40°C. Dry flat.',
  'elde veya hassas programda yıkayın. sererek kurutun.': 'Hand wash or use a delicate cycle. Dry flat.',
  'elde yıkayın veya hassas program kullanın. sererek kurutun.': 'Hand wash or use a delicate cycle. Dry flat.',
  'gövdeyi nemli bezle silin; deri sapı kuru bezle temizleyin.': 'Wipe the body with a damp cloth; clean the leather strap with a dry cloth.',
  'hafif nemli bezle silin. ağır ıslaklıkta bırakmayın.': 'Wipe with a slightly damp cloth. Do not leave it soaking wet.',
  'hafif nemli bezle silin. doğrudan güneşte uzun süre bırakmayın.': 'Wipe with a slightly damp cloth. Avoid long exposure to direct sunlight.',
  'kullandıktan sonra iyice durulayın, asarak kurutun. haftada bir ılık suda yıkayın.': 'Rinse well after each use and hang to dry. Wash in lukewarm water once a week.',
  'kuru bezle silin. ağır yük taşımaktan kaçının.': 'Wipe with a dry cloth. Avoid carrying heavy loads.',
  'nemli bezle silin. bambu sapı ıslatmayın.': 'Wipe with a damp cloth. Keep the bamboo handle dry.',
  'nemli bezle silin. makineye atmayın; sererek kurutun.': 'Wipe with a damp cloth. Do not machine wash; dry flat.',
  'soğuk suda elde yıkayın, sererek kurutun. sıkmayın.': 'Hand wash in cold water and dry flat. Do not wring.',

  // Ölçü notları
  'beden seçimine göre ölçü ayarı yapılır.': 'Made to measure for the size you choose.',
  'el işçiliği nedeniyle ölçüler ±2 cm değişebilir.': 'As each piece is handmade, measurements may vary by ±2 cm.',
  'el örgüsü nedeniyle çap ±1-2 cm değişebilir.': 'As each piece is hand-knitted, the diameter may vary by ±1-2 cm.',
  'sap uzunluğu omuzdan ölçüldüğünde yaklaşık 55 cm.': 'The strap measures about 55 cm from the shoulder.',
  'sipariş üzerine ölçü ayarı yapılabilir.': 'Can be made to custom measurements on request.',

  // Sığanlar
  'havlu, kitap, alışveriş': 'Towel, book, groceries',
  'havlu, kitap, güneş gözlüğü': 'Towel, book, sunglasses',
  'tablet kılıfı, cüzdan, şişe': 'Tablet sleeve, wallet, bottle',
  'telefon, cüzdan, anahtarlık': 'Phone, wallet, keys',
  'telefon, cüzdan, güneş kremi': 'Phone, wallet, sunscreen',
  'telefon, cüzdan, küçük su şişesi': 'Phone, wallet, small water bottle',
  'telefon, kartlık, ruj': 'Phone, card holder, lipstick',

  // Bedenler
  standart: 'Standard',
  'standart (~18-22 cm)': 'Standard (~18-22 cm)',

  // Lookbook
  'atölye örgüsü': 'Atelier knit',
  'ahşap sap detay': 'Wooden handle detail',
  'ahşap sap detayı': 'Wooden handle detail',
  'el örgüsü doku': 'Hand-knit texture',
  'atölye ışığı': 'Atelier light',
  'çanta hareket halinde': 'Bag in motion',
  'clutch detayı': 'Clutch detail',
  'atölye filmi': 'Atelier film',
  'atölye detayı': 'Atelier detail',
  klip: 'Clip',
  hero: 'Hero'
};

const COLORS_INDEX = new Map(Object.entries(COLORS).map(([tr, en]) => [lower(tr), en]));
const PHRASES_INDEX = new Map(Object.entries(PHRASES).map(([tr, en]) => [lower(tr), en]));

const lookupColor = (value) => COLORS_INDEX.get(lower(value)) || '';
const lookupPhrase = (value) => PHRASES_INDEX.get(lower(value)) || COLORS_INDEX.get(lower(value)) || '';

/** "0-3 ay", "2 yaş", "1-3 İş Günü", "1 hafta" gibi kalıpları çevirir; eşleşmezse ''. */
const translatePattern = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  const unit = (n, one, many) => (Number(n) === 1 ? one : many);
  const rules = [
    [/^(\d+(?:\s*-\s*\d+)?)\s*ay(lık)?$/i, (m) => `${m[1]} ${unit(m[1], 'month', 'months')}`],
    [/^(\d+(?:\s*-\s*\d+)?)\s*yaş$/i, (m) => `${m[1]} ${unit(m[1], 'year', 'years')}`],
    [/^(\d+(?:\s*-\s*\d+)?)\s*[iİ]ş\s*g[üÜ]n[üÜ]$/i, (m) => `${m[1]} business ${unit(m[1], 'day', 'days')}`],
    [/^(\d+(?:\s*-\s*\d+)?)\s*g[üÜ]n$/i, (m) => `${m[1]} ${unit(m[1], 'day', 'days')}`],
    [/^(\d+(?:\s*-\s*\d+)?)\s*hafta$/i, (m) => `${m[1]} ${unit(m[1], 'week', 'weeks')}`],
    [/^[\d.,\s×x]+cm$/i, (m) => m[0]]
  ];
  for (const [re, build] of rules) {
    const match = text.match(re);
    if (match) return build(match);
  }
  return '';
};

const glossaryTranslate = (value) => lookupPhrase(value) || translatePattern(value);

module.exports = { COLORS, PHRASES, lookupColor, lookupPhrase, translatePattern, glossaryTranslate };
