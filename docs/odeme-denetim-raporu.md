# Ödeme denetim raporu

Tarih: 3 Ekim 2026  
Kapsam: `main` üzerindeki havale/EFT, kapalı iyzico kart yolu, sipariş durumları, yönetici ve satıcı panelleri, hakediş, iade/iptal, kampanya kodları, stok ve bildirimler.  
İş modeli (sahip teyidi): Tüm havale/EFT ödemeleri **tek platform IBAN**’ına gider. Atölyelere para **haftalık** dağıtılır. Satıcı IBAN’ı yalnızca hakediş içindir; ödemede alıcıya gösterilmez. Kart, açılırsa iyzico üzerinden alınır.

Bu metin ürün ve mühendislik önerisidir. Hukuk veya mali müşavirlik değildir.

## Özet

**Üretim hazır değil.** Havale ile sipariş alınabilir, platform IBAN’ı siparişe kopyalanır, süper admin ödemeyi elle “ödendi” yapabilir ve satıcı ancak ondan sonra kargolar. Haftalık dağıtım, dekont, eksik/fazla ödeme, ödenmeyen siparişin kapanması ve iade için sistem yok. Bunlar operasyonu insanın hafızasına bırakıyor.

Önceki havale denetimi **PR #7** (`cursor/havale-payment-audit-30ff`, birleşti: 20 Eylül 2026, `fe8d805`) `main` içindedir. O PR’den sonra gelenler:

- Sipariş oluşunca alıcı, satıcı ve süper admin e-postası ile satıcı/admin WhatsApp bildirimi eklendi. Alıcı e-postasında IBAN yok. Ödeme “alındı” bildirimi yok.
- `425c272` ile iyzico kart ödemesi kapatıldı. Checkout ve callback kodu duruyor, rota ve arayüz kapalı.
- Komisyon satırları ve “ödendi işaretle” var. Bu bir defter veya haftalık bordro değil.

Bu turda yalnızca iki kesin hata düzeltildi (aşağıda “Bu turda düzeltilenler”). Geri kalan maddeler tasarım önerisidir; kodlanmadı.

**İlk işler**

1. Platform IBAN’ını panelden kaydedin ve sahip atölyesinin **Mağazam IBAN**’ını kontrol edin. Eski sürüm her açılışta tahsilat IBAN’ını o atölyenin hakediş IBAN’ının üzerine yazıyordu. Eski değer geri gelmez; farklıysa Mağazam’dan yeniden girin.
2. Her siparişe kısa, kopyalanan bir **ödeme kodu** verin. Yönetici bu kod ve tutarla eşleştirsin.
3. Ödenmeyen havale için süre, hatırlatma ve stok rezervi koyun.
4. Haftalık hakediş bordrosunu iptal ve iadeden düşerek üretin. “Tümünü ödendi işaretle” tek tıkını bordro onayı olmadan kullanmayın.

## Mevcut durum

### Tahsilat hesabı

- Checkout’ta alıcıya gösterilen hesap `GET /api/site` → `resolveBank()` (`server/utils/bank.js`, `server/routes/siteRoutes.js`).
- Kaynak sırası: `SiteSetting` alanları `featuredBankName` / `featuredBankHolder` / `featuredBankIban`, yoksa `BANK_*` ortam değişkeni, o da yoksa kod içindeki varsayılan hesap.
- Havale siparişi bu hesabı `Order.bankAccount` içine kopyalar (`server/controllers/orderController.js`). Sonradan IBAN değişse eski siparişin talimatı durur.
- Geçerli TR IBAN yoksa havale `503` döner. Checkout’ta Tamamla da kapanır (`client/src/pages/CheckoutPage.jsx`).
- Panel: Admin → IBAN (`client/src/components/AdminBankAccounts.jsx`, `PUT` platform bankası `server/controllers/adminController.js` `updatePlatformBank`). Aynı kayıt vitrin ve haftanın atölyesi dekontlarında da kullanılır (`featuredController.js`, `atelierWeekController.js`).

Satıcı IBAN’ı `Seller.iban` / `ibanHolder` (`server/models/Seller.js`). Kayıt ve Mağazam’da zorunlu (`client/src/pages/BecomeSellerPage.jsx`, `SellerPanel.jsx`). Checkout bileşeni `BankTransferDetails` yalnızca kendisine verilen hesabı basar; checkout bunu `site.bank` ile çağırır, satıcı IBAN’ı ile değil.

### Sipariş ve ödeme durumları

`server/models/Order.js`

| Alan | Değerler |
|---|---|
| `paymentMethod` | `credit_card` (API reddeder), `transfer`, `whatsapp` |
| `paymentStatus` | `pending`, `completed`, `failed` |
| `orderStatus` | `processing`, `shipped`, `delivered`, `cancelled` |
| `sellerFulfillments` | Satıcı bazında aynı dört durum |
| `sellerSettlements` | Satıcı, oran, brüt, komisyon, net, `payoutStatus`: `pending` \| `paid` |
| `payouts` | Oluşturma anındaki platform ve satıcı IBAN anlık görüntüsü + tutar |
| `stockAdjusted` | Stok düşüldü mü |

