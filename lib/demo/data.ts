/**
 * mynode demo data — a live customer-support motion: WhatsApp / Instagram /
 * web conversations, AI-suggested replies, KPIs, channel mix, automations,
 * intents and a knowledge base. Labels are bilingual ({ tr, en }); pages
 * resolve them to the active language. Customer names and message text stay
 * as-is (content). With no API keys, the whole app renders from this file.
 * Wire Anthropic + Twilio (run /setup) to draft and message live.
 */
import type { L } from "@/lib/i18n/config";

export type Channel = "whatsapp" | "instagram" | "web";
export type Status = "open" | "pending" | "resolved";

/* ── Dashboard KPIs ──────────────────────────────────────────────────────── */
export interface Kpi { label: L; value: string; delta?: number; icon: string; hint: L; }

export const kpis: Kpi[] = [
  { label: { tr: "Açık konuşma", en: "Open chats" }, value: "18", delta: -12.0, icon: "inbox", hint: { tr: "şu an kuyrukta", en: "in queue now" } },
  { label: { tr: "Ortalama ilk yanıt", en: "Avg first response" }, value: "12 sn", delta: -34.0, icon: "timer", hint: { tr: "AI taslakla", en: "with AI drafts" } },
  { label: { tr: "Çözüm oranı", en: "Resolution rate" }, value: "%94", delta: 3.2, icon: "circle-check", hint: { tr: "son 7 gün", en: "last 7 days" } },
  { label: { tr: "AI ile otomatik çözüm", en: "Deflected by AI" }, value: "%68", delta: 6.1, icon: "sparkles", hint: { tr: "insan gerekmedi", en: "no human needed" } },
];

/* ── Hero (live) ─────────────────────────────────────────────────────────── */
export const heroWaiting = 6; // chats waiting for a reply
export const heroHandledToday = 214;
export const heroAvgResponseSec = 12;

/** Today's response-time sparkline (seconds to first reply, hour by hour). */
export const responseTrend: number[] = [22, 18, 26, 15, 12, 9, 14, 11, 8, 10, 7, 12];

export const dashInsight: L = {
  tr: "Bugün gelen mesajların %72'si bilgi tabanından otomatik yanıtlandı. En çok “kargo nerede?” soruldu — otomasyon zaten devrede, ekibin yalnızca 6 özel duruma bakıyor.",
  en: "72% of today's messages were auto-answered from the knowledge base. The top ask was “where's my order?” — the automation has it covered, leaving your team just 6 edge cases.",
};

/* ── Channel breakdown ───────────────────────────────────────────────────── */
export const channelMix: { channel: Channel; label: L; value: number; hue: number; icon: string }[] = [
  { channel: "whatsapp", label: { tr: "WhatsApp", en: "WhatsApp" }, value: 1840, hue: 152, icon: "message-circle" },
  { channel: "instagram", label: { tr: "Instagram", en: "Instagram" }, value: 920, hue: 320, icon: "at-sign" },
  { channel: "web", label: { tr: "Web sohbet", en: "Web chat" }, value: 540, hue: 232, icon: "globe" },
];

export const channelMeta: Record<Channel, { label: L; hue: number; icon: string }> = {
  whatsapp: { label: { tr: "WhatsApp", en: "WhatsApp" }, hue: 152, icon: "message-circle" },
  instagram: { label: { tr: "Instagram", en: "Instagram" }, hue: 320, icon: "at-sign" },
  web: { label: { tr: "Web sohbet", en: "Web chat" }, hue: 232, icon: "globe" },
};

/* ── Top intents (what customers ask) ────────────────────────────────────── */
export const topIntents: { label: L; share: number; auto: boolean }[] = [
  { label: { tr: "Kargo / sipariş takibi", en: "Order tracking" }, share: 34, auto: true },
  { label: { tr: "İade & değişim", en: "Returns & exchanges" }, share: 21, auto: true },
  { label: { tr: "Ürün / stok sorusu", en: "Product / stock" }, share: 18, auto: true },
  { label: { tr: "Çalışma saatleri", en: "Opening hours" }, share: 12, auto: true },
  { label: { tr: "Şikayet / özel durum", en: "Complaint / edge case" }, share: 9, auto: false },
  { label: { tr: "Diğer", en: "Other" }, share: 6, auto: false },
];

