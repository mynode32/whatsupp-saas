/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  app.config.ts — the single source of truth for this starter.            │
 * │  Every user-facing string is bilingual: { tr, en }.                      │
 * │  Run `/setup` (or say "bu projeyi kur") to rebrand.                       │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
import type { L } from "@/lib/i18n/config";

export type IconName = string;

export interface NavItem { label: L; href: string; icon: IconName; }
export interface Feature { icon: IconName; title: L; body: L; }
export interface Stat { value: string; label: L; }
export interface PricingTier { name: string; price: string; period?: string; tagline: L; features: L[]; cta: L; featured?: boolean; }
export interface FaqItem { q: L; a: L; }
export interface Integration { key: string; name: string; envVars: string[]; required: boolean; docsUrl: string; purpose: string; }

export interface AppConfig {
  name: string;
  tagline: L;
  description: L;
  domain: string;
  logoText: string;
  accentName: string;
  marketing: {
    badge: L; heroTitle: L; heroAccent: L; heroSubtitle: L; heroCtaPrimary: L; heroCtaSecondary: L;
    features: Feature[]; stats: Stat[]; pricing: PricingTier[]; faq: FaqItem[];
  };
  nav: NavItem[];
  integrations: Integration[];
}

export const appConfig: AppConfig = {
  name: "mynode",
  tagline: { tr: "WhatsApp'taki her müşteriye saniyeler içinde yanıt.", en: "Reply to every customer on WhatsApp in seconds." },
  description: {
    tr: "mynode, WhatsApp ve diğer kanallardaki müşteri mesajlarını tek gelen kutusunda toplar; bilgi tabanından beslenen AI her mesaja markanın diliyle bir yanıt önerir — ekibin tek tıkla gönderir, gerisini otomasyonlar halleder.",
    en: "mynode unifies customer messages from WhatsApp and beyond into one inbox; a knowledge-grounded AI drafts a reply in your brand voice for every message — your team sends with one tap, automations handle the rest.",
  },
  domain: "mynode.app",
  logoText: "My",
  accentName: "indigo",

  marketing: {
    badge: { tr: "AI müşteri destek asistanı", en: "AI customer-support assistant" },
    heroTitle: { tr: "Müşterin yazıyor.", en: "Your customer is typing." },
    heroAccent: { tr: "Yanıt çoktan hazır.", en: "The reply is already drafted." },
    heroSubtitle: {
      tr: "mynode WhatsApp, Instagram ve web sohbetini tek gelen kutusuna bağlar; bilgi tabanından beslenen AI her mesaja markanın tonuyla doğru bir yanıt yazar. Ekibin onaylar, sık sorulanları otomasyon kapatır — bekleyen müşteri kalmaz.",
      en: "mynode connects WhatsApp, Instagram and web chat into one inbox; a knowledge-grounded AI writes an accurate reply in your brand tone for every message. Your team approves, automations close the routine ones — no customer left waiting.",
    },
    heroCtaPrimary: { tr: "Ücretsiz dene", en: "Try it free" },
    heroCtaSecondary: { tr: "90 sn'lik demoyu izle", en: "See a 90s demo" },
    features: [
      { icon: "messages-square", title: { tr: "Tek birleşik gelen kutusu", en: "One unified inbox" }, body: { tr: "WhatsApp, Instagram DM ve web sohbeti tek akışta toplanır. Ekibin hangi kanaldan geldiğine bakmadan, sırayla yanıtlar.", en: "WhatsApp, Instagram DM and web chat flow into one stream. Your team replies in order without juggling tabs." } },
      { icon: "sparkles", title: { tr: "AI yanıt önerisi", en: "AI-suggested replies" }, body: { tr: "Her mesaja bilgi tabanından beslenen, markanın diline uygun bir taslak yanıt hazırlanır. Düzelt, onayla, tek tıkla gönder.", en: "Every message gets a draft grounded in your knowledge base and tuned to your brand voice. Edit, approve, send in one tap." } },
      { icon: "book-open", title: { tr: "Bilgi tabanından beslenir", en: "Grounded in your knowledge" }, body: { tr: "SSS, kargo ve iade politikalarını ekle; AI cevapları uydurmaz, senin yazdıklarından alır ve kaynağını gösterir.", en: "Add your FAQs, shipping and refund policies; the AI doesn't invent answers — it cites yours and shows the source." } },
      { icon: "workflow", title: { tr: "Otomasyon kuralları", en: "Automation rules" }, body: { tr: "Kargo takibi, sipariş durumu, çalışma saatleri gibi tekrar edenleri kurallarla otomatik kapat; sadece insan gereken konular ekibe düşer.", en: "Auto-close repetitive asks — order status, hours, tracking — with rules, so only the human-needed ones reach your team." } },
      { icon: "gauge", title: { tr: "SLA & yanıt süresi", en: "SLA & response time" }, body: { tr: "İlk yanıt süresini, kuyruğu ve çözüm oranını canlı izle. Bir konuşma SLA'yı aşmadan önce uyarılırsın.", en: "Track first-response time, queue depth and resolution rate live. Get warned before a chat breaches SLA." } },
      { icon: "languages", title: { tr: "Çok dilli yanıt", en: "Multilingual replies" }, body: { tr: "Müşteri hangi dilde yazarsa yazsın, AI o dilde yanıtlar. Türkçe, İngilizce ve daha fazlası — ekstra ekip kurmadan.", en: "Whatever language a customer writes in, the AI answers in it. Turkish, English and more — without extra headcount." } },
    ],
    stats: [
      { value: "12 sn", label: { tr: "ortalama ilk yanıt", en: "average first response" } },
      { value: "%68", label: { tr: "AI ile otomatik çözüm", en: "deflected by AI" } },
      { value: "3 kanal", label: { tr: "tek gelen kutusunda", en: "in one inbox" } },
      { value: "0", label: { tr: "anahtarla dene", en: "keys to try it" } },
    ],
    pricing: [
      { name: "Başlangıç", price: "$0", period: "/ay", tagline: { tr: "İlk WhatsApp hattın için.", en: "For your first WhatsApp line." }, features: [{ tr: "1 kanal", en: "1 channel" }, { tr: "Aylık 300 konuşma", en: "300 chats / mo" }, { tr: "AI yanıt önerisi", en: "AI-suggested replies" }, { tr: "Bilgi tabanı", en: "Knowledge base" }], cta: { tr: "Ücretsiz başla", en: "Start free" } },
      { name: "Ekip", price: "$59", period: "/ay", tagline: { tr: "Büyüyen destek ekipleri için.", en: "For growing support teams." }, features: [{ tr: "3 kanal (WhatsApp, IG, web)", en: "3 channels (WhatsApp, IG, web)" }, { tr: "Sınırsız konuşma", en: "Unlimited chats" }, { tr: "Otomasyon kuralları", en: "Automation rules" }, { tr: "SLA & raporlar", en: "SLA & reports" }, { tr: "Çok dilli yanıt", en: "Multilingual replies" }], cta: { tr: "Ücretsiz dene", en: "Start free trial" }, featured: true },
      { name: "İşletme", price: "$199", period: "/ay", tagline: { tr: "Çok lokasyon & marka için.", en: "For multi-location & brands." }, features: [{ tr: "Sınırsız kanal", en: "Unlimited channels" }, { tr: "Roller & ekipler", en: "Roles & teams" }, { tr: "Özel marka tonu", en: "Custom brand voice" }, { tr: "Öncelikli destek", en: "Priority support" }], cta: { tr: "Bize ulaş", en: "Talk to us" } },
    ],
    faq: [
      { q: { tr: "Denemek için API anahtarı gerekli mi?", en: "Do I need API keys to try it?" }, a: { tr: "Hayır. mynode örnek konuşmalar, AI yanıt önerileri ve otomasyonlarla demo modda açılır; hemen tıklayıp gezebilirsin. Gerçek mesajlaşma için Twilio (WhatsApp) ve yanıtları üretmek için Anthropic anahtarını sonra ekle.", en: "No. mynode boots in demo mode with sample conversations, AI-suggested replies and automations so you can click around immediately. Add your Twilio (WhatsApp) and Anthropic keys later to message and draft for real." } },
      { q: { tr: "AI yanlış cevap verir mi?", en: "Will the AI give wrong answers?" }, a: { tr: "AI yalnızca senin bilgi tabanından cevap üretir ve kaynağını gösterir. Emin olmadığında ekibe devreder; ayrıca hiçbir yanıt sen onaylamadan gönderilmez (istersen güvendiğin akışları tam otomatik yapabilirsin).", en: "The AI only answers from your knowledge base and shows its source. When unsure it hands off to a human; and nothing sends until you approve it (you can fully automate flows you trust)." } },
      { q: { tr: "WhatsApp'a nasıl bağlanıyor?", en: "How does it connect to WhatsApp?" }, a: { tr: "Twilio WhatsApp Business API üzerinden. Numaranı bağlarsın, gelen mesajlar mynode'nın gelen kutusuna düşer; yanıtlar aynı numaradan gönderilir. Instagram ve web sohbeti de aynı kutuya akar.", en: "Through the Twilio WhatsApp Business API. You connect your number, inbound messages land in mynode's inbox, and replies go out from the same number. Instagram and web chat flow into the same inbox." } },
      { q: { tr: "Teknoloji nedir?", en: "What's the stack?" }, a: { tr: "Next.js 16, React 19, Tailwind v4. Her yere dağıtabileceğin standart bir uygulama.", en: "Next.js 16, React 19, Tailwind v4. It's a standard app you can deploy anywhere." } },
    ],
  },

  nav: [
    { label: { tr: "Genel", en: "Overview" }, href: "/dashboard", icon: "layout-dashboard" },
    { label: { tr: "Konuşmalar", en: "Conversations" }, href: "/conversations", icon: "messages-square" },
    { label: { tr: "Otomasyonlar", en: "Automations" }, href: "/automations", icon: "workflow" },
    { label: { tr: "Bilgi tabanı", en: "Knowledge" }, href: "/knowledge", icon: "book-open" },
    { label: { tr: "Ayarlar", en: "Settings" }, href: "/settings", icon: "settings" },
  ],

  integrations: [
    { key: "anthropic", name: "Anthropic (Claude)", envVars: ["ANTHROPIC_API_KEY"], required: false, docsUrl: "https://console.anthropic.com/settings/keys", purpose: "Drafts knowledge-grounded replies in your brand voice for every message." },
    { key: "twilio", name: "WhatsApp (Twilio)", envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], required: false, docsUrl: "https://www.twilio.com/console", purpose: "Connects your WhatsApp Business number to send and receive messages." },
    { key: "supabase", name: "Supabase", envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"], required: false, docsUrl: "https://supabase.com/dashboard/project/_/settings/api", purpose: "Stores conversations, knowledge and automations. Without it, runs in demo mode." },
  ],
};

export default appConfig;