Fiyat sunucuda ürün kaydından hesaplanır. İstemcinin gönderdiği fiyata güvenilmez (`unitPriceOf`). Kargo: 1000 TL altı 100 TL, üstü bedava (`server/utils/productFulfillment.js`). Komisyon varsayılan %10; satıcı son 90 günde 50.000 TL brüte ulaşırsa ve oran elle kilitli değilse %8 (`server/utils/commission.js`).

Akış:

1. `POST /api/orders/create` (`optionalProtect`: üye veya misafir).
2. Havale ve WhatsApp `paymentStatus: pending` kaydeder. Stok bu anda düşmez.
3. Sepet, girişli kullanıcıda temizlenir.
4. Süper admin `PUT /api/admin/orders/:id` ile ödemeyi `completed` yapınca `applyPaidStock` stok düşer (`server/controllers/adminController.js`). Geri alınırsa stok iade edilir.
5. Satıcı `shipped` / `delivered` yapamazken ödeme `completed` değilse `400` alır (`sellerController.updateMyOrder`).

Kart yolu yorum satırında. `server/routes/orderRoutes.js` callback’i kapalı. `server/config/iyzipay.js` duruyor; üretimde anahtar yoksa istemci kurulmaz. Sandbox anahtarları kaynakta sabit (kart kapalıyken kullanılmıyor).

### Eşleştirme ve hatırlatma

Başarı sayfası tutar, IBAN ve “açıklama: sipariş kodu” gösterir (`client/src/pages/OrderResultPage.jsx`, `checkout.json` `bankNote`). Kod, Mongo `_id`’nin tamamıdır (24 onaltılık karakter). Hesabım listesi başlığında son 6 hane, havale kutusunda yine tam `_id` vardır (`ProfileDashboard.jsx`). Satıcı paneli `shortOrderCode` ile son 6 haneyi kullanır (`sellerController.js`). E-posta konu ve gövdesi tam `_id` kullanır (`emailTemplates.js`) ve IBAN basmaz.

Gelen EFT ile siparişi eşleştiren alan, arama, kısmi/fazla/eksik tutar veya banka hareketi yoktur. Yönetici sipariş listesinde ödemeyi seçer (`AdminPanel.jsx`).

Ödeme son tarihi, hatırlatma cron’u ve ödenmeyen siparişi kapatan iş yoktur. `server.js` içinde zamanlayıcı yok.

### Dekont

Alıcı siparişine dekont yükleyemez. `Order` üzerinde dekont alanı yok.

Dekont yalnızca satıcının platforma ödediği vitrin ve haftanın atölyesi paketlerindedir (`FeaturedRequest.receiptUrl`, `WeeklyAtelier.receiptUrl`). Yükleme `server/middleware/uploadMiddleware.js` `receiptFile`. Süper admin görür ve onaylar (`AdminPanel.jsx`, `featuredController.js`, `atelierWeekController.js`).

### Hakediş

Sipariş kaydolurken `settlementsFromItems` her satıcı için mal bedeli (indirim düşülmüş) + kargo payı üzerinden komisyon ve net hesaplar. Kargo, satıcıların mal payına oranlanır ve komisyon matrahına girer. `payouts` o andaki satıcı IBAN’ını da saklar.

Yönetici komisyon ekranı (`client/src/components/AdminCommission.jsx`, `adminReportsController.js`) satıcı IBAN’ını, “ödemen gereken” ve “ödediğin” toplamlarını gösterir. İşaretleme:

- Tek satır: `PUT /api/admin/orders/:id/payout` (`markOrderPayout`). Ödeme `completed` değilse “ödendi” reddedilir.
- Satıcının tüm açık satırları: `PUT /api/admin/sellers/:id/payouts` (`markSellerPayouts`). Tarih aralığı, tutar onayı ve bordro kaydı yok. Arayüz düğmesi: “Tümünü ödendi işaretle”.

Satıcı paneli “Tahsilat” olarak **alıcı ödemesi tamamlanmış** siparişlerin netini toplar (`getMyOverview`). Satıcıya “platform bana ödedi / bekliyor” ayrımı gitmez. `buildSellerOrders` içinde `payoutStatus` yoktur.

Haftalık bordro, ödeme tarihi, ödeyen kullanıcı, dekont veya satıcı ekstresi yoktur.

### Karışık sepet, iptal, iade

Bir sepette birden fazla atölye olabilir. `sellerFulfillments` satıcı bazındadır. Biri iptal ederse genel durum, kalan aktif satıcılara göre `deriveOrderStatus` ile hesaplanır (`server/utils/orderFulfillment.js`). Hepsi iptal olursa sipariş `cancelled` olur.

`totalPrice` ve `sellerSettlements` iptalde yeniden hesaplanmaz. Ödeme hâlâ `pending` iken **tüm** satıcılar iptal ederse ödeme `failed` yapılır ve hoş geldin / kampanya kodu geri verilir. Tek satıcı iptalinde alıcıdan hâlâ ilk tutar istenir.

