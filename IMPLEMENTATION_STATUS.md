# Implementation Status

Bu belge mynode'un gerçek durumunu belgeler: hangi özellik gerçek, hangisi
demo verisiyle çalışan bir arayüz kabuğu. Her fazın sonunda güncellenir.

## Faz 13.5 — self-service SaaS hardening (tamamlandı, canlıda doğrulandı)

- `0014_production_hardening.sql`: admin→owner yetki yükseltmesini kapatır,
  tenant ilişkilerini DB trigger'larıyla doğrular, knowledge chunk yazma/silme
  politikalarını ekler, dağıtık rate limit ve atomik onboarding RPC'lerini kurar.
  Codex tarafından yazıldı, ben (Claude) canlı Supabase projesine uygulanmadan
  önce kod incelemesinden geçirdim ve uygulanmasını yönlendirdim.
- **Canlı testte kritik bir bug bulundu ve düzeltildi (`0015_fix_tenant_trigger_field_resolution.sql`):**
  `0014`'ün `validate_tenant_relationships()` fonksiyonu, tg_table_name kontrolünü
  başka bir tablonun alanına referans veren `EXISTS(...)` ile tek bir `AND`'li
  koşulda birleştiriyordu. Postgres bu ifadeyi çalıştırmadan önce planlarken
  alanı, koşulun sol tarafı hangi tabloda tetiklendiğine bakmaksızın çözmeye
  çalışıyor — bu da `contact_identities`, `conversations` ve `messages`
  tablolarına yapılan HER insert'i "record new has no field ..." hatasıyla
  %100 kırıyordu (yalnızca `conversations` dalı doğru, iç içe `IF/END IF` ile
  yazılmıştı). Yani migration uygulandıktan sonra WhatsApp/Instagram/web-chat
  üzerinden yeni hiçbir konuşma başlatılamıyordu. `0015` her dalı iç içe
  `IF/END IF` ile izole ederek düzeltti. Düzeltme sonrası canlı uçtan uca
  testle doğrulandı: gerçek kullanıcı kaydı → onboarding RPC'si → org/owner/
  çalışma saatleri/web-chat kanalı otomatik oluştu → widget session/message
  API'leri üzerinden gerçek mesaj gönderildi ve kaydedildi → ilgisiz başka bir
  kullanıcı bu organizasyonun verisini göremedi (RLS izolasyonu sağlam). Tüm
  test verileri temizlendi.
- Yeni müşteri onboarding sırasında işletme + web sitesi bilgilerini girer;
  organizasyon, owner üyeliği, çalışma saatleri ve web chatbot tek transaction'da
  oluşur. Ayarlar'da hazır embed kodu ve canlı kurulum kontrol listesi görünür.
- Temsilci web-chat konuşmasına doğrudan cevap verebilir. İlk yanıt zamanı ve
  başarılı otomasyon bitiş zamanı gerçek akışta yazılır; unread sayaç artışı
  atomiktir ve konuşma açıldığında temizlenir.
- Twilio webhook hataları artık retry alır; aynı provider kimliği iki aktif
  tenant'a bağlanamaz. Kişi silindiğinde ilişkili ham webhook payload'ı da silinir.
- Instagram için Meta imza doğrulamalı webhook ve unified-inbox kayıt akışı
  eklendi. Müşteri OAuth bağlantısı ve outbound Instagram yanıtı Meta uygulama
  hesabı/onayı geldikten sonra tamamlanacaktır.
- Landing page self-service ürünü anlatacak şekilde güncellendi; gerçek olmayan
  müşteri sayısı kaldırıldı, Instagram/ödeme/AI beta sınırları açıklandı.

**Dağıtım notu:** `0014` ve `0015` migration'ları bağlı Supabase projesine
uygulandı ve canlı testle doğrulandı — beklenen aksiyon yok.

## Faz 14 — WhatsApp: kendi Twilio hesabını bağlama (tamamlandı, canlıda doğrulandı)

Daha önce WhatsApp gönderme/webhook doğrulama tamamen `.env.local`'deki tek
bir global Twilio hesabına bağlıydı — gerçek çoklu-kiracı SaaS için her
müşterinin kendi Twilio hesabını/numarasını bağlayabilmesi gerekiyordu.