/* ── Status mix for the queue ────────────────────────────────────────────── */
export const statusMeta: Record<Status, { label: L; tone: "info" | "warning" | "success" }> = {
  open: { label: { tr: "Açık", en: "Open" }, tone: "info" },
  pending: { label: { tr: "Bekliyor", en: "Pending" }, tone: "warning" },
  resolved: { label: { tr: "Çözüldü", en: "Resolved" }, tone: "success" },
};

/* ── Agents on shift ─────────────────────────────────────────────────────── */
export const agents: { name: string; initials: string; open: number; online: boolean }[] = [
  { name: "Elif Demir", initials: "ED", open: 4, online: true },
  { name: "Can Yıldız", initials: "CY", open: 3, online: true },
  { name: "mynode AI", initials: "AI", open: 9, online: true },
  { name: "Mert Aksoy", initials: "MA", open: 2, online: false },
];

/* ── SLA & queue health (dashboard band) ─────────────────────────────────── */
export const sla = {
  target: 60, // first-response target, seconds
  withinTarget: 96, // % of chats answered within target
  breaching: 1, // chats at risk of breaching now
  queueByPriority: [
    { label: { tr: "Acil", en: "Urgent" } as L, count: 2, tone: "destructive" as const },
    { label: { tr: "Normal", en: "Normal" } as L, count: 9, tone: "info" as const },
    { label: { tr: "Düşük", en: "Low" } as L, count: 7, tone: "neutral" as const },
  ],
  oldestWaitMin: 22,
};

/* ── Conversations (the signature data) ──────────────────────────────────── */
export interface ChatMessage { from: "customer" | "agent"; text: string; at: string; ai?: boolean; }

export interface Conversation {
  id: string;
  customer: string;
  initials: string;
  channel: Channel;
  status: Status;
  lastMessage: string;
  waitingMin: number; // minutes since the customer's last message
  unread: boolean;
  intent: L;
  /** AI-suggested reply mynode drafted for the latest customer message. */
  suggested: string;
  /** Knowledge source the suggestion is grounded in. */
  source: L;
  /** Confidence the AI has in its draft (0-100). */
  confidence: number;
  thread: ChatMessage[];
}