Ödeme `completed` olduktan sonra iptal stok iade etmez, hakedişi düşmez, iade kaydı açmaz.

İade modeli, alıcı IBAN’ı, iyzico iade çağrısı ve kısmi iade yoktur. Metinler 14 gün ve “havale iadesi bildirilen hesaba” der (`client/src/locales/tr/legal.json`). Destek botu iade onaylamaz; WhatsApp’a yönlendirir (`supportKnowledge.js`).

### Kampanya ve stok

- Hoş geldin: hesap başına `NIK10-…`, ara toplamın %10’u (`welcomeCoupon.js`). Bekleyen ve iptal edilmemiş sipariş kodu tüketmiş sayılır. Kartın terk edilmiş denemelerini silen kod duruyor; kart kapalı.
- Kampanya: `PromoCode` yüzde, alt limit, satıcıya özel olabilir (`promoCode.js`). Kullanım tavanı ve bitiş tarihi alanı yok. `isActive` kapatılınca “süresi doldu” denir. `usedCount` siparişten sonra artar.
- İki kod birlikte uygulanabilir.
- Stok, oluştururken `product.stock < quantity` ile bakılır, ödeme işaretinde `$inc` ile düşülür (`orderStock.js`). Koşullu düşüm (`stock >= adet`) ve rezerv alanı yok. İki bekleyen sipariş aynı son adedi geçebilir. Düşüm negatife inebilir.

### Bildirimler

| Olay | E-posta | WhatsApp |
|---|---|---|
| Sipariş oluştu | Alıcı, ilgili satıcılar, süper admin (`emailService.notifyOrderCreated`) | Satıcı ve admin telefonları (`whatsappService.notifyNewOrder`). Alıcıya gitmez. |
| Satıcı durum değiştirir | Alıcı + admin (`notifyOrderStatusChanged`) | Alıcı (`notifyOrderStatusUpdate`) |
| Admin “ödendi” işaretler | Yok | Yok |
| Süre doluyor / ödenmedi | Yok | Yok |

Alıcı e-postası tutarı ve “açıklamaya sipariş numarasını yazın” der; IBAN, alıcı adı ve son tarih yoktur (`emailTemplates.buyerCreated`). Satıcı e-postasına siparişin **tam tutarı** gider, atölyenin kendi neti değil (`sellerSold` `total`).

WhatsApp canlıda Meta Cloud API’ye ayarlı (`whatsappCloud.js`). Şablon veya telefon yoksa mesaj düşer; sipariş yine kaydolur.

### Yetki

Ödemeyi ve hakedişi yalnızca `protect` + `superAdmin` değiştirir (`server/routes/adminRoutes.js`). Satıcı ödeme durumunu değiştiremez. Denetim günlüğü (kim, ne zaman, eski/yeni değer) yok. Ayrı bir `AuditLog` modeli yok.

## Bulgular

### Kritik

**1. Gelen havale ile sipariş sistemde eşleşmiyor.**  
Kanıt: `Order` üzerinde `paymentReference`, `receivedAmount`, `bankRef` yok. Eşleştirme, süper admin’in `paymentStatus` seçmesidir (`adminController.updateOrder`, `AdminPanel.jsx`). Kısmi, fazla ve eksik ödeme durumları yok. Yanlış açıklama için kuyruk yok.  
Sonuç: Tek IBAN’da biriken havale, siparişle ancak elle ve hatırlayarak bağlanır. Yanlış sipariş “ödendi” olabilir; stok o anda düşer.

**2. Alıcıya gösterilen kodlar birbirini tutmuyor.**  
Kanıt: Başarı sayfası ve Hesabım havale notu tam `_id` (`bankNote`, `ProfileDashboard.jsx` ``Açıklama: ${selectedOrder._id}``). Liste başlığı ve satıcı `code` alanı son 6 hane. Banka açıklaması uzun ve hataya açıktır; müşteri gördüğü kısa kodu yazar, admin tam kimliği arar. Kısa kodun benzersiz olduğu da garanti değil (yalnızca son 6 hane).

**3. Ödenmeyen sipariş kapanmıyor; stok rezerve edilmiyor.**  
Kanıt: `paymentMethod: 'transfer' | 'whatsapp'` ve `pending` için süre alanı ve cron yok. Stok kontrolü oluşturma anında, düşüm yalnızca admin “ödendi” deyince (`orderStock.applyPaidStock`). İki eşzamanlı istek aynı stoğu geçebilir; düşüm `stock >= adet` şartı aramaz, stok eksiye inebilir.  
Hoş geldin kodu, bekleyen sipariş durdukça kilitli kalır (`welcomeCoupon.priorOrderFilter`).

**4. Haftalık dağıtım defteri yok. Toplu “ödendi” gerçek transfer değildir.**  
Kanıt: `sellerSettlements.payoutStatus` yalnızca `pending|paid`. `paidAt`, `paidBy`, bordro no, dönem ve dekont yok. `markSellerPayouts` o satıcının ödemesi tamamlanmış ve satırı henüz `paid` olmayan **bütün** siparişlerini tek `updateMany` ile işaretler. İptal edilmiş satıcı dilimini ayırmaz. Satıcı ekranında hakediş durumu yoktur.  
İş modelindeki “haftalık platform dağıtımı” kodda bir bordro olarak yok.

