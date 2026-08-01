# Implementation Status

Bu belge mynode'un gerçek durumunu belgeler: hangi özellik gerçek, hangisi
demo verisiyle çalışan bir arayüz kabuğu. Her fazın sonunda güncellenir.

**Durum tanımları:**
- `DEMO_ONLY` — sadece statik/mock veri gösterir, gerçek backend çağrısı yok.
- `PARTIAL` — bir miktar gerçek bağlantı var ama eksik/yarım.
- `PRODUCTION_READY` — gerçek backend ile uçtan uca çalışıyor.
- `BLOCKED` — sağlanmamış bir bağımlılık (anahtar, hesap, karar) olmadan ilerleyemez.

**Genel tespit:** Repo'da `app/api` dizini, `middleware.ts`, `lib/supabase*`,
`lib/auth*` veya `lib/env.ts` yok. `package.json`'da `@supabase/*`, `twilio`,
`@anthropic-ai/sdk`, `stripe`, `@sentry/*` paketleri **kurulu değil**. Bu proje
şu an saf bir Next.js/Tailwind arayüz kabuğu — hiçbir dış servise bağlı değil.

| # | Alan | Durum | Kanıt |
|---|---|---|---|
| 1 | Kimlik doğrulama | `DEMO_ONLY` | `components/auth/auth-screen.tsx` — kendi yorumu "DEMO BYPASS". Login/signup `setTimeout` ile `/dashboard`'a yönlendiriyor, kimlik kontrolü yok. `app/(app)/layout.tsx`'te ve hiçbir yerde route koruması/middleware yok — herhangi bir sayfa girişsiz açılıyor. "Çıkış yap" sadece `/login`'e link, session yok. |
| 2 | Organizasyon/ekip yapısı | `DEMO_ONLY` | Kod yok. Yalnızca pazarlama SSS metninde "Business planında roller" cümlesi var — hiçbir yerde model/switcher/davet akışı yok. |
| 3 | WhatsApp alma/gönderme | `DEMO_ONLY` | Twilio paketi kurulu değil, webhook route yok (`app/api` yok). `lib/demo/data.ts`'te `channel: "whatsapp"` etiketli mock konuşmalar var. |
| 4 | Instagram mesajları | `DEMO_ONLY` | Meta/Instagram API kodu yok. Sadece mock verilerde `channel: "instagram"` etiketi. |
| 5 | Web chat | `DEMO_ONLY` | Gömülebilir widget bileşeni/scripti yok. `web` sadece mock konuşmalarda üçüncü bir kanal etiketi. |
| 6 | AI cevap önerisi | `DEMO_ONLY` | Anthropic/OpenAI SDK kurulu değil, LLM çağıran route yok. Önerilen yanıt metinleri `lib/demo/data.ts`'te sabit string. "Gönder / Devret / Düzenle" butonlarının `onClick`'i yok. |
| 7 | Bilgi tabanı | `DEMO_ONLY` | `app/(app)/knowledge/page.tsx` statik `articles`/kategorileri render ediyor. Arama input'unun `onChange`'i yok (dekoratif). "Makale ekle" butonu işlevsiz — CRUD/dosya yükleme yok. |
| 8 | Otomasyonlar | `PARTIAL` | `app/(app)/automations/page.tsx`'te açma/kapama `toggle(id)` gerçek client-side state güncelliyor (istatistik şeridi tepki veriyor) — ama backend'e yazılmıyor, sayfa yenilenince sıfırlanıyor. Kural motoru veya "Yeni kural" işlevi yok. |
| 9 | Dashboard/KPI | `DEMO_ONLY` | `app/(app)/dashboard/page.tsx`'teki tüm sayılar (`kpis`, `sla`, `csatTrend`, `agentPerf` vb.) `lib/demo/data.ts`'ten sabit — fetch/sorgu yok. |
| 10 | Abonelik/faturalandırma | `DEMO_ONLY` | Stripe/ödeme SDK'sı yok, checkout route yok. Fiyat kartları (`app.config.ts` → `marketing.pricing`) yalnızca görsel metin; CTA'lar hiçbir işleme bağlı değil. |
| 11 | Yönetici paneli | `NOT PRESENT` | `/admin` rotası veya admin'e özel bileşen/koruma yok. |
| 12 | Loglama ve izleme | `NOT PRESENT` | Sentry veya özel logger modülü yok; structured logging yok. |
| 13 | KVKK/veri silme | `NOT PRESENT` | Veri dışa aktarma/silme özelliği hiçbir yerde yok. |
| — | Ayarlar / entegrasyon durumu rozetleri | `PARTIAL` | `app/(app)/settings/page.tsx` gerçekten `process.env[v]` kontrolü yapıp "Connected"/"Demo mode" rozeti gösteriyor (`app.config.ts`'teki `integrations` listesini okuyarak) — tek gerçek backend mantığı bu. Ama "Connected" görünse bile hiçbir SDK kurulu olmadığı için arka planda gerçekten Twilio/Anthropic/Supabase'e bağlanan bir şey yok. |

## Sonraki fazın önkoşulları

Faz 1 (veri modeli/RLS) ve Faz 2 (auth) başlamadan önce şu kullanıcı
kararları/kaynakları gerekiyor — tahmin yürütülmeyecek, sorulacak:

- Supabase projesi: mevcut mu, yoksa şimdi mi oluşturulacak (Project URL + anon key + service-role key).
- Twilio hesabı ve WhatsApp Business gönderici numarası.
- Anthropic API anahtarı ve kullanılacak model adı.
- Faz 10 için ödeme sağlayıcısı: Stripe mi, yoksa Türkiye için iyzico/PayTR mi.
- Meta/Instagram uygulaması (Faz 8'e kadar gerekmiyor, erken karar gerekmez).

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