export const conversations: Conversation[] = [
  {
    id: "c1",
    customer: "Ayşe Kaya",
    initials: "AK",
    channel: "whatsapp",
    status: "open",
    lastMessage: "Merhaba, dün verdiğim sipariş hâlâ kargoya verilmemiş. Ne zaman çıkar?",
    waitingMin: 2,
    unread: true,
    intent: { tr: "Kargo / sipariş takibi", en: "Order tracking" },
    suggested:
      "Merhaba Ayşe Hanım, siparişiniz (#48213) bugün kargoya verildi 📦 Yarın 18:00'e kadar elinizde olur. Takip numaranız: TR-7741-2290. Başka bir konuda yardımcı olabilir miyim?",
    source: { tr: "Bilgi tabanı · Kargo süreleri", en: "Knowledge · Shipping times" },
    confidence: 96,
    thread: [
      { from: "customer", text: "Merhaba, dün bir sipariş verdim.", at: "2026-06-13T09:58:00Z" },
      { from: "customer", text: "Merhaba, dün verdiğim sipariş hâlâ kargoya verilmemiş. Ne zaman çıkar?", at: "2026-06-13T10:04:00Z" },
    ],
  },
  {
    id: "c2",
    customer: "Mehmet Yıldız",
    initials: "MY",
    channel: "instagram",
    status: "open",
    lastMessage: "Bu elbisenin M bedeni stokta var mı acaba?",
    waitingMin: 5,
    unread: true,
    intent: { tr: "Ürün / stok sorusu", en: "Product / stock" },
    suggested:
      "Merhaba! Sorduğunuz “Lila Saten Elbise” M bedeni şu an stokta mevcut ✅ Hemen sipariş vermek isterseniz size hızlı bir link gönderebilirim. Renk tercihiniz var mı?",
    source: { tr: "Bilgi tabanı · Stok durumu", en: "Knowledge · Stock status" },
    confidence: 91,
    thread: [
      { from: "customer", text: "Selam, bir ürünü soracaktım 🙂", at: "2026-06-13T09:55:00Z" },
      { from: "customer", text: "Bu elbisenin M bedeni stokta var mı acaba?", at: "2026-06-13T10:01:00Z" },
    ],
  },
  {
    id: "c3",
    customer: "Zeynep Arslan",
    initials: "ZA",
    channel: "whatsapp",
    status: "pending",
    lastMessage: "İade etmek istiyorum ama kutusunu açtım, sorun olur mu?",
    waitingMin: 14,
    unread: false,
    intent: { tr: "İade & değişim", en: "Returns & exchanges" },
    suggested:
      "Tabii ki olur Zeynep Hanım 🙂 Ürün denenmiş olsa bile 14 gün içinde iade kabul ediyoruz; kutunun açılmış olması sorun değil. Size ücretsiz iade kodu oluşturayım mı?",
    source: { tr: "Bilgi tabanı · İade politikası", en: "Knowledge · Return policy" },
    confidence: 94,
    thread: [
      { from: "customer", text: "Aldığım ayakkabı biraz dar geldi.", at: "2026-06-13T09:40:00Z" },
      { from: "agent", text: "Çok üzüldüm, hemen yardımcı olalım. İade mi değişim mi düşünüyorsunuz?", at: "2026-06-13T09:44:00Z", ai: false },
      { from: "customer", text: "İade etmek istiyorum ama kutusunu açtım, sorun olur mu?", at: "2026-06-13T09:50:00Z" },
    ],
  },
  {
    id: "c4",
    customer: "Burak Şahin",
    initials: "BŞ",
    channel: "web",
    status: "open",
    lastMessage: "Mağazanız hafta sonu kaçta açılıyor?",
    waitingMin: 1,
    unread: true,
    intent: { tr: "Çalışma saatleri", en: "Opening hours" },
    suggested:
      "Merhaba! Mağazamız cumartesi 10:00–20:00, pazar 12:00–19:00 arası açık 🕙 Beşiktaş şubemize bekleriz. Başka bir sorunuz olursa buradayım.",
    source: { tr: "Bilgi tabanı · Mağaza saatleri", en: "Knowledge · Store hours" },
    confidence: 98,
    thread: [
      { from: "customer", text: "Mağazanız hafta sonu kaçta açılıyor?", at: "2026-06-13T10:06:00Z" },
    ],
  },
  {
    id: "c5",
    customer: "Selin Öztürk",
    initials: "SÖ",
    channel: "whatsapp",
    status: "pending",
    lastMessage: "Siparişim yanlış geldi, kırmızı istemiştim siyah gelmiş. Çok kötü hissediyorum.",
    waitingMin: 22,
    unread: false,
    intent: { tr: "Şikayet / özel durum", en: "Complaint / edge case" },
    suggested:
      "Selin Hanım, yaşattığımız bu karışıklık için çok özür dileriz. Doğru ürünü bugün ücretsiz kargoyla yola çıkarıyoruz, yanlış geleni de bizden almanıza gerek yok. Bunu sizin için hızlandırıyorum — bir ekip arkadaşımız da kişisel olarak takip edecek.",
    source: { tr: "İnsana devret önerildi · düşük güven", en: "Hand-off suggested · low confidence" },
    confidence: 58,
    thread: [
      { from: "customer", text: "Siparişim bugün geldi ama...", at: "2026-06-13T09:30:00Z" },
      { from: "customer", text: "Siparişim yanlış geldi, kırmızı istemiştim siyah gelmiş. Çok kötü hissediyorum.", at: "2026-06-13T09:38:00Z" },
    ],
  },
  {
    id: "c6",
    customer: "Deniz Aydın",
    initials: "DA",
    channel: "instagram",
    status: "resolved",
    lastMessage: "Çok teşekkürler, hallettiniz 🙏",
    waitingMin: 0,
    unread: false,
    intent: { tr: "Kargo / sipariş takibi", en: "Order tracking" },
    suggested:
      "Rica ederiz Deniz Bey 🙏 İyi günler dileriz, tekrar bekleriz!",
    source: { tr: "Bilgi tabanı · Kapanış", en: "Knowledge · Closing" },
    confidence: 99,
    thread: [
      { from: "customer", text: "Kargom nerede?", at: "2026-06-13T08:10:00Z" },
      { from: "agent", text: "Bugün dağıtıma çıktı, akşam elinizde 📦", at: "2026-06-13T08:11:00Z", ai: true },
      { from: "customer", text: "Çok teşekkürler, hallettiniz 🙏", at: "2026-06-13T08:20:00Z" },
    ],
  },
  {
    id: "c7",
    customer: "Emre Çelik",
    initials: "EÇ",
    channel: "web",
    status: "resolved",
    lastMessage: "Tamamdır, iade kodunu aldım.",
    waitingMin: 0,
    unread: false,
    intent: { tr: "İade & değişim", en: "Returns & exchanges" },
    suggested: "Harika! İade ürününüz elimize ulaşınca 3 iş günü içinde ücret iadeniz yapılır. İyi günler!",
    source: { tr: "Bilgi tabanı · İade politikası", en: "Knowledge · Return policy" },
    confidence: 97,
    thread: [
      { from: "customer", text: "İade etmek istiyorum.", at: "2026-06-12T16:00:00Z" },
      { from: "agent", text: "İade kodunuz: IADE-9921. Kargoya verebilirsiniz.", at: "2026-06-12T16:01:00Z", ai: true },
      { from: "customer", text: "Tamamdır, iade kodunu aldım.", at: "2026-06-12T16:05:00Z" },
    ],
  },
];