**5. Platform tahsilat IBAN’ı, süper admin atölyesinin hakediş IBAN’ına yazılıyordu.**  
Kanıt (düzeltmeden önce): `upsertPlatformBank` ilk `superadmin` kullanıcısının `Seller.iban` değerini ve `User.adSoyad` alanını platform hesabıyla değiştiriyordu. `connectDB` her açılışta `ensurePlatformBank()` çağırdığı için panelden kaydedilen IBAN, ortam değişkeni veya koddaki varsayılanla yeniden ezilebiliyordu (`server/config/db.js`, `server/utils/bank.js`).  
Checkout `resolveBank` satıcı IBAN’ını okumaz; zarar hakediş tarafındadır. Ayrıntı “Bu turda düzeltilenler”.

**6. Alıcı sipariş API’si satıcı IBAN’larını döndürüyordu.**  
Kanıt: `getMyOrders` ve `getOrderById` belgeyi olduğu gibi basıyordu. `payouts.sellers[].iban` oluşturma anındaki atölye IBAN’ıdır. Checkout arayüzü bunu göstermiyor; yanıtta duruyordu. Misafir ipliği (`publicGuestThread`) göstermiyor. Ayrıntı “Bu turda düzeltilenler”.

**7. İptal ve iade hakedişi güncellemez. Havale iadesinin kaydı yok.**  
Kanıt: `updateMyOrder` yalnız fulfillment damgalar. `totalPrice` sabit kalır. Ödeme tamamsa stok, kupon ve settlement durur. `Refund` modeli ve iyzico `refund` çağrısı yok. Hukuki metin iade vadediyor; operasyon WhatsApp’ta kalır. Ödenmiş karışık sepette iptal olan atölye komisyon raporunda hâlâ “ödemen gereken”e girebilir (`adminReportsController.js` iptali yalnızca `order.orderStatus === 'cancelled'` ise yoksayar).

### Önemli

**8. Alıcı, ödeme talimatını e-postada ve WhatsApp’ta tam almıyor. Ödeme düşünce haber gitmiyor.**  
`buyerCreated` tutarı yazar, IBAN ve son tarih yazmaz. `notifyNewOrder` alıcıya gitmez. Admin ödemeyi `completed` yapınca `notifyOrderCreated` / `notifyOrderStatusUpdate` çağrılmaz. Checkout metni (`contactHint`) güncellemelerin iletişim bilgisine gideceğini söyler.

**9. WhatsApp siparişi de gerçek, ödenmemiş sipariştir.**  
`handleWhatsAppOrder` `paymentMethod: 'whatsapp'` ile `createOrder` çağırır, sonra sohbet penceresi açar (`CheckoutPage.jsx`). `bankAccount` kopyalanmaz. Başarı sayfası yine de canlı site IBAN’ını gösterebilir (`OrderResultPage.jsx`, `method === 'whatsapp'`). Kod tüketilir, stok rezerve edilmez, süre dolmaz. Müşteri sohbeti göndermese de sipariş durur.

**10. Karışık sepette tutar ve kargo payı iptale duyarsız.**  
Tek kargo bedeli (100 TL veya 0) mal oranıyla satıcılara bölünür ve komisyon matrahına girer (`settlementsFromItems`). Platform kargoyu kendisi mi ödüyor, atölye mi, kodda yazılı değil. Bir atölye iptal olunca diğerinin tutarı ve alıcının yatıracağı tutar değişmez. Satıcı e-postası da tüm sepet tutarını “Tutar” diye yazar.

**11. Komisyon ve ciro, kısmi iptali görmez.**  
Hacim iskontosu (`trailingGmvBySellers`) `paymentStatus: completed` ve `orderStatus != cancelled` siparişlerin brütünü sayar. Bir satıcısı iptal olan siparişin tamamı ciroda kalır. İptal satırının `payoutStatus` değeri ayrıca düşülmez.

**12. Stok ve kupon yarışı.**  
Stok düşümü `stockAdjusted` bayrağına bakar; iki eşzamanlı “ödendi” isteği ikisi de bayrağı false görürse iki kez düşebilir. Mongo transaction yok. Hoş geldin ve `usedCount` artışı sipariş kaydından sonra yapılır; iki paralel istek aynı kodu iki kez geçebilir. Çift tıklama kilidi yalnızca tarayıcıdadır (`submittingRef`). Sipariş oluşturma için rate limit yok (`server.js` limiti login/register/google).

**13. Ödemeyi kim işaretlediği yazılmıyor.**  
Süper admin yetkisi doğru yerde. `updateOrder` iptal edilmiş siparişi de `completed` yapabilir. Tersine çevirmek stok ve (failed ise) kuponu geri alır. Aktör, saat, gerekçe ve beklenen/gelen tutar saklanmaz.

