# Implementation Status

Bu belge mynode'un gerçek durumunu belgeler: hangi özellik gerçek, hangisi
demo verisiyle çalışan bir arayüz kabuğu. Her fazın sonunda güncellenir.

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
| 3 | WhatsApp alma/gönderme | `PARTIAL` | Gerçek Twilio entegrasyonu: imza doğrulamalı webhook (`app/api/webhooks/twilio`), idempotent mesaj/konuşma/kişi oluşturma, gerçek gönderme (`lib/actions/messages.ts`) + status callback. Canlı test edildi (bkz. Faz 3 geçmişi) — gerçek WhatsApp cihaz round-trip'i kullanıcının WhatsApp erişimi geri geldiğinde tamamlanacak. Şu an tek paylaşımlı Twilio Sandbox numarası kullanılıyor (multi-org gerçek numara ayrımı yok), template/24-saat penceresi UI'da gösterilmiyor — bunlar `PARTIAL` nedeni. |
| 4 | Instagram mesajları | `DEMO_ONLY` | Meta/Instagram API kodu yok. Sadece mock verilerde `channel: "instagram"` etiketi. |
| 5 | Web chat | `DEMO_ONLY` | Gömülebilir widget bileşeni/scripti yok. `web` sadece mock konuşmalarda üçüncü bir kanal etiketi. |
| 6 | AI cevap önerisi | `DEMO_ONLY` | Anthropic/OpenAI SDK kurulu değil, LLM çağıran route yok. Önerilen yanıt metinleri `lib/demo/data.ts`'te sabit string. "Gönder / Devret / Düzenle" butonlarının `onClick`'i yok. |
| 7 | Bilgi tabanı | `PARTIAL` | Gerçek CRUD (`lib/actions/knowledge.ts`): makale oluştur/düzenle/yayınla/arşivle/sil, gerçek arama (`?q=`, kategori filtresi), yayında paragraf bazlı chunk'lama → `knowledge_chunks` (FTS indeksi Faz 1'den hazır). Canlı RLS testiyle doğrulandı (agent+ yazabiliyor, viewer engelleniyor). `PARTIAL` nedeni: yalnızca elle metin girişi var — URL/PDF/DOCX/CSV içe aktarma henüz yok (spec'in kendi sıralamasında sonraki adımlar), ve retrieval (AI'ın bu chunk'ları gerçekten kullanması) Faz 5'e ait. |
| 8 | Otomasyonlar | `PARTIAL` | `app/(app)/automations/page.tsx`'te açma/kapama `toggle(id)` gerçek client-side state güncelliyor (istatistik şeridi tepki veriyor) — ama backend'e yazılmıyor, sayfa yenilenince sıfırlanıyor. Kural motoru veya "Yeni kural" işlevi yok. |
| 9 | Dashboard/KPI | `DEMO_ONLY` | `app/(app)/dashboard/page.tsx`'teki tüm sayılar (`kpis`, `sla`, `csatTrend`, `agentPerf` vb.) `lib/demo/data.ts`'ten sabit — fetch/sorgu yok. |
| 10 | Abonelik/faturalandırma | `DEMO_ONLY` | Stripe/ödeme SDK'sı yok, checkout route yok. Fiyat kartları (`app.config.ts` → `marketing.pricing`) yalnızca görsel metin; CTA'lar hiçbir işleme bağlı değil. |
| 11 | Yönetici paneli | `NOT PRESENT` | `/admin` rotası veya admin'e özel bileşen/koruma yok. |
| 12 | Loglama ve izleme | `NOT PRESENT` | Sentry veya özel logger modülü yok; structured logging yok. |
| 13 | KVKK/veri silme | `NOT PRESENT` | Veri dışa aktarma/silme özelliği hiçbir yerde yok. |
| — | Ayarlar / entegrasyon durumu rozetleri | `PARTIAL` | `app/(app)/settings/page.tsx` gerçekten `process.env[v]` kontrolü yapıp "Connected"/"Demo mode" rozeti gösteriyor (`app.config.ts`'teki `integrations` listesini okuyarak) — tek gerçek backend mantığı bu. Ama "Connected" görünse bile hiçbir SDK kurulu olmadığı için arka planda gerçekten Twilio/Anthropic/Supabase'e bağlanan bir şey yok. |

## Sonraki fazın önkoşulları

Faz 5 (AI cevap üretimi) için:

- Anthropic API anahtarı (henüz alınmadıysa şimdi lazım olacak).
- Faz 10 için ödeme sağlayıcısı kararı: Stripe mi, yoksa Türkiye için iyzico/PayTR mi.
- Meta/Instagram uygulaması (Faz 8'e kadar gerekmiyor, erken karar gerekmez).
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