/* ── Recent activity feed (dashboard) ────────────────────────────────────── */
export interface Activity { id: string; who: string; action: L; target: string; at: string; tone: "success" | "info" | "warning"; }

export const activity: Activity[] = [
  { id: "a1", who: "mynode AI", action: { tr: "otomatik yanıtladı:", en: "auto-answered" }, target: "Deniz Aydın · WhatsApp", at: "2026-06-13T08:21:00Z", tone: "success" },
  { id: "a2", who: "Elif Demir", action: { tr: "çözdü:", en: "resolved" }, target: "Emre Çelik · web sohbet", at: "2026-06-13T09:02:00Z", tone: "success" },
  { id: "a3", who: "Otomasyon", action: { tr: "kargo durumu gönderdi:", en: "sent tracking to" }, target: "23 müşteri", at: "2026-06-13T09:30:00Z", tone: "info" },
  { id: "a4", who: "Sistem", action: { tr: "insana devretti — düşük güven:", en: "handed off — low confidence" }, target: "Selin Öztürk · şikayet", at: "2026-06-13T09:39:00Z", tone: "warning" },
  { id: "a5", who: "Can Yıldız", action: { tr: "AI taslağını onayladı:", en: "approved AI draft for" }, target: "Zeynep Arslan · iade", at: "2026-06-13T09:51:00Z", tone: "info" },
];

/* ── Automations page ────────────────────────────────────────────────────── */
export type AutomationStatus = "active" | "paused";
export interface Automation {
  id: string;
  name: L;
  trigger: L;
  action: L;
  status: AutomationStatus;
  icon: string;
  runs7d: number;
  deflect: number; // % of triggers fully resolved without a human
}