**14. Kampanya kodunun tavanı ve tarihi yok.**  
`PromoCode` şemasında `maxUses` ve `expiresAt` yok. Satıcıya özel kod, o atölyenin ara toplamına uygulanır; hoş geldin ise tüm ara toplama. İkisi üst üste binebilir. İndirim mal bedelini aşarsa satır `Math.max(0, …)` ile sıfırlanır; müşteri toplamı da sıfırın altına inmez. Kargo yine eklenebilir.

**15. iyzico kapalı ama yarım entegrasyon duruyor.**  
Checkout kart seçeneği ve callback yorumda. `paymentGroup` eski kodda `PRODUCT`; alt üye işyeri, `subMerchantKey`, onay/red ve iade yok. `User.kayitliKartlar` token alanları duruyor; tam kart numarası şemada yok. Kart yeniden açılırsa bugünkü havale defteri ile pazaryeri bölüşümü aynı şey değildir.

### Küçük

**16. Varsayılan platform IBAN’ı ve hesap sahibi adı istemci ve sunucu kaynağında.**  
`server/utils/bank.js` `PLATFORM_BANK`, `client/src/utils/featured.js` `FEATURED_BANK`. Satıcı paneli bankayı API gelene kadar bu sabitle doldurur. Canlı hesap kaynakta durmasın; ortam değişkeni veya yalnızca veritabanı kullanılsın. Bu rapora hesap numarası yazılmadı.

**17. `resolveBank` her okumada ayarı yeniden yazar.**  
`persistBank` checkout ve site isteğinde de çalışır. Gereksiz yazma ve panel kaydıyla yarış riski.

**18. Sipariş hatası istemciye `error.message` döner.**  
`createOrder` 500 gövdesi. Operasyonel ayrıntı sızabilir.

**19. Misafir ipliği e-posta eşleşmesine dayanır.**  
`GET /api/orders/guest/:id?email=`. Kimlik tahmin edilmesi zordur; e-posta doğruysa havale talimatı gelir. Bu rotada hız sınırı yok.

**20. Checkout notu siparişe yazılmaz.**  
`buildPayload` kalem `customBrief` yollar; genel sipariş notu gövdeye girmez. Havale’ye özel değil.

**21. Otomatik ödeme testi yok.**  
İstemci testi `client/src/hooks/productGridMeasure.test.js`. `createOrder`, banka ve stok için sunucu testi yok.

**22. Yönetici kargo durumunu değiştiremez.**  
`updateOrder` `orderStatus` gelirse `403`. Tasarım böyle. Platform, takılı satıcı siparişini kendi kapatamaz.

## Bu turda düzeltilenler

Başka ödeme davranışı değiştirilmedi.

1. **Tahsilat IBAN’ı artık satıcı kaydına ve admin adına yazılmaz.**  
   `upsertPlatformBank` yalnız `SiteSetting` alanlarını günceller. Sunucu açılışı `seedPlatformBankIfEmpty` kullanır: kayıtlı geçerli IBAN varsa ona dokunmaz, yoksa ortam/varsayılan hesabı yazar. `scripts/setPlatformBank.js` eskisi gibi `ensurePlatformBank` ile ortam hesabını **bilerek** yazar.  
   Panelden değiştirilen IBAN bir sonraki açılışta geri alınmaz. Daha önce ezilmiş Mağazam IBAN’ı kendiliğinden düzelmez.

2. **Alıcının sipariş cevabından `payouts` çıkarıldı.**  
   `GET /api/orders/myorders` ve sahip olarak `GET /api/orders/myorders/:id` satıcı IBAN anlık görüntüsünü vermez. Süper admin aynı detay ucundan belgeyi görmeye devam eder. Hesabım havale kutusu `bankAccount` (platform hesabı) kullanır; bu durur.

## Önerilen çözümler

Amaç: alıcı tek platform IBAN’ına, tek kod ve tek tutarla öder. Platform parayı tutar. Haftada bir, iade ve iptal düşülmüş netler satıcı IBAN’larına gider. Satıcı IBAN’ı vitrinde ve checkout’ta görünmez.

### 1. Ödeme kodu ve eşleştirme

`Order` alanları:

- `paymentReference`: benzersiz, kısa, büyük harf. Örnek biçim `NB-` + 6 karakter (`NB-K7M2QX`). Sipariş `_id` gösterilmez.
- `expectedAmount`: `totalPrice` kopyası. Sipariş tutarı değişirse bu da değişir.
- `receivedAmount`: yönetici veya banka kaydı, sayı.
- `paymentMatch`: `unmatched | exact | under | over | manual`.
- `paymentMarkedAt`, `paymentMarkedBy` (User), `paymentNote`.

Kurallar:

- Havale ve WhatsApp siparişinde kod üret, benzersiz indeks koy.
- Başarı sayfası, Hesabım, e-posta ve WhatsApp metni **aynı** kodu “Açıklama” diye kopyalatır. Tutar ayrı satırdır.
- Admin sipariş listesinde arama: kod, e-posta, telefon, tutar.
- Gelen tutar = beklenen → `exact`, sonra “ödendi” stok düşer.
- Eksik → `under`. Sipariş ödenmiş sayılmaz. Alıcıya kalan tutar yazılır. Yeni sipariş açılmaz.
- Fazla → `over`. Sipariş ödenebilir; fark iade kuyruğuna `Refund` satırı olarak düşer (aşağı).
- Açıklama yok veya yanlış: yönetici tutar + ad + saat ile aday listesinden `manual` bağlar. Bağlanamayan hareket `UnmatchedTransfer` koleksiyonunda kalır (`amount`, `senderName`, `bookedAt`, `note`, `order` boş).

Banka API’si yokken ekran elle çalışır. Aynı alanlar ileride mutabakat dosyası veya banka bildirimi ile doldurulur.

Uçlar:

- `GET /api/admin/payments?match=unmatched&q=`
- `POST /api/admin/payments/unmatched` (gelen hareket)
- `POST /api/admin/orders/:id/match` `{ receivedAmount, unmatchedId? }`

Kim: yalnız süper admin. Her işlem `AuditLog` (`actor`, `action`, `before`, `after`, `at`).

### 2. Süre, hatırlatma, stok rezervi

Önerilen varsayılan (panelden değişebilir): hatırlatma 12. saat, iptal 48. saat. Kişiye özel üretimde süre daha uzun seçilebilir; karar ürün kararıdır.

- `paymentDueAt` sipariş kaydında.
- Sipariş açılırken stok atomik rezerve edilir: `Product.updateOne({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })`. Tutmazsa sipariş hiç yazılmaz. `stockAdjusted: true` rezerv anlamında kalır; iptal/zaman aşımı `restorePaidStock` ile geri verir. Böylece “ödendi” anında ikinci düşüm yapılmaz.
- Cron (saatlik, tek örnek): vadesi 12 saat kalmış ve hatırlatması gitmemiş pending havale/WhatsApp → e-posta + mümkünse WhatsApp. Vadesi geçmiş → `paymentStatus: failed`, `orderStatus: cancelled`, tüm `sellerFulfillments` iptal, stok ve kod iadesi, alıcıya “sipariş kapandı” mesajı. Zaten `completed` olana dokunulmaz.
- Rezerv varken ikinci alıcı o adedi alamaz. Oversell kapanır.

### 3. Alıcı dekontu

Vitrin dekontu (`receiptFile`) yeniden kullanılır; yeni yükleyici yazmaya gerek yok.

- `Order.paymentProof`: `{ url, name, uploadedAt, status: pending|accepted|rejected, reviewedBy, reviewNote }`.
- `POST /api/orders/myorders/:id/proof` ve misafir için e-posta doğrulamalı `POST /api/orders/guest/:id/proof`. Yalnız `transfer|whatsapp` ve `pending`.
- Dekont ödemeyi kendiliğinden `completed` yapmaz. Admin kuyruğunda görür; tutar ve kod uyuyorsa “ödendi” der.
- Dosya herkese açık klasörde tahmin edilebilir URL ile duruyorsa, sipariş dekontu için yetkili indirme kullanılsın. Vitrin dekontlarının bugünkü açıklığı ayrıca gözden geçirilsin.

### 4. Haftalık hakediş bordrosu

Yeni koleksiyon `PayoutBatch`:

- `periodStart`, `periodEnd` (İstanbul haftası, örneğin pazartesi 00:00 – pazar 23:59).
- `status`: `draft | approved | paid`.
- `lines[]`: `seller`, `iban`, `ibanHolder` (o anın kopyası), `gross`, `commission`, `shipping`, `refunds`, `adjustments`, `net`, `orderIds`, `lineStatus`.

Yeni koleksiyon `LedgerEntry` (ekleme only):

- `seller`, `order`, `type`: `sale | refund | cancel | adjustment | payout`.
- `gross`, `fee`, `net`, `at`.

Hesap:

- Satış satırı, alıcı ödemesi `completed` olunca yazılır. Tutar, o satıcının o andaki netidir.
- Satıcı dilimi iptal veya iade olunca ters kayıt. `sellerSettlements` yeniden hesaplanır; alıcının kalan borcu `expectedAmount` olarak güncellenir. Henüz havale gelmediyse alıcıya yeni tutar gider.
- Öneri: teslim + 14 gün dolmadan bordroya alma. Cayma penceresi kapanmadan para çıkmasın. Erken ödeme gerekiyorsa satır `hold` kalsın.
- Platform kendi atölyesi için de satır üretilir; “tümünü ödendi” ile karışmasın. Aynı IBAN’a tekrar göndermek yerine mahsup notu düşülebilir.
- Satıcı IBAN’ı boş veya geçersizse satır `blocked`. Checkout’ta gösterilmez.

Uçlar ve ekranlar:

- Admin: “Bu haftayı oluştur” → taslak liste, IBAN kopyala, bankadan çıktıktan sonra “ödendi” + dekont. `markSellerPayouts` bu bordronun onayına bağlanır; tarihsiz tüm geçmişi işaretlemesin.
- Satıcı: “Hakediş” sekmesi. Dönem, brüt, komisyon, kargo, iade, net, durum (`bekliyor / kesildi / ödendi`). IBAN’ı burada kendi hesabı olarak görür.