- `0016_whatsapp_byo_credentials.sql`: yeni `channel_secrets` tablosu ekler.
  `channel_connections.credentials` her org üyesine (viewer dahil) RLS ile
  açık olduğu için sır saklamaya uygun değildi — `channel_secrets`'ta RLS
  açık ama `authenticated`/`anon` için hiç policy yok, yalnızca servis-rolü
  (sunucu tarafı) erişebiliyor. `validate_tenant_relationships()` trigger'ına
  (0015'teki düzeltilmiş nested-IF desende) bu tablo için de bir dal eklendi.
- Settings'te gerçek bir bağlama formu (Account SID, Auth Token, WhatsApp
  numarası): Twilio API'sine karşı doğrulanıyor, admin/owner rolü zorunlu,
  "bağlantıyı kaldır" butonu var.
- Gönderme (`lib/actions/messages.ts`, `lib/automations/engine.ts`) ve her
  iki webhook (`app/api/webhooks/twilio/route.ts` ve `.../status/route.ts`)
  artık global `.env.local` yerine ilgili organizasyonun kendi kayıtlı
  Twilio hesabını kullanıyor. Webhook imza doğrulaması, "To" numarasından
  hangi organizasyona ait olduğunu bulup **o organizasyonun kendi** auth
  token'ıyla doğruluyor (paylaşımlı tek sır yok).
- Canlı testle doğrulandı (gerçek Twilio hesabıyla): kimlik bilgisi
  doğrulama, `channel_secrets` kaydı organizasyon sahibine bile RLS üzerinden
  görünmüyor, bir organizasyonun sırrını başka bir organizasyona bağlamaya
  çalışmak trigger tarafından reddedildi, aynı numarayı iki organizasyon
  bağlamaya çalışınca reddedildi, gerçek imzalı HTTP isteğiyle inbound
  webhook doğru organizasyona mesaj yazdı, sahte imza 403 ile reddedildi.
  Tüm test verileri temizlendi.
- Kapsam dışı: Embedded Signup / tek-tık bağlama (Twilio ISV onayı gerektirir,
  kod değil iş süreci) — bkz. sıradaki fazlar.

## Faz 15 — Instagram OAuth bağlama ekranı (kod tamam, canlı OAuth turu bekliyor)

Instagram DM'lerini almak için gereken inbound webhook (Faz 13.5) zaten
hazırdı; eksik olan, müşterinin kendi Instagram Business hesabını bağlayacağı
gerçek bir ekrandı.

- `0017_instagram_oauth.sql`: `channel_secrets` ile aynı desende yeni bir
  `channel_instagram_credentials` tablosu (Meta Page access token'ı burada
  saklanır) — RLS açık, `authenticated`/`anon` için hiç policy yok, yalnızca
  servis-rolü erişebiliyor. Tenant-doğrulama trigger'ına bu tablo için de
  bir dal eklendi.
- `app/api/integrations/instagram/connect`: admin/owner rolü zorunlu, rastgele
  bir nonce'u hem `state` parametresinde hem httpOnly cookie'de taşıyarak
  standart OAuth CSRF korumasıyla Meta'nın OAuth ekranına yönlendiriyor.