export const automations: Automation[] = [
  { id: "au1", name: { tr: "Kargo takibi", en: "Order tracking" }, trigger: { tr: "Müşteri “kargom nerede” yazdığında", en: "When a customer asks “where's my order”" }, action: { tr: "Sipariş no'yu sor, takip linkini gönder", en: "Ask for order no., send tracking link" }, status: "active", icon: "truck", runs7d: 642, deflect: 91 },
  { id: "au2", name: { tr: "İade akışı", en: "Return flow" }, trigger: { tr: "Müşteri iade/değişim istediğinde", en: "When a customer requests a return/exchange" }, action: { tr: "Politikayı açıkla, iade kodu oluştur", en: "Explain policy, generate a return code" }, status: "active", icon: "rotate-ccw", runs7d: 318, deflect: 84 },
  { id: "au3", name: { tr: "Çalışma saatleri", en: "Opening hours" }, trigger: { tr: "Saat / konum sorulduğunda", en: "When asked about hours / location" }, action: { tr: "Şube saatlerini ve haritayı gönder", en: "Send branch hours and a map" }, status: "active", icon: "clock", runs7d: 204, deflect: 99 },
  { id: "au4", name: { tr: "Çalışma dışı karşılama", en: "Out-of-hours greeting" }, trigger: { tr: "Mesai dışında mesaj geldiğinde", en: "When a message arrives off-hours" }, action: { tr: "Karşıla, sabah dönüleceğini bildir", en: "Greet, promise a morning reply" }, status: "active", icon: "moon", runs7d: 472, deflect: 76 },
  { id: "au5", name: { tr: "Şikayet yükseltme", en: "Complaint escalation" }, trigger: { tr: "Olumsuz ton / şikayet algılandığında", en: "When negative tone / complaint is detected" }, action: { tr: "Hemen bir insana ata, öncelik ver", en: "Assign a human now, mark priority" }, status: "active", icon: "flag", runs7d: 58, deflect: 0 },
  { id: "au6", name: { tr: "İndirim kodu kampanyası", en: "Discount code campaign" }, trigger: { tr: "Yeni takipçi ilk DM attığında", en: "When a new follower sends a first DM" }, action: { tr: "Hoş geldin + %10 kod gönder", en: "Send welcome + 10% code" }, status: "paused", icon: "ticket-percent", runs7d: 0, deflect: 0 },
];

/* ── Knowledge base page ─────────────────────────────────────────────────── */
export interface Article {
  id: string;
  title: L;
  category: L;
  excerpt: L;
  uses: number; // times the AI cited this article in the last 7 days
  updated: string;
}

export const knowledgeCategories: { label: L; icon: string }[] = [
  { label: { tr: "Tümü", en: "All" }, icon: "library" },
  { label: { tr: "Kargo", en: "Shipping" }, icon: "truck" },
  { label: { tr: "İade", en: "Returns" }, icon: "rotate-ccw" },
  { label: { tr: "Ürünler", en: "Products" }, icon: "shopping-bag" },
  { label: { tr: "Mağaza", en: "Store" }, icon: "store" },
];

export const articles: Article[] = [
  { id: "k1", title: { tr: "Kargo süreleri ve ücretleri", en: "Shipping times & fees" }, category: { tr: "Kargo", en: "Shipping" }, excerpt: { tr: "Siparişler 1 iş günü içinde kargoya verilir; 250₺ üzeri ücretsizdir. İstanbul içi ertesi gün, yurt içi 2-3 iş günü.", en: "Orders ship within 1 business day; free over ₺250. Next-day within İstanbul, 2-3 days nationwide." }, uses: 642, updated: "2026-06-10" },
  { id: "k2", title: { tr: "İade ve değişim politikası", en: "Return & exchange policy" }, category: { tr: "İade", en: "Returns" }, excerpt: { tr: "14 gün içinde, denenmiş olsa bile iade kabul edilir. İade kargosu ücretsizdir; ücret iadesi ürün elimize ulaşınca 3 iş günü içinde yapılır.", en: "Returns accepted within 14 days, even if tried on. Return shipping is free; refunds in 3 business days after we receive the item." }, uses: 318, updated: "2026-06-08" },
  { id: "k3", title: { tr: "Beden tablosu ve kalıp", en: "Size guide & fit" }, category: { tr: "Ürünler", en: "Products" }, excerpt: { tr: "Ürünler standart bedendir; aralarda kalanlara bir beden büyük öneririz. Detaylı tablo her ürün sayfasında.", en: "Products run true to size; for in-betweeners we suggest sizing up. Full chart on each product page." }, uses: 187, updated: "2026-06-05" },
  { id: "k4", title: { tr: "Stok ve yeniden gelecek ürünler", en: "Stock & restocks" }, category: { tr: "Ürünler", en: "Products" }, excerpt: { tr: "Tükenen popüler ürünler genellikle 2 hafta içinde yenilenir. “Haber ver” isteyen müşterilere otomatik bildirim gider.", en: "Sold-out best-sellers usually restock within 2 weeks. Customers who ask to be notified get an automatic alert." }, uses: 142, updated: "2026-06-03" },
  { id: "k5", title: { tr: "Mağaza saatleri ve adresler", en: "Store hours & locations" }, category: { tr: "Mağaza", en: "Store" }, excerpt: { tr: "Beşiktaş: hafta içi 10–21, cumartesi 10–20, pazar 12–19. Kadıköy şubesi yakında açılıyor.", en: "Beşiktaş: weekdays 10–21, Sat 10–20, Sun 12–19. Kadıköy branch opening soon." }, uses: 204, updated: "2026-06-09" },
  { id: "k6", title: { tr: "Ödeme yöntemleri ve taksit", en: "Payment & installments" }, category: { tr: "Mağaza", en: "Store" }, excerpt: { tr: "Tüm kredi kartları, kapıda ödeme ve 500₺ üzeri 3 taksit kabul edilir. Havale/EFT için indirim uygulanır.", en: "All cards, cash on delivery, and 3 installments over ₺500. Bank transfer gets a discount." }, uses: 96, updated: "2026-06-02" },
];