Kargo önerisi: kargo bedeli komisyon matrahından çıksın. Tek kargo, mal payına bölünmeye devam etsin ama `fee` yalnız mal bedeline uygulansın. Platform kargoyu kendisi ödüyorsa kargo payı satıcı netine hiç girmesin; ayrı `shippingLiability: platform | seller` alanı konulsun. Bunu açmadan bordro yanlış net üretir.

### 5. Karışık sepet

Sipariş bir `Payment` (alıcının yatırdığı tek tutar) ve satıcı başına `SellerSlice` olsun. Slice: kalemler, mal, kargo payı, indirim payı, komisyon, net, fulfillment, iptal tutarı.

Bir atölye iptal ederse:

- O dilimin neti hakedişten düşer.
- Alıcı ödemediyse `expectedAmount` kalan dilimlerin toplamı olur; e-posta yeni tutarı ve aynı kodu gönderir.
- Alıcı ödediyse fark `Refund` olur (havale: alıcı IBAN’ına elle; kart: iyzico).
- Kalan atölyeler kendi dilimini üretmeye devam eder.

İndirim payı bugünkü `allocateOrderDiscounts` ile kalabilir: kampanya ilgili atölyeye, hoş geldin mal oranına.

### 6. İade

`Refund`: `order`, `seller` (varsa), `amount`, `method` (`transfer|card`), `buyerName`, `buyerIban`, `status` (`requested|approved|paid|rejected`), `reason`, `providerRef`.

- Havale: admin onaylar, alıcı IBAN’ına elle gönderir, “ödendi” der. IBAN siparişte düz metin durmasın; en azından erişim süper adminle sınırlı kalsın.
- Kart (yeniden açılırsa): iyzico iade API’si, `paymentId` siparişte saklı. Pazaryeri ise iade ilgili alt üyeye işlenir.
- İade, ledger’a ters kayıt yazar. Aynı siparişe ikinci iade, kalan tutarı aşamaz.
- Stok, iade onayında ve ürün geri geldiyse artar. Kişiye özel üretimde ürün geri gelmeden stok artmasın.

### 7. Bildirimler

Aynı şablon setine üç mesaj:

- Sipariş: kod, tutar, alıcı adı, IBAN, son tarih. E-posta + alıcının telefonuna WhatsApp (şablon onayı gerekir).
- Hatırlatma: kalan süre, aynı talimat. Bir kez.
- Ödeme alındı: alıcıya “üretim başlayabilir”; her satıcıya yalnız kendi kalemleri ve kendi neti. Admin’e kısa özet.

Kargo mesajı bugünkü gibi kalsın. İptal ve iade de aynı kanaldan gitsin.

### 8. Bütünlük

- Fiyat sunucuda kalmaya devam etsin. İstemci tutarı yok sayılsın.
- `Idempotency-Key` başlığı veya `clientOrderKey`: aynı anahtar aynı siparişi döner, ikinci kayıt açmaz.
- Stok ve kupon tek transaction veya koşullu güncelleme. `usedCount` için `maxUses` şartı güncellemenin içinde olsun.
- `AuditLog` ödeme, eşleştirme, iade ve bordro için zorunlu.
- `createOrder` 500 gövdesinden `error.message` kalksın. Sipariş ucuna auth limiter’a benzer bir limit konulsun.
- Varsayılan IBAN kaynak kodundan çıksın.

### 9. Hukuk ve operasyon notları (tavsiye, hukuki görüş değil)

Bir avukat ve mali müşavire sorulacak başlıklar:

- **Mesafeli sözleşmeler.** Sitede ön bilgilendirme, mesafeli satış ve 14 gün cayma metni var. Kişiye özel üretim istisnası da yazılmış. Metinlerin sipariş anında sürümleyip saklanması (hangi metin onaylandı) bugün yok; checkbox var, metin kopyası siparişte yok.
- **Aracı hizmet sağlayıcı.** Satıcı sözleşmesi platformu aracı, ürünün sağlayıcısını satıcı diye tanımlıyor (`legal.json` `satici-sozlesmesi`). 6563 sayılı Kanun kapsamında yer sağlayıcı / aracı yükümlülükleri (iletişim, şikâyet, aykırı içeriği kaldırma) ayrıca teyit edilmeli.
- **Paranın tutulması.** Müşteri parası platform hesabına girip satıcıya haftalar sonra gidiyor. Bu model, ödeme hizmeti / emanet ayrımı açısından 6493 sayılı Kanun tarafında soru doğurabilir. iyzico pazaryeri bu soruyu sık kullanılan bir yoldur: tahsilat ödeme kuruluşunda bölünür, platform bakiyeyi kendi vadesiz hesabında taşımaz. Bunu lisans yorumu olarak değil, sorulacak madde olarak işaretliyorum.
- **Fatura.** Platform komisyonu için platformun belgesi, mal bedeli için satıcının belgesi ayrı işler. e-Fatura / e-Arşiv yükümlülüğü ciro ve mükellefiyet türüne bağlıdır. Satıcı kaydında `vergiNo` ve `tcKimlik` alanları var; siparişten fatura kesilmiyor. Bireysel atölye ile limited şirketin belgesi aynı olmaz.
- **KVKK.** Siparişte ad, adres, telefon, e-posta ve (kart açılırsa) T.C. kimlik no var. Satıcıya telefon, e-posta ve açık adres gidiyor (`buildSellerOrders`). Hakediş IBAN’ı alıcıya gitmemeli; bu turdaki API düzeltmesi bunun içindir. Dekont görselleri kimlik ve hesap içerebilir.
- **Cayma ve el emeği.** 14 gün, kişiye özel ve hijyen istisnaları metinde var. Hakedişi 14 gün bekletmek bu metinle aynı hizaya gelir. İade “ödemenin yapıldığı yolla” deniyor; havale için alıcı IBAN’ı toplanmadığı sürece bu cümle operasyonda karşılıksız.

