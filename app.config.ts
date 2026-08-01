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
    tr: "mynode, web sitendeki chatbotu dakikalar içinde yayına alır; web ve WhatsApp mesajlarını tek gelen kutusunda toplar, tekrarlanan soruları güvenli kurallarla otomatik yanıtlar.",
    en: "mynode launches your website chatbot in minutes, unifies web and WhatsApp messages in one inbox, and answers repetitive questions with safe automation rules.",
  },
  domain: "mynode.app",
  logoText: "My",
  accentName: "indigo",

  marketing: {
    badge: { tr: "Self-servis müşteri iletişim platformu", en: "Self-service customer messaging" },
    heroTitle: { tr: "Müşterin yazıyor.", en: "Your customer is typing." },
    heroAccent: { tr: "Yanıt çoktan hazır.", en: "The reply is already drafted." },
    heroSubtitle: {
      tr: "Hesabını aç, site adresini gir ve tek satır kodla chatbotunu yayına al. Web ve WhatsApp konuşmalarını aynı panelden yönet; Instagram bağlantısı Meta onayıyla aynı gelen kutusuna eklenir.",
      en: "Create your account, enter your website and launch your chatbot with one line of code. Manage web and WhatsApp conversations together; Instagram joins the same inbox after Meta approval.",
    },
    heroCtaPrimary: { tr: "Ücretsiz dene", en: "Try it free" },
    heroCtaSecondary: { tr: "90 sn'lik demoyu izle", en: "See a 90s demo" },
    features: [
      { icon: "messages-square", title: { tr: "Tek birleşik gelen kutusu", en: "One unified inbox" }, body: { tr: "Web chatbot ve WhatsApp bugün aynı akışta; Instagram DM bağlantısı Meta uygulama onayından sonra etkinleşir.", en: "Web chat and WhatsApp share one stream today; Instagram DM activates after Meta app approval." } },
      { icon: "sparkles", title: { tr: "Hızlı ve tutarlı yanıt", en: "Fast, consistent replies" }, body: { tr: "Hazır yanıtlar ve otomasyon kurallarıyla ekibin tekrar yazmaz; AI destekli taslaklar kontrollü beta olarak eklenecek.", en: "Saved replies and automation rules remove repetitive typing; AI-assisted drafts will follow as a controlled beta." } },
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
      { name: "Başlangıç", price: "$0", period: "/ay", tagline: { tr: "İlk web chatbotun için.", en: "For your first web chatbot." }, features: [{ tr: "1 web chatbot", en: "1 web chatbot" }, { tr: "Aylık 300 konuşma", en: "300 chats / mo" }, { tr: "Hazır yanıtlar", en: "Saved replies" }, { tr: "Bilgi tabanı", en: "Knowledge base" }], cta: { tr: "Ücretsiz başla", en: "Start free" } },
      { name: "Ekip", price: "$59", period: "/ay", tagline: { tr: "Büyüyen destek ekipleri için.", en: "For growing support teams." }, features: [{ tr: "Web + WhatsApp, Instagram beta", en: "Web + WhatsApp, Instagram beta" }, { tr: "Sınırsız konuşma", en: "Unlimited chats" }, { tr: "Otomasyon kuralları", en: "Automation rules" }, { tr: "Yanıt süresi raporları", en: "Response-time reports" }, { tr: "Ekip rolleri", en: "Team roles" }], cta: { tr: "Pilot erişim iste", en: "Request pilot access" }, featured: true },
      { name: "İşletme", price: "$199", period: "/ay", tagline: { tr: "Çok lokasyon & marka için.", en: "For multi-location & brands." }, features: [{ tr: "Sınırsız kanal", en: "Unlimited channels" }, { tr: "Roller & ekipler", en: "Roles & teams" }, { tr: "Özel marka tonu", en: "Custom brand voice" }, { tr: "Öncelikli destek", en: "Priority support" }], cta: { tr: "Bize ulaş", en: "Talk to us" } },
    ],
    faq: [
      { q: { tr: "Denemek için API anahtarı gerekli mi?", en: "Do I need API keys to try it?" }, a: { tr: "Ana sayfadaki etkileşimli demo anahtarsız çalışır. Gerçek hesap ve chatbot verisi için Supabase; WhatsApp için Twilio gerekir. Instagram bağlantısı Meta uygulama onayından sonra açılır.", en: "The interactive landing-page demo needs no keys. Real accounts and chatbot data require Supabase, while WhatsApp requires Twilio. Instagram activates after Meta app approval." } },
      { q: { tr: "AI yanlış cevap verir mi?", en: "Will the AI give wrong answers?" }, a: { tr: "AI taslak özelliği kontrollü beta olarak planlanıyor. Aktif edildiğinde bilgi tabanı kaynakları ve insan onayı kullanılacak; mevcut otomasyonlar yalnızca senin açıkça yazdığın kuralları çalıştırır.", en: "AI drafting is planned as a controlled beta. When enabled it will use knowledge sources and human approval; current automations execute only the rules you explicitly configure." } },
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
    { key: "openai", name: "OpenAI (GPT)", envVars: ["OPENAI_API_KEY"], required: false, docsUrl: "https://platform.openai.com/api-keys", purpose: "Alternative to Anthropic for drafting knowledge-grounded replies — set either, not both." },
    { key: "twilio", name: "WhatsApp (Twilio)", envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"], required: false, docsUrl: "https://www.twilio.com/console", purpose: "Connects your WhatsApp Business number to send and receive messages." },
    { key: "meta", name: "Instagram (Meta)", envVars: ["META_APP_ID", "META_APP_SECRET", "META_VERIFY_TOKEN"], required: false, docsUrl: "https://developers.facebook.com/apps", purpose: "Receives Instagram Direct messages in the unified inbox; customer OAuth activation follows Meta app approval." },
    { key: "supabase", name: "Supabase", envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"], required: false, docsUrl: "https://supabase.com/dashboard/project/_/settings/api", purpose: "Stores conversations, knowledge and automations. Without it, runs in demo mode." },
  ],
};

export default appConfig;