- `app/api/integrations/instagram/callback`: nonce'u doğruluyor, `code`'u
  kullanıcı token'ına, onu da 60 günlük uzun ömürlü token'a çeviriyor
  (`lib/meta/graph.ts`), kullanıcının yönettiği Sayfaları ve bunlara bağlı
  Instagram Business hesaplarını buluyor. Tek sayfa varsa otomatik bağlanıp
  Meta'ya "bu sayfanın mesajlarını webhook'umuza gönder" deniyor
  (`subscribed_apps`); birden fazla sayfa varsa `/settings/instagram-pages`'te
  seçim ekranı açılıyor — adaylar (Page access token'ları dahil) tarayıcıya
  hiç gitmeden, yalnızca httpOnly bir cookie'de taşınıyor.
- Settings'teki Instagram kartı artık gerçek: Meta yapılandırılmışsa
  "Instagram'ı bağla" butonu, bağlıyken "bağlantıyı kaldır" butonu (WhatsApp
  ile aynı genel `disconnectChannelAction`), OAuth hata/başarı banner'ı.
- Canlı testle doğrulandı: `channel_instagram_credentials` kaydı organizasyon
  sahibine bile RLS üzerinden görünmüyor, bir kimlik bilgisini başka bir
  organizasyona bağlamaya çalışmak trigger tarafından reddedildi, eksik
  `organizationId`/yapılandırılmamış Meta durumunda route'lar güvenli hata
  sayfalarına yönlendiriyor.
- **Eksik/bekleyen:** gerçek OAuth turu (Facebook giriş ekranı, Sayfa seçimi)
  yalnızca gerçek bir tarayıcıda, gerçek bir Meta Developer App'iyle test
  edilebilir — bu otomatik test edilemez. `.env.local`'de `META_APP_ID`/
  `META_APP_SECRET`/`META_VERIFY_TOKEN` girilip Meta App Review onayı
  geldikten sonra birlikte uçtan uca denenecek.

## Faz 16 — AI cevap taslağı (kod tamam, gerçek anahtar bekliyor)

Kullanıcının isteği: "AI belki GPT olur belki Claude" — tek bir sağlayıcıya
kilitlenmeden ikisini de destekleyen bir katman.

- `lib/ai/provider.ts`: `ANTHROPIC_API_KEY` veya `OPENAI_API_KEY`'den hangisi
  ayarlıysa onu kullanır; ikisi de ayarlıysa `AI_PROVIDER` env'i ile seçilir.
  Sağlayıcı değişse bile geri kalan kod (`lib/actions/ai.ts`) hiç değişmez.
- `lib/ai/sensitive.ts`: kart numarası (Luhn doğrulamalı), IBAN, TC Kimlik No
  (gerçek checksum algoritmasıyla) tespit eder — biri geçerse mesaj hiç AI
  sağlayıcısına gönderilmiyor, temsilci kendisi yanıtlıyor. 7 gerçek unit
  testle doğrulandı (`lib/ai/sensitive.test.ts`) — gerçek kimlik/kart
  numaraları algılanıyor, rastgele 11-16 haneli sayılar (checksum'ı
  tutmayan) yanlış pozitif vermiyor.
- `lib/ai/retrieval.ts`: yalnızca **yayınlanmış** bilgi tabanı makalelerinden,
  Postgres full-text search (`knowledge_chunks.search_vector`, Faz 4'ten
  hazır) ile en alakalı parçaları çeker. Hiçbir eşleşme yoksa AI hiç
  çağrılmıyor — "bilgi tabanında yok" diye temsilciye dönüyor, tahmin
  yürütmüyor (spec'in "AI cevap uydurmasın" kuralı).
- `lib/actions/ai.ts` (`generateSuggestedReplyAction`): konuşmanın son
  müşteri mesajını alır, hassas veri kontrolünden geçirir, bilgi tabanından
  kaynak bulur, marka sesine göre (`organizations.brand_voice`) taslak
  üretir, `ai_reply_drafts`'a kaydeder (Faz 1'den beri şemada hazır bekleyen
  tablo — hiç kullanılmıyordu), token kullanımını `ai_usage_events`'e yazar.
  Taslak agent temsilci kullandığında ("Kullan") veya değiştirip
  gönderdiğinde (`lib/actions/messages.ts`) durumu `approved`/`edited`
  olarak, "Yoksay"da `rejected` olarak güncellenir — gerçek bir onay/ret
  hunisi.
- Conversations ekranında yeni bir panel: "AI önerisi oluştur" butonu,
  öneri geldiğinde kaynak makale adları + "Kullan"/"Yoksay", hassas
  veri/bilgi bulunamadı/yapılandırılmamış durumları için ayrı mesajlar.
  Yalnızca agent+ rolü görür (viewer göremez — `ai_reply_drafts_update`
  RLS politikasıyla aynı sınır).
- Canlı testle doğrulandı (DB/RLS seviyesinde): `ai_reply_drafts`/
  `ai_usage_events` tabloları hazır, kimliği doğrulanmış normal kullanıcı
  bu tablolara doğrudan INSERT yapamıyor (yalnızca service-role — taslak
  her zaman sunucu tarafından üretiliyor), org üyesi kendi taslağını
  okuyup güncelleyebiliyor, ilgisiz bir kullanıcı başka org'un taslağını/
  kullanım kaydını göremiyor.
- **Eksik/bekleyen:** `.env.local`'de ne `ANTHROPIC_API_KEY` ne
  `OPENAI_API_KEY` var — gerçek bir sağlayıcı çağrısı (taslak metni
  gerçekten üretme) henüz canlı test edilmedi, yalnızca kod incelemesi +
  build/typecheck/test yeşil. Anahtar geldiğinde bilgi tabanına gerçek bir
  madde ekleyip uçtan uca (soru → doğru kaynaktan taslak → gönder) test
  edilecek.

**Durum tanımları:**
- `DEMO_ONLY` — sadece statik/mock veri gösterir, gerçek backend çağrısı yok.
- `PARTIAL` — bir miktar gerçek bağlantı var ama eksik/yarım.
- `PRODUCTION_READY` — gerçek backend ile uçtan uca çalışıyor.
- `BLOCKED` — sağlanmamış bir bağımlılık (anahtar, hesap, karar) olmadan ilerleyemez.

**Genel tespit (Faz 0 anındaki, artık kısmen eski):** Faz 1-3 ile birlikte
`app/api`, `proxy.ts`, `lib/supabase/*`, `lib/env.ts`/`lib/env.server.ts`,
ve `@supabase/*`/`twilio` paketleri eklendi — aşağıdaki tablo güncel durumu
yansıtır. `@anthropic-ai/sdk`, `stripe`, `@sentry/*` hâlâ kurulu değil.

| # | Alan | Durum | Kanıt |
|---|---|---|---|
| 1 | Kimlik doğrulama | `PRODUCTION_READY` | Gerçek Supabase Auth: e-posta/şifre kayıt+doğrulama, giriş, şifremi unuttum/yenile, güvenli çıkış (`lib/actions/auth.ts`), `proxy.ts` ile route koruması + session yenileme. Demo bypass yalnızca `DEMO_MODE=true` + dev'de. Canlı testte doğrulandı. |
| 2 | Organizasyon/ekip yapısı | `PRODUCTION_READY` | Onboarding (`app/onboarding`), davet/rol/kaldırma (`lib/actions/members.ts`, Settings'te rol bazlı UI), son-owner koruması DB trigger'ıyla. Canlı çapraz-organizasyon testiyle doğrulandı (bkz. Faz 2 geçmişi — bir RLS açığı bulunup düzeltildi). |
| 3 | WhatsApp alma/gönderme | `PARTIAL` | Gerçek Twilio entegrasyonu, artık **her organizasyon kendi Twilio hesabını bağlıyor** (Faz 14, `lib/actions/channels.ts`, `channel_secrets` tablosu): imza doğrulamalı webhook (`app/api/webhooks/twilio`, org-bazlı auth token ile), idempotent mesaj/konuşma/kişi oluşturma, org-bazlı gönderme (`lib/actions/messages.ts`) + status callback. Canlı test edildi (bkz. Faz 3 ve Faz 14 geçmişi) — gerçek WhatsApp cihaz round-trip'i kullanıcının WhatsApp erişimi geri geldiğinde tamamlanacak. `PARTIAL` nedeni: template/24-saat penceresi UI'da gösterilmiyor, tek-tık Embedded Signup yok (müşteri kendi Twilio hesabında birkaç adım atmak zorunda). |
| 4 | Instagram mesajları | `PARTIAL` | İnbound webhook (imza doğrulamalı, idempotent, unified inbox — Faz 13.5) ve OAuth bağlama ekranı (Faz 15, `app/api/integrations/instagram/*`, `channel_instagram_credentials`) kod olarak tamam ve DB/route seviyesinde canlı test edildi. `PARTIAL` nedeni: gerçek bir Meta Developer App'i + App Review onayı olmadan hiçbir müşteri gerçekten bağlanamıyor — bu bir hesap/onay süreci, kod eksikliği değil. Outbound (agent'tan Instagram'a cevap gönderme) da bu onaydan sonra bağlanacak. |
| 5 | Web chat | `PRODUCTION_READY` | Gerçek gömülebilir widget (`public/widget.js`, vanilla JS, XSS'e karşı yalnızca `textContent`) + public API (`app/api/widget/*`, service-role, origin allowlist, rate limit). Otomasyon motoru kanal-farkında hale getirildi (web'de Twilio'ya gitmiyor). Settings'te embed kodu + tema/karşılama mesajı ayarı. Canlı test edildi: yanlış origin 403, doğru origin çalışıyor, otomasyon tetiklendi ve widget pollinginde göründü, başka ziyaretçinin konuşmasına erişim 404, rate limit eşzamanlı yükte doğrulandı. Kapsam dışı: CAPTCHA (ek dış servis gerektirir), dosya yükleme. |
| 6 | AI cevap önerisi | `PARTIAL` | Faz 16: Anthropic + OpenAI SDK kurulu, sağlayıcı-bağımsız katman (`lib/ai/provider.ts`), bilgi tabanı FTS retrieval, hassas veri filtresi (7 unit test), `ai_reply_drafts`/`ai_usage_events`'e gerçek kayıt, Conversations'ta gerçek "AI önerisi oluştur" paneli. DB/RLS seviyesinde canlı doğrulandı. `PARTIAL` nedeni: `.env.local`'de henüz gerçek bir Anthropic/OpenAI anahtarı yok — gerçek bir taslak üretme çağrısı henüz canlı test edilmedi. Not: pazarlama sayfasındaki etkileşimli demo (`lib/demo/data.ts`) hâlâ ayrı ve kasıtlı olarak sahte — gerçek panele hiç bağlanmıyor, gerçek panel bu satırda anlatılan. |
| 7 | Bilgi tabanı | `PARTIAL` | Gerçek CRUD (`lib/actions/knowledge.ts`): makale oluştur/düzenle/yayınla/arşivle/sil, gerçek arama (`?q=`, kategori filtresi), yayında paragraf bazlı chunk'lama → `knowledge_chunks` (FTS indeksi Faz 1'den hazır). Canlı RLS testiyle doğrulandı (agent+ yazabiliyor, viewer engelleniyor). `PARTIAL` nedeni: yalnızca elle metin girişi var — URL/PDF/DOCX/CSV içe aktarma henüz yok (spec'in kendi sıralamasında sonraki adımlar), ve retrieval (AI'ın bu chunk'ları gerçekten kullanması) Faz 5'e ait. |
| 8 | Otomasyonlar | `PRODUCTION_READY` | Gerçek kural motoru (`lib/automations/engine.ts`): anahtar kelime ve mesai-dışı tetikleyicileri, her gelen WhatsApp mesajında değerlendiriliyor, eşleşince gerçek Twilio yanıtı gönderiyor. Her çalışma `automation_runs`'a yazılıyor, aynı mesaj için aynı kural iki kez çalışmıyor (unique constraint). Rol bazlı UI (agent/viewer sadece görür, admin+ oluşturur/değiştirir/siler). Canlı test edildi: gerçek webhook → kural eşleşti → Twilio'ya gitti → hem `automation_runs` hem mesaj kaydı doğru "failed" + hata sebebiyle işaretlendi (test numarası sandbox'a kayıtlı olmadığı için beklenen hata), duplicate webhook ikinci çalıştırma oluşturmadı. Kapsam: yalnızca spec'in "güvenli MVP" listesindeki kural türleri (anahtar kelime, mesai dışı) — karmaşık koşul oluşturucu veya tam otomatik AI gönderimi yok (henüz AI yok). |
| 9 | Dashboard/KPI | `PARTIAL` | Gerçek metrikler (`lib/db/metrics.ts`, formüller `docs/metrics.md`): açık/bekleyen/bugün-çözülen sayıları, ort. ilk yanıt süresi, 7 günlük yanıt süresi trendi, önceliğe göre kuyruk, kanal dağılımı, ekip performansı — hepsi canlı sorgulanıyor. Canlı testte doğrulandı (bilinen zaman damgalarıyla test verisi, kullanıcı ekranda doğru sayıları gördü). `PARTIAL` nedeni: CSAT (anket özelliği yok), intent kırılımı/AI çözüm oranı (Faz 5 bekliyor) ve SLA % (hiçbir orgda `sla_policies` kaydı yok, oluşturacak UI da yok) kasıtlı olarak eklenmedi — sahte göstermek yerine çıkarıldı. |
| 10 | Abonelik/faturalandırma | `DEMO_ONLY` | Stripe/ödeme SDK'sı yok, checkout route yok. Fiyat kartları (`app.config.ts` → `marketing.pricing`) yalnızca görsel metin; CTA'lar hiçbir işleme bağlı değil. |
| 11 | Yönetici paneli | `NOT PRESENT` | `/admin` rotası veya admin'e özel bileşen/koruma yok. |
| 12 | Loglama ve izleme | `NOT PRESENT` | Sentry veya özel logger modülü yok; structured logging yok. |
| 13 | KVKK/veri silme | `NOT PRESENT` | Veri dışa aktarma/silme özelliği hiçbir yerde yok. |
| — | Ayarlar / entegrasyon durumu rozetleri | `PARTIAL` | `app/(app)/settings/page.tsx` gerçekten `process.env[v]` kontrolü yapıp "Connected"/"Demo mode" rozeti gösteriyor (`app.config.ts`'teki `integrations` listesini okuyarak) — tek gerçek backend mantığı bu. Ama "Connected" görünse bile hiçbir SDK kurulu olmadığı için arka planda gerçekten Twilio/Anthropic/Supabase'e bağlanan bir şey yok. |

## Sonraki fazın önkoşulları

Faz 5 (AI cevap üretimi) için:

- Anthropic veya OpenAI API anahtarından biri (Faz 16 kodu ikisini de
  destekliyor, hangisi verilirse o kullanılır — henüz hiçbiri girilmedi).
- Faz 10 için ödeme sağlayıcısı kararı: Stripe mi, yoksa Türkiye için iyzico/PayTR mi.
- Instagram bağlama ekranının gerçekten çalışması için: Meta Developer App
  oluşturulup `META_APP_ID`/`META_APP_SECRET`/`META_VERIFY_TOKEN` girilmeli,
  ardından `instagram_manage_messages` izni için App Review başvurusu
  yapılmalı (ekran kaydı + gizlilik politikası linki gerekiyor).
- Kullanıcının WhatsApp erişimi geri geldiğinde: gerçek cihaz round-trip
  testi (sandbox join + gerçek mesaj gönder/al) tamamlanmalı.

## Faz geçmişi

- **Faz 0** — Tamamlandı.
- **Faz 1** — Tamamlandı: Zod env doğrulama (`lib/env.ts`, `lib/env.server.ts`),
  32 tablo şema migration'ı (`supabase/migrations/0001-0006`, canlı projeye
  uygulandı ve doğrulandı), tüm tablolarda RLS + rol bazlı politikalar
  (`0007-0008`, anon key ile [] / service-role ile tam erişim doğrulandı),
  Supabase client'ları (`lib/supabase/*`) ve repository katmanı (`lib/db/*`,
  şimdilik organizations/profiles/organization_members — diğerleri
  kullanan faz geldikçe eklenecek). Gerçek çapraz-organizasyon RLS testi
  Faz 2'nin gerçek kullanıcıları olmadan yapılamıyor, Faz 2'ye ertelendi.
- **Faz 2** — Tamamlandı: gerçek auth, onboarding, ekip/rol yönetimi.
  **Canlı çapraz-organizasyon RLS testinde kritik bir güvenlik açığı
  bulundu ve düzeltildi**: `organization_members` bootstrap politikası,
  "bu organizasyonda üye var mı" kontrolünü RLS'e tabi bir alt sorguyla
  yapıyordu — bu da her zaman "üye yok" gibi görünmesine yol açıyordu,
  yani herhangi bir kullanıcı kendini başka birinin organizasyonuna
  owner olarak ekleyebiliyordu (migration `0011`, `SECURITY DEFINER`
  fonksiyonla düzeltildi). Ayrıca org oluşturma sırasında `RETURNING`
  satırının okunamadığı ayrı bir bug bulunup düzeltildi (`0010`). Her
  ikisi de gerçek kullanıcılarla test edilip test verileri temizlendi.
- **Faz 3** — Kısmi tamamlandı (`PARTIAL`, bkz. tablo satır 3): gerçek
  Twilio WhatsApp entegrasyonu — kanal bağlantısı (Settings), imzalı
  webhook ile gelen mesaj işleme (idempotent), mesaj gönderme + status
  callback, Conversations sayfası gerçek veriyle (demo veri kalmadı).
  ngrok ile yerelde uçtan uca test edildi: kendi ürettiğim geçerli
  Twilio imzalı istek → contact/conversation/message doğru oluştu,
  duplicate webhook idempotent, yanlış imza reddedildi; gerçek
  tarayıcıda (kullanıcı üzerinden) konuşma doğru göründü, gönderme
  gerçek Twilio API'sine gitti ve beklenen sandbox-red hatasını doğru
  gösterdi. Bu arada "son owner" trigger'ının organizasyon silmeyi de
  (yanlışlıkla) engellediği bulunup düzeltildi (migration `0012`).
  Gerçek WhatsApp cihazından round-trip, kullanıcının WhatsApp erişimi
  olmaması nedeniyle tamamlanamadı — kapsam dışı bırakılanlar: cursor
  pagination, Supabase Realtime, etiketleme/atama/iç not, AI önerisi
  paneli (Faz 5 bekliyor).
- **Faz 4** — Kısmi tamamlandı (`PARTIAL`, bkz. tablo satır 7): bilgi
  tabanı artık gerçek — makale CRUD, arama, kategori filtresi, yayında
  chunk'lama. Canlı RLS testiyle doğrulandı. Kapsam dışı: URL/dosya
  içe aktarma (spec'in kendi MVP sıralamasında sonraki adımlar),
  AI'ın bu içeriği gerçekten kullanması (Faz 5).
- **Faz 6** — Tamamlandı (bkz. tablo satır 8, Anthropic anahtarı
  beklenirken Faz 5 atlanıp buraya geçildi): gerçek anahtar kelime +
  mesai dışı otomasyon motoru, canlı webhook testiyle doğrulandı.
  Bu arada bir bug bulunup düzeltildi: otomasyonun gönderdiği mesaj,
  Twilio hata verdiğinde "queued"da takılı kalıyordu, artık agent'ın
  elle gönderdiği mesajlar gibi doğru "failed" + sebep gösteriyor.
- **Faz 7** — Kısmi tamamlandı (`PARTIAL`, bkz. tablo satır 9):
  dashboard artık gerçek metriklerle çalışıyor, formüller
  `docs/metrics.md`'de belgelendi. CSAT/intent/SLA% kasıtlı olarak
  eklenmedi (altyapıları yok) — sahte veri yerine çıkarıldı. Canlı
  testte, bilinen zaman damgalı test verisiyle doğrulandı.
- **Faz 8** — Web chat tamamlandı (bkz. tablo satır 5), Instagram
  bloke (satır 4, Meta hesapları kullanıcıda yok — soruldu, erteledi).
  Web chat widget'ı ve public API'leri canlı test edildi (origin
  allowlist, rate limit, çapraz-ziyaretçi erişim engeli, kanal-farkında
  otomasyon yanıtı). İlk rate-limit testinde yanlış-negatif alındı
  (istekler pencereden yavaştı), eşzamanlı yükle tekrar test edilip
  doğrulandı.
- **Faz 9** — Tamamlandı: gerçek bildirim merkezi (Topbar'da, servis-
  rolü ile oluşturulan, kullanıcı sadece kendininkini görür), konuşma
  atama + atama bildirimi, kanal hatası bildirimi (admin+'a), iç
  notlar (müşteriye gitmeyen), hazır yanıtlar (composer'da hızlı ekle),
  admin+ CSV dışa aktarma (audit_logs'a yazılıyor). Canlı RLS testiyle
  doğrulandı. SLA-riski/düşük-güven bildirimleri, e-posta bildirimleri,
  bildirim tercihleri/sessiz saatler ve agent çevrimiçi durumu kasıtlı
  olarak eklenmedi (altyapıları yok — sahte göstermek yerine atlandı).
- **Faz 11** — Tamamlandı: Next.js 16.2.5→16.2.12 güvenlik yaması
  (middleware bypass, SSRF, DoS CVE'leri; kalan 2 npm audit bulgusu
  Next'in kendi iç bağımlılığı, "düzeltmesi" Next'i 9'a düşürmek
  olduğu için bilerek uygulanmadı). Security header'lar + CSP. Rate
  limit auth ve mesaj göndermeye genişletildi. Audit log üye/kanal/
  otomasyon değişikliklerine genişletildi. KVKK/GDPR "unutulma hakkı":
  kişi silme (admin+, Conversations'ta) ve organizasyon kapatma
  (owner-only, isim onaylı, Settings'te) — ikisi de gerçek FK cascade
  ile çalışıyor, canlı test edildi. Taslak /privacy, /terms, /kvkk
  sayfaları (avukat incelemesi gerektiği açıkça belirtilmiş).
- **Faz 12** — Tamamlandı: Vitest ile 26 gerçek unit test (5 dosya —
  slug, CSV escape, bilgi tabanı chunk'lama, mesai saati mantığı, rate
  limiter), GitHub Actions CI (`lint+typecheck+test+build`, her push/PR'da).
  **CI kurulumu kritik bir bug'ı ortaya çıkardı**: `next build`,
  Supabase anahtarları hiç ayarlanmamışken tamamen çöküyordu —
  `lib/supabase/server.ts` yapılandırma hatasını `cookies()`
  çağrısından önce fırlatıyordu, bu da Next.js'in sayfayı "dinamik"
  olarak işaretlemesini engelliyor ve build-zamanı statik üretim
  denemesini çökertiyordu. Bu, Faz 2'den beri kitin "sıfır anahtarla
  açılır" sözünü sessizce bozmuştu. Sıra değiştirilip hem sıfır hem
  dolu env ile build tekrar doğrulandı. Entegrasyon/E2E testi yok
  (gerçek/mock Supabase altyapısı gerektirir) — bunun yerine bu
  oturum boyunca her faz canlı REST testleriyle doğrulandı.
- **Faz 13 (kısmi)** — `GET /api/health` gerçek veritabanı
  bağlantısını kontrol ediyor (uptime monitor/deploy health check için).
  Sentry/hata izleme (hesap gerekiyor), yedek/geri yükleme tatbikatı
  (Supabase altyapı seviyesinde hallediyor), durum sayfası bu pass'te
  yapılmadı.

## Kalan işler — kullanıcı kararı/hesabı gerekiyor

Aşağıdakilerin kodu ya tamam ya da net bir sıradaki adımı var, ama dış
hesap/anahtar/karar olmadan uçtan uca canlı test edilip bitirilemez —
bilerek tahmin yürütülmedi:

- **AI cevap taslağı** (Faz 16, kod tamam) — Anthropic veya OpenAI API
  anahtarı gerekiyor, gerçek üretim testi bekliyor.
- **Instagram** (Faz 15, kod tamam) — Meta Developer App + App Review
  onayı gerekiyor (Twilio gibi ücretsiz sandbox'ı yok).
- **Abonelik/faturalandırma** — ödeme sağlayıcısı kararı (Stripe mi,
  Türkiye için iyzico/PayTR mi) + o sağlayıcıda hesap; hiç kod yazılmadı.
- Sentry (veya benzeri) hata izleme hesabı.
- Production deployment — Vercel (veya seçilecek platform) hesabı,
  custom domain, gerçek webhook URL'leri.
- Gerçek pilot müşteriler.