### 10. Karşılaştırma

| | Manuel havale (bugünkü model, toparlanmış) | iyzico pazaryeri (alt üye işyeri) | Havale eşleştirme hizmeti veya banka bildirimi |
|---|---|---|---|
| Alıcı ne yapar | Tek IBAN, kod, tutar | Kart (ve kuruluşun açtığı yöntemler) | Yine havale; kodu hizmet üretir |
| Para nerede durur | Platform vadesiz hesabı | Ödeme kuruluşu, alt üye bakiyesi | Çoğu zaman yine sizin IBAN; hizmet hareketi eşler |
| Bölüşüm | Sizin haftalık bordronuz | Kuruluş satıcı IBAN’ına öder; komisyon sizde kalır | Eşleşme sizde; dağıtım yine sizde |
| İade | Elle, alıcı IBAN | API | Havale iadesi yine elle |
| Satıcıya yük | IBAN + vergi bilgisi sizde zaten var | Alt üye başvurusu, vergi, IBAN, sözleşme | Değişmez |
| Ücret | Banka havale masrafı, sizin zamanınız | Komisyon + pazaryeri ücreti | Hizmet bedeli |
| Bugünkü koda uzaklık | Orta: kod, süre, bordro, iade | Büyük: kapalı checkout `PRODUCT` gruplu; alt üye yok | Orta: gelen hareketi 1. maddedeki alana bağlamak |

**Öneri:** Tahsilatı şimdi manuel havale olarak tutun. Tek IBAN ve haftalık ödeme sahibi modeliyle örtüşüyor. Eksik olan banka değil; kod, süre, stok rezervi, dekont ve bordro. Kart cirosu büyürse iyzico’yu **pazaryeri** olarak açın; eski tekil checkout’u olduğu gibi geri açmayın. Havale hacmi elle bakılamaz hale gelirse eşleştirme hizmeti, bordronun yerine geçmez; yalnız “bu havale hangi sipariş” sorusunu kapatır.

iyzico pazaryeri havale yerine geçmez. Kartı büyütmek ile haftalık EFT dağıtımını düzeltmek iki ayrı iştir. İkisi birlikte de durabilir: kart pazaryerinde, havale platform IBAN’ında.

## Öncelikli yol haritası

| Sıra | İş | Büyüklük | Neden önce |
|---|---|---|---|
| 1 | Kısa ödeme kodu, her yerde aynı metin, admin arama, gelen tutar (eksik/fazla/tam) | M | Yanlış siparişi “ödendi” yapmak stok ve hakedişi bozar |
| 2 | Atomik stok rezervi, 12 saat hatırlatma, 48 saat iptal, kod iadesi | M | Oversell ve sonsuz bekleyen sipariş |
| 3 | Alıcı e-postasına IBAN + kod + tutar + son tarih; “ödendi” bildirimi | S | Talimat bugün çoğunlukla ekranda kalıyor |
| 4 | Sipariş dekontu ve admin kuyruğu (mevcut receipt yükleme) | S | Eşleştirmeyi dekontla destekler; ödemeyi otomatik saymaz |
| 5 | Ledger + haftalık bordro; iptalde dilimi ve `expectedAmount` yeniden hesapla; “tümünü ödendi”yi bordroya bağla | L | İş modelinin kendisi |
| 6 | Havale iade kaydı (alıcı IBAN, durum) ve ödenmiş iptalde ters kayıt | M | Metin iade vadediyor, kodda yok |
| 7 | Denetim günlüğü, sipariş idempotency, kampanya tavanı, kaynak kodundan sabit IBAN’ı kaldırma | M | Bütünlük; 1–6 ile birlikte |

S: bir ekran ve mevcut servislerin genişlemesi. M: yeni alanlar, bir cron, admin kuyruğu. L: yeni koleksiyonlar ve satıcı ekstresi; iptal kurallarıyla birlikte.

Kart ve iyzico pazaryeri bu yedi adımın önüne konmasın. Havale düzelmeden pazaryeri, haftalık EFT sorununu kapatmaz.