export const knowledgeStats = {
  articles: 24,
  coverage: 92, // % of incoming questions covered
  citedToday: 156,
};

/* ── Dashboard: extra KPIs (CSAT, automation savings) ────────────────────── */
export const extraKpis: Kpi[] = [
  { label: { tr: "Memnuniyet (CSAT)", en: "Satisfaction (CSAT)" }, value: "4.8", delta: 4.3, icon: "star", hint: { tr: "5 üzerinden · 7 gün", en: "out of 5 · 7 days" } },
  { label: { tr: "Bugün gelen mesaj", en: "Messages today" }, value: "1.284", delta: 9.4, icon: "message-square", hint: { tr: "tüm kanallar", en: "all channels" } },
];

/* ── Dashboard: response-time over the last 7 days (seconds to first reply) ─ */
export const responseByDay: { day: L; sec: number }[] = [
  { day: { tr: "Pzt", en: "Mon" }, sec: 28 },
  { day: { tr: "Sal", en: "Tue" }, sec: 22 },
  { day: { tr: "Çar", en: "Wed" }, sec: 19 },
  { day: { tr: "Per", en: "Thu" }, sec: 24 },
  { day: { tr: "Cum", en: "Fri" }, sec: 16 },
  { day: { tr: "Cmt", en: "Sat" }, sec: 14 },
  { day: { tr: "Paz", en: "Sun" }, sec: 12 },
];

/* ── Dashboard: CSAT trend over 7 days (out of 5) ────────────────────────── */
export const csatTrend: number[] = [4.2, 4.3, 4.4, 4.5, 4.5, 4.7, 4.8];

/* ── Dashboard: per-intent detail (volume + AI deflection + avg handle) ──── */
export const intentDetail: { label: L; volume: number; deflect: number; avgSec: number; tone: number }[] = [
  { label: { tr: "Kargo / sipariş takibi", en: "Order tracking" }, volume: 437, deflect: 91, avgSec: 9, tone: 152 },
  { label: { tr: "İade & değişim", en: "Returns & exchanges" }, volume: 269, deflect: 84, avgSec: 14, tone: 258 },
  { label: { tr: "Ürün / stok sorusu", en: "Product / stock" }, volume: 231, deflect: 79, avgSec: 11, tone: 232 },
  { label: { tr: "Çalışma saatleri", en: "Opening hours" }, volume: 154, deflect: 99, avgSec: 6, tone: 80 },
  { label: { tr: "Şikayet / özel durum", en: "Complaint / edge case" }, volume: 116, deflect: 22, avgSec: 38, tone: 25 },
];

/* ── Dashboard: agent performance (today) ────────────────────────────────── */
export const agentPerf: { name: string; initials: string; handled: number; avgSec: number; csat: number; online: boolean }[] = [
  { name: "Elif Demir", initials: "ED", handled: 64, avgSec: 31, csat: 4.9, online: true },
  { name: "Can Yıldız", initials: "CY", handled: 51, avgSec: 38, csat: 4.7, online: true },
  { name: "mynode AI", initials: "AI", handled: 872, avgSec: 8, csat: 4.8, online: true },
  { name: "Mert Aksoy", initials: "MA", handled: 29, avgSec: 44, csat: 4.6, online: false },
];
