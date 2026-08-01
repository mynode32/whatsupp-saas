"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight, ArrowRight, Check, X, Plus, Minus, Sparkles, MessagesSquare,
  BookOpen, Workflow, Gauge, Languages, MessageCircle, AtSign, Globe,
  ShieldCheck, Zap, Clock, Quote, ShoppingBag, UtensilsCrossed, Stethoscope, Building2,
  Send, Mail, Inbox, Truck, RotateCcw, PackageSearch, CalendarClock, Star,
  TrendingUp, Plug, Bot, Headphones,
} from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/components/i18n/language-provider";
import appConfig from "@/app.config";
import { cn } from "@/lib/utils";

const featureIcons = [MessagesSquare, Sparkles, BookOpen, Workflow, Gauge, Languages];
const caseIcons: Record<string, typeof ShoppingBag> = {
  "shopping-bag": ShoppingBag, "utensils-crossed": UtensilsCrossed, stethoscope: Stethoscope, "building-2": Building2,
};

const content = {
  tr: {
    nav: ["Özellikler", "Nasıl çalışır", "Fiyatlar"], signin: "Giriş yap", demo: "Demoyu aç",
    h1a: "Müşterin yazıyor.", h1b: "Yanıt çoktan hazır.",
    sub: "mynode WhatsApp, Instagram ve web sohbetini tek gelen kutusuna bağlar; bilgi tabanından beslenen AI her mesaja markanın tonuyla doğru bir yanıt yazar. Ekibin onaylar, sık sorulanları otomasyon kapatır.",
    cta1: "Ücretsiz dene", cta2: "Nasıl çalışır", social: "1.200+ ekip müşterilerini mynode'yla bekletmeden yanıtlıyor.",
    marqueeTitle: "Her kanaldaki her mesaj — tek kutuda",
    marquee: ["WhatsApp", "Instagram", "Web sohbet", "Kargo takibi", "İade", "Stok sorusu", "Şikayet", "Çalışma saatleri", "Sipariş durumu", "Çok dilli"],
    problemKicker: "Tanıdık geldi mi",
    problemH: ["Mesajlar birikiyor,", "müşteri bekliyor."],
    problemBody: "WhatsApp'ta 40 okunmamış. Instagram DM'de aynı “kargom nerede?” onuncu kez. Mesai bittiğinde gelen sorular sabaha kalıyor. mynode hepsini tek, sakin bir yere indirir — ve çoğunu sen uyurken bile yanıtlar.",
    problemStats: [{ n: "40+", l: "okunmamış mesaj, her sabah" }, { n: "8 sa", l: "gece gelen sorular bekliyor" }, { n: "%60", l: "aynı 5 sorunun tekrarı" }, { n: "3", l: "ayrı uygulama, tek kutu yok" }],
    whatKicker: "Ne yapar",
    whatH: ["Altı sakin yetenek,", "tek gelen kutusunda."],
    stepsKicker: "Nasıl çalışır",
    stepsH: "Üç adımda devrede.",
    steps: [
      { t: "Kanalları bağla", b: "WhatsApp numaranı, Instagram'ı ve web sohbetini birkaç dakikada bağla." },
      { t: "Bilgi tabanını ver", b: "SSS, kargo ve iade politikalarını ekle; AI yalnızca senin yazdıklarından cevaplar." },
      { t: "Onayla & otomatikleş", b: "Önce taslakları onayla; güvendiğin akışları tek tıkla tam otomatik yap." },
    ],
    casesKicker: "Kimler kullanıyor",
    casesH: ["Mesaj alan herkes için,", "ama özellikle:"],
    cases: [
      { icon: "shopping-bag", t: "E-ticaret & DTC", b: "Kargo, iade ve stok sorularının %80'ini sen uyurken kapat." },
      { icon: "utensils-crossed", t: "Restoran & rezervasyon", b: "Masa, menü ve saat sorularını otomatik yanıtla; çağrıyı azalt." },
      { icon: "stethoscope", t: "Klinik & randevu", b: "Randevu, fiyat ve yol tarifi sorularını anında, doğru bilgiyle yanıtla." },
      { icon: "building-2", t: "Ajans & çok-müşteri", b: "Her müşteri için ayrı bilgi tabanı ve marka tonu; tek panelden yönet." },
    ],
    proofKicker: "Sonuç",
    proof: [{ big: "12 sn", l: "ortalama ilk yanıt", c: "AI taslak hazır geldiği için" }, { big: "%68", l: "AI ile otomatik çözüm", c: "İnsan gerekmeden kapanan" }, { big: "3.1×", l: "daha fazla konuşma / kişi", c: "Aynı ekiple" }],
    quote: "“Akşamları gelen WhatsApp mesajları sabaha kalmıyordu artık. mynode çoğunu kendi kapatıyor, ekibim sadece gerçekten önemli olanlara bakıyor.”",
    quoteName: "Selin Ö.", quoteRole: "Kurucu · butik moda markası",
    trustKicker: "Sessiz söz",
    trustH: ["AI uydurmaz.", "Senin sözünü söyler."],
    trustBody: "mynode yalnızca senin bilgi tabanından cevap üretir ve kaynağını gösterir. Emin olmadığında bir insana devreder; istemediğin sürece hiçbir yanıt onaysız gönderilmez.",
    trustBullets: ["Kaynaklı yanıt: her taslak hangi makaleden geldiğini gösterir.", "Düşük güvende devret: AI emin değilse konuşmayı ekibe atar.", "Önce onay: güvenene kadar tek tıkla gönder, sonra otomatikleştir.", "Markanın tonu: her yanıt senin diline ve kurallarına uyar."],
    pricingKicker: "Fiyatlar", pricingH: ["Tek kutu.", "Dürüst fiyat."],
    faqKicker: "Merak edilenler", faqH: "Kısa cevaplar.",
    finaleKicker: "Dene · 90 saniye", finaleH: "Müşterini bekletme.",
    finaleBody: "Önceden doldurulmuş canlı bir demo — her konuşma, her AI taslağı tıklanabilir. Kart yok, kayıt yok.",
    footTagline: "WhatsApp'taki her müşteriye markanın diliyle, saniyeler içinde yanıt.",
    recommended: "Önerilen",
    previewWaiting: "yeni mesaj",
    previewSuggested: "AI önerisi", previewSource: "Bilgi tabanı · Kargo süreleri", previewSend: "Tek tıkla gönder", previewConf: "güven",

    /* Interactive live demo */
    demoKicker: "Canlı dene",
    demoH: ["Yanıtı canlı gör.", "Tıkla, gönder, izle."],
    demoBody: "Gerçek bir gelen kutusu gibi. Müşteri yazar, mynode bir taslak hazırlar — “gönder”e bas, yanıt gitsin ve bir sonraki mesaj düşsün.",
    demoCustomer: "Ayşe Kaya", demoChannel: "WhatsApp",
    demoSourceLabel: "Bilgi tabanı", demoConf: "güven", demoSend: "Yanıtı gönder", demoSent: "Gönderildi",
    demoTyping: "Ayşe yazıyor…",
    demoEmpty: "Tüm mesajlar yanıtlandı 🎉 Demo bitti.",
    demoReset: "Demoyu sıfırla",
    demoTurns: [
      { incoming: "Merhaba, dün verdiğim sipariş hâlâ kargoya verilmemiş. Ne zaman çıkar?", draft: "Merhaba Ayşe Hanım, siparişiniz (#48213) bugün kargoya verildi 📦 Yarın 18:00'e kadar elinizde olur. Takip no: TR-7741-2290.", source: "Kargo süreleri", conf: 96 },
      { incoming: "Harika, peki iade etmem gerekirse kutuyu açmış olmam sorun olur mu?", draft: "Hiç sorun değil 🙂 Ürün denenmiş olsa bile 14 gün içinde iade kabul ediyoruz. İsterseniz size hemen ücretsiz iade kodu oluşturabilirim.", source: "İade politikası", conf: 94 },
      { incoming: "Süper, çok teşekkürler! Mağazanız hafta sonu açık mı?", draft: "Rica ederiz! Beşiktaş şubemiz cumartesi 10:00–20:00, pazar 12:00–19:00 arası açık 🕙 Bekleriz!", source: "Mağaza saatleri", conf: 98 },
    ],

    /* Channels showcase */
    chanKicker: "Tek kutu, her kanal",
    chanH: ["Müşteri nerede yazarsa,", "yanıt orada."],
    chanBody: "WhatsApp, Instagram, web sohbet ve e-posta — hepsi tek bir akışta birleşir. Ekibin sekme değiştirmeden, sırayla yanıtlar.",
    channels: [
      { icon: "whatsapp", name: "WhatsApp", hue: 152, stat: "%58 trafik", note: "Sipariş ve kargo soruları" },
      { icon: "instagram", name: "Instagram DM", hue: 320, stat: "%29 trafik", note: "Ürün ve stok soruları" },
      { icon: "web", name: "Web sohbet", hue: 232, stat: "%9 trafik", note: "Sitedeki ziyaretçiler" },
      { icon: "email", name: "E-posta", hue: 28, stat: "%4 trafik", note: "Resmî talep ve faturalar" },
    ],

    /* Deflect / automate deep act */
    deflectKicker: "Neyi otomatik kapatır",
    deflectH: ["Tekrar eden 5 soru", "trafiğin %70'i."],
    deflectBody: "Aynı sorular gün boyu döner. mynode bunları bilgi tabanından, sen uyurken bile yanıtlar — ekibin yalnızca gerçekten insan gerektiren konulara bakar.",
    deflectItems: [
      { icon: "truck", t: "Kargom nerede?", share: 34, auto: true },
      { icon: "rotate", t: "İade & değişim", share: 21, auto: true },
      { icon: "package", t: "Ürün / stok sorusu", share: 18, auto: true },
      { icon: "calendar", t: "Çalışma saatleri", share: 12, auto: true },
      { icon: "headphones", t: "Şikayet / özel durum", share: 9, auto: false },
    ],
    deflectAuto: "otomatik", deflectHuman: "insana devret",

    /* Integrations strip */
    integKicker: "Bağlantılar",
    integH: "Mevcut yığınınla konuşur.",
    integrations: ["WhatsApp Business", "Instagram", "Shopify", "Trendyol", "Zendesk", "Slack", "Google Sheets", "Webhook"],

    /* Comparison table */
    compareKicker: "Neden mynode",
    compareH: ["Manuel uğraşı değil,", "sakin bir sistem."],
    compareCols: ["Manuel WhatsApp", "Çağrı merkezi", "mynode"],
    compareRows: [
      { f: "İlk yanıt süresi", a: "Saatler", b: "Dakikalar", c: "12 saniye" },
      { f: "Mesai dışı yanıt", a: false, b: false, c: true },
      { f: "Tek gelen kutusu (tüm kanallar)", a: false, b: "kısmen", c: true },
      { f: "Bilgi tabanından doğru cevap", a: false, b: "değişken", c: true },
      { f: "Kaynaklı / izlenebilir yanıt", a: false, b: false, c: true },
      { f: "Aylık maliyet", a: "düşük ama yorucu", b: "₺₺₺₺", c: "₺59'dan başlar" },
      { f: "Kurulum süresi", a: "—", b: "Haftalar", c: "Dakikalar" },
    ],

    /* Use-cases / personas */
    personaKicker: "Kimler için",
    personaH: ["Mesaj alan her işletme için,", "ama özellikle:"],
    personas: [
      { icon: "shopping-bag", t: "E-ticaret & DTC", b: "Kargo, iade ve stok sorularının %80'ini sen uyurken kapat.", metric: "%72 otomatik" },
      { icon: "stethoscope", t: "Klinik & randevu", b: "Randevu, fiyat ve yol tarifi sorularını anında, doğru bilgiyle yanıtla.", metric: "%40 daha az çağrı" },
      { icon: "utensils-crossed", t: "Restoran zinciri", b: "Masa, menü ve saat sorularını tüm şubeler için tek panelden yönet.", metric: "12 şube · tek kutu" },
      { icon: "building-2", t: "SaaS & B2B", b: "Onboarding ve teknik soruları belgelere dayalı, tutarlı yanıtla.", metric: "%55 self-servis" },
    ],

    /* Expanded testimonials */
    wallKicker: "Müşteri sözü",
    wallH: ["Bekletmeyi bıraktılar.", "Sayılar konuşuyor."],
    wall: [
      { quote: "Akşam gelen WhatsApp mesajları artık sabaha kalmıyor. mynode çoğunu kendi kapatıyor, ekibim sadece önemli olanlara bakıyor.", name: "Selin Ö.", role: "Kurucu · butik moda", initials: "SÖ", hue: 258, metric: "12 sn", metricL: "ort. ilk yanıt" },
      { quote: "İlk yanıt süremiz saatlerden saniyelere indi. Müşteri memnuniyeti puanımız iki ayda 4.2'den 4.8'e çıktı.", name: "Mert A.", role: "Operasyon · e-ticaret", initials: "MA", hue: 232, metric: "%94", metricL: "çözüm oranı" },
      { quote: "Üç şubenin Instagram'ını tek kişi yönetiyordu. Şimdi mynode devrede, kimse boğulmuyor.", name: "Ece K.", role: "Pazarlama · restoran zinciri", initials: "EK", hue: 320, metric: "3×", metricL: "kapasite" },
      { quote: "AI uydurmuyor; her yanıtın hangi makaleden geldiğini görüyorum. Bu güveni başka hiçbir araçta bulamadım.", name: "Deniz Y.", role: "Müşteri başarı · SaaS", initials: "DY", hue: 152, metric: "%68", metricL: "AI ile çözüm" },
    ],

    /* Extra FAQ — appended to app.config.faq for 7-8 total */
    faqExtra: [
      { q: "Mevcut araçlarımla entegre olur mu?", a: "Evet. Shopify, Trendyol, Zendesk, Slack ve Google Sheets gibi araçlarla bağlanır; ayrıca açık webhook ile kendi sistemine de bağlayabilirsin." },
      { q: "Ekibimde kaç kişi kullanabilir?", a: "Ekip planında sınırsız konuşma ve birden fazla ekip üyesi vardır. Roller ve yetkiler İşletme planıyla gelir; her üye kendi kuyruğunu görür." },
      { q: "Marka tonumu öğrenir mi?", a: "Evet. Bilgi tabanın ve birkaç örnek yanıtınla mynode senin dilini yakalar; resmî, samimi ya da kısa — tonu sen belirlersin." },
      { q: "Verilerim güvende mi?", a: "Konuşmalar ve bilgi tabanı kendi Supabase projende saklanır. mynode yalnızca senin verdiğin içerikten cevap üretir, başka yere taşımaz." },
    ],
    footProduct: "Ürün", footCompany: "Şirket", footResources: "Kaynaklar", footLegal: "Yasal",
    footProductLinks: ["Tek gelen kutusu", "AI yanıt önerisi", "Otomasyonlar", "Bilgi tabanı", "SLA & raporlar"],
    footCompanyLinks: ["Hakkında", "Müşteriler", "Kariyer", "Blog"],
    footResourceLinks: ["Yardım merkezi", "Geliştirici API", "Durum", "Değişiklikler"],
    footLegalLinks: ["Kullanım şartları", "Gizlilik", "KVKK", "İletişim"],
    footStatus: "Tüm sistemler çalışıyor",
  },
  en: {
    nav: ["Features", "How it works", "Pricing"], signin: "Sign in", demo: "Open the demo",
    h1a: "Your customer is typing.", h1b: "The reply is already drafted.",
    sub: "mynode connects WhatsApp, Instagram and web chat into one inbox; a knowledge-grounded AI writes an accurate reply in your brand tone for every message. Your team approves, automations close the routine ones.",
    cta1: "Try it free", cta2: "How it works", social: "1,200+ teams answer customers without the wait, with mynode.",
    marqueeTitle: "Every message, every channel — in one inbox",
    marquee: ["WhatsApp", "Instagram", "Web chat", "Order tracking", "Returns", "Stock", "Complaints", "Hours", "Order status", "Multilingual"],
    problemKicker: "Sound familiar",
    problemH: ["Messages pile up,", "the customer waits."],
    problemBody: "40 unread on WhatsApp. The same “where's my order?” for the tenth time in Instagram DMs. Questions that arrive after hours sit until morning. mynode brings it all into one calm place — and answers most of it while you sleep.",
    problemStats: [{ n: "40+", l: "unread messages every morning" }, { n: "8 hrs", l: "overnight questions left waiting" }, { n: "60%", l: "are the same 5 questions" }, { n: "3", l: "separate apps, no single inbox" }],
    whatKicker: "What it does",
    whatH: ["Six calm capabilities,", "in one inbox."],
    stepsKicker: "How it works",
    stepsH: "Live in three steps.",
    steps: [
      { t: "Connect channels", b: "Connect your WhatsApp number, Instagram and web chat in minutes." },
      { t: "Add your knowledge", b: "Drop in FAQs, shipping and refund policies; the AI only answers from what you wrote." },
      { t: "Approve & automate", b: "Approve drafts first; one click turns flows you trust into full automation." },
    ],
    casesKicker: "Who uses it",
    casesH: ["For anyone who gets messages,", "but especially:"],
    cases: [
      { icon: "shopping-bag", t: "E-commerce & DTC", b: "Close 80% of shipping, return and stock questions while you sleep." },
      { icon: "utensils-crossed", t: "Restaurants & booking", b: "Auto-answer table, menu and hours questions; cut the phone calls." },
      { icon: "stethoscope", t: "Clinics & appointments", b: "Answer appointment, pricing and directions instantly, with the right info." },
      { icon: "building-2", t: "Agencies & multi-client", b: "A separate knowledge base and brand voice per client; run it all from one panel." },
    ],
    proofKicker: "The result",
    proof: [{ big: "12 sec", l: "average first response", c: "Because the AI draft is ready" }, { big: "68%", l: "deflected by AI", c: "Closed with no human" }, { big: "3.1×", l: "more chats per agent", c: "With the same team" }],
    quote: "“Evening WhatsApp messages no longer pile up until morning. mynode closes most of them itself, and my team only handles what really matters.”",
    quoteName: "Selin Ö.", quoteRole: "Founder · boutique fashion brand",
    trustKicker: "The quiet promise",
    trustH: ["The AI won't invent.", "It speaks your words."],
    trustBody: "mynode only answers from your knowledge base and shows its source. When unsure it hands off to a human; and unless you choose otherwise, nothing sends without approval.",
    trustBullets: ["Cited replies: every draft shows which article it came from.", "Hands off when unsure: low confidence routes the chat to your team.", "Approval first: send with one tap until you trust it, then automate.", "Your brand voice: every reply follows your tone and rules."],
    pricingKicker: "Pricing", pricingH: ["One inbox.", "Honest pricing."],
    faqKicker: "Good to know", faqH: "The short answers.",
    finaleKicker: "Try it · 90 seconds", finaleH: "Don't keep them waiting.",
    finaleBody: "A pre-loaded live demo — every conversation and AI draft is interactive. No card, no signup.",
    footTagline: "Reply to every WhatsApp customer in your brand voice, in seconds.",
    recommended: "Recommended",
    previewWaiting: "new message",
    previewSuggested: "AI suggestion", previewSource: "Knowledge · Shipping times", previewSend: "Send in one tap", previewConf: "confidence",

    /* Interactive live demo */
    demoKicker: "Try it live",
    demoH: ["See the reply, live.", "Click, send, watch."],
    demoBody: "Just like a real inbox. The customer writes, mynode drafts a reply — hit “send,” it goes out, and the next message lands.",
    demoCustomer: "Ayşe Kaya", demoChannel: "WhatsApp",
    demoSourceLabel: "Knowledge", demoConf: "confidence", demoSend: "Send reply", demoSent: "Sent",
    demoTyping: "Ayşe is typing…",
    demoEmpty: "Every message answered 🎉 Demo complete.",
    demoReset: "Reset demo",
    demoTurns: [
      { incoming: "Hi, my order from yesterday still hasn't shipped. When will it go out?", draft: "Hi Ayşe, your order (#48213) shipped today 📦 It'll arrive by 6pm tomorrow. Tracking: TR-7741-2290.", source: "Shipping times", conf: 96 },
      { incoming: "Great — and if I need to return it, is it a problem that I opened the box?", draft: "Not at all 🙂 We accept returns within 14 days even if tried on. I can generate a free return code for you right now if you'd like.", source: "Return policy", conf: 94 },
      { incoming: "Perfect, thank you! Is your store open on weekends?", draft: "Of course! Our Beşiktaş branch is open Sat 10:00–20:00 and Sun 12:00–19:00 🕙 See you there!", source: "Store hours", conf: 98 },
    ],

    /* Channels showcase */
    chanKicker: "One inbox, every channel",
    chanH: ["Wherever the customer writes,", "the reply is right there."],
    chanBody: "WhatsApp, Instagram, web chat and email — all merge into one stream. Your team replies in order, without juggling tabs.",
    channels: [
      { icon: "whatsapp", name: "WhatsApp", hue: 152, stat: "58% of volume", note: "Order & shipping questions" },
      { icon: "instagram", name: "Instagram DM", hue: 320, stat: "29% of volume", note: "Product & stock questions" },
      { icon: "web", name: "Web chat", hue: 232, stat: "9% of volume", note: "Visitors on your site" },
      { icon: "email", name: "Email", hue: 28, stat: "4% of volume", note: "Formal requests & invoices" },
    ],

    /* Deflect / automate deep act */
    deflectKicker: "What it auto-closes",
    deflectH: ["Five repeat questions,", "70% of your volume."],
    deflectBody: "The same questions cycle all day. mynode answers them from your knowledge base — even while you sleep — so your team only handles what truly needs a human.",
    deflectItems: [
      { icon: "truck", t: "Where's my order?", share: 34, auto: true },
      { icon: "rotate", t: "Returns & exchanges", share: 21, auto: true },
      { icon: "package", t: "Product / stock", share: 18, auto: true },
      { icon: "calendar", t: "Opening hours", share: 12, auto: true },
      { icon: "headphones", t: "Complaint / edge case", share: 9, auto: false },
    ],
    deflectAuto: "auto", deflectHuman: "hand off",

    /* Integrations strip */
    integKicker: "Connections",
    integH: "Talks to your existing stack.",
    integrations: ["WhatsApp Business", "Instagram", "Shopify", "Trendyol", "Zendesk", "Slack", "Google Sheets", "Webhook"],

    /* Comparison table */
    compareKicker: "Why mynode",
    compareH: ["Not manual grind,", "a calm system."],
    compareCols: ["Manual WhatsApp", "Call center", "mynode"],
    compareRows: [
      { f: "First response time", a: "Hours", b: "Minutes", c: "12 seconds" },
      { f: "After-hours replies", a: false, b: false, c: true },
      { f: "One inbox (all channels)", a: false, b: "partial", c: true },
      { f: "Accurate, knowledge-grounded answers", a: false, b: "varies", c: true },
      { f: "Cited / traceable replies", a: false, b: false, c: true },
      { f: "Monthly cost", a: "cheap but tiring", b: "$$$$", c: "from $59" },
      { f: "Setup time", a: "—", b: "Weeks", c: "Minutes" },
    ],

    /* Use-cases / personas */
    personaKicker: "Who it's for",
    personaH: ["For any business that gets messages,", "but especially:"],
    personas: [
      { icon: "shopping-bag", t: "E-commerce & DTC", b: "Close 80% of shipping, return and stock questions while you sleep.", metric: "72% automated" },
      { icon: "stethoscope", t: "Clinics & appointments", b: "Answer appointment, pricing and directions instantly, with the right info.", metric: "40% fewer calls" },
      { icon: "utensils-crossed", t: "Restaurant chains", b: "Manage table, menu and hours questions across every branch from one panel.", metric: "12 branches · 1 inbox" },
      { icon: "building-2", t: "SaaS & B2B", b: "Answer onboarding and technical questions consistently, grounded in your docs.", metric: "55% self-serve" },
    ],

    /* Expanded testimonials */
    wallKicker: "Customer voice",
    wallH: ["They stopped making people wait.", "The numbers speak."],
    wall: [
      { quote: "Evening WhatsApp messages no longer pile up until morning. mynode closes most of them itself, and my team only handles what matters.", name: "Selin Ö.", role: "Founder · boutique fashion", initials: "SÖ", hue: 258, metric: "12 sec", metricL: "avg first response" },
      { quote: "Our first-response time went from hours to seconds. Our CSAT climbed from 4.2 to 4.8 in two months.", name: "Mert A.", role: "Operations · e-commerce", initials: "MA", hue: 232, metric: "94%", metricL: "resolution rate" },
      { quote: "One person was running three branches' Instagram. Now mynode is on it, and nobody is drowning.", name: "Ece K.", role: "Marketing · restaurant chain", initials: "EK", hue: 320, metric: "3×", metricL: "capacity" },
      { quote: "The AI doesn't make things up; I can see which article every reply came from. I never found that trust in any other tool.", name: "Deniz Y.", role: "Customer success · SaaS", initials: "DY", hue: 152, metric: "68%", metricL: "deflected by AI" },
    ],

    /* Extra FAQ — appended to app.config.faq for 7-8 total */
    faqExtra: [
      { q: "Does it integrate with my existing tools?", a: "Yes. It connects with Shopify, Trendyol, Zendesk, Slack and Google Sheets, and you can wire it to your own systems through an open webhook." },
      { q: "How many people on my team can use it?", a: "The Team plan includes unlimited chats and multiple team members. Roles and permissions come with the Business plan; each member sees their own queue." },
      { q: "Does it learn my brand voice?", a: "Yes. From your knowledge base and a few sample replies, mynode captures your voice — formal, friendly or terse, you set the tone." },
      { q: "Is my data safe?", a: "Conversations and your knowledge base live in your own Supabase project. mynode only answers from the content you provide and never moves it elsewhere." },
    ],
    footProduct: "Product", footCompany: "Company", footResources: "Resources", footLegal: "Legal",
    footProductLinks: ["One unified inbox", "AI-suggested replies", "Automations", "Knowledge base", "SLA & reports"],
    footCompanyLinks: ["About", "Customers", "Careers", "Blog"],
    footResourceLinks: ["Help center", "Developer API", "Status", "Changelog"],
    footLegalLinks: ["Terms of service", "Privacy", "DPA", "Contact"],
    footStatus: "All systems operational",
  },
};

/* The signature glimpse: a mini WhatsApp inbox with an incoming message and an AI draft. */
function ChatPreview() {
  const { lang } = useLang();
  const c = content[lang];
  const incoming = lang === "tr"
    ? "Merhaba, dün verdiğim sipariş hâlâ kargoya verilmemiş. Ne zaman çıkar?"
    : "Hi, my order from yesterday still hasn't shipped. When will it go out?";
  const draft = lang === "tr"
    ? "Merhaba Ayşe Hanım, siparişiniz (#48213) bugün kargoya verildi 📦 Yarın 18:00'e kadar elinizde olur. Takip no: TR-7741-2290."
    : "Hi Ayşe, your order (#48213) shipped today 📦 It'll arrive by 6pm tomorrow. Tracking: TR-7741-2290.";

  return (
    <div className="relative mx-auto w-[320px] floaty">
      <div className="rounded-[2.2rem] border border-sidebar-border bg-sidebar p-3 shadow-pop glow">
        <div className="overflow-hidden rounded-[1.7rem] bg-background">
          {/* chat header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3" style={{ background: "var(--grad-hero)" }}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-[13px] font-semibold text-primary shadow-sm">AK</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Ayşe Kaya</p>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MessageCircle className="h-3 w-3 text-success" /> WhatsApp
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-primary/12 px-2 py-1 text-[10px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" /> {c.previewWaiting}
            </span>
          </div>
          {/* messages */}
          <div className="space-y-2.5 px-4 py-4">
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5 text-[12.5px] leading-relaxed">
              {incoming}
            </div>
            <div className="flex items-center gap-1 pl-2">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 typing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 typing-dot" style={{ animationDelay: "0.2s" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 typing-dot" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
          {/* AI suggested reply */}
          <div className="mx-3 mb-3 rounded-2xl border border-primary/25 bg-primary/[0.04] p-3.5">
            <p className="flex items-center gap-1.5 label-mono text-primary">
              <Sparkles className="h-3 w-3" /> {c.previewSuggested}
              <span className="ml-auto rounded-full bg-primary/12 px-1.5 py-0.5 text-[9px] tnum normal-case tracking-normal">96% {c.previewConf}</span>
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/90">{draft}</p>
            <p className="mt-2 flex items-center gap-1 text-[10.5px] text-muted-foreground">
              <BookOpen className="h-3 w-3" /> {c.previewSource}
            </p>
            <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground">
              <Zap className="h-3.5 w-3.5" /> {c.previewSend}
            </button>
          </div>
        </div>
      </div>
      {/* floating chips */}
      <div className="absolute -right-5 top-12 hidden rounded-xl border border-border bg-card px-3 py-2 shadow-pop sm:block floaty" style={{ animationDelay: "0.8s" }}>
        <p className="flex items-center gap-1.5 text-xs font-medium"><Gauge className="h-4 w-4 text-primary" /> 12 sn</p>
      </div>
      <div className="absolute -left-6 bottom-20 hidden rounded-xl border border-border bg-card px-3 py-2 shadow-pop sm:block floaty" style={{ animationDelay: "0.4s" }}>
        <p className="flex items-center gap-1.5 text-xs font-medium"><AtSign className="h-4 w-4" style={{ color: "oklch(60% 0.2 320)" }} /> +3 {lang === "tr" ? "yeni" : "new"}</p>
      </div>
    </div>
  );
}

/* INTERACTIVE inline demo — a mini chat where clicking "send" advances the thread. */
type DemoMsg = { from: "customer" | "agent"; text: string };
function LiveDemo() {
  const { lang } = useLang();
  const c = content[lang];
  const turns = c.demoTurns;
  const [step, setStep] = useState(0); // which turn's draft is showing
  const [history, setHistory] = useState<DemoMsg[]>([{ from: "customer", text: turns[0].incoming }]);
  const [sending, setSending] = useState(false);

  const done = step >= turns.length;
  const cur = done ? null : turns[step];

  function send() {
    if (!cur || sending) return;
    setSending(true);
    setHistory((h) => [...h, { from: "agent", text: cur.draft }]);
    const next = step + 1;
    window.setTimeout(() => {
      if (next < turns.length) setHistory((h) => [...h, { from: "customer", text: turns[next].incoming }]);
      setStep(next);
      setSending(false);
    }, 700);
  }
  function reset() {
    setStep(0);
    setHistory([{ from: "customer", text: turns[0].incoming }]);
    setSending(false);
  }

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-border bg-card shadow-pop">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5" style={{ background: "var(--grad-hero)" }}>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-[13px] font-semibold text-primary shadow-sm">AK</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{c.demoCustomer}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><MessageCircle className="h-3 w-3 text-success" /> {c.demoChannel}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-primary/12 px-2.5 py-1 text-[10px] font-semibold text-primary">
          <Bot className="h-3 w-3" /> mynode AI
        </span>
      </div>

      {/* thread */}
      <div className="flex max-h-[300px] flex-col gap-2.5 overflow-y-auto px-5 py-4">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "agent" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${msg.from === "agent" ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md bg-muted"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-1 pl-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 typing-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 typing-dot" style={{ animationDelay: "0.2s" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 typing-dot" style={{ animationDelay: "0.4s" }} />
            <span className="ml-1.5 text-[10.5px] text-muted-foreground">{c.demoTyping}</span>
          </div>
        )}
      </div>

      {/* AI draft + send, or completion */}
      {cur ? (
        <div className="mx-4 mb-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 label-mono text-primary"><Sparkles className="h-3 w-3" /> {c.previewSuggested}</p>
            <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[9px] font-semibold tnum normal-case tracking-normal text-primary">{cur.conf}% {c.demoConf}</span>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/90">{cur.draft}</p>
          <p className="mt-2 flex items-center gap-1 text-[10.5px] text-muted-foreground"><BookOpen className="h-3 w-3" /> {c.demoSourceLabel} · {cur.source}</p>
          <button onClick={send} disabled={sending} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2.5 text-[12.5px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            <Send className="h-3.5 w-3.5" /> {c.demoSend}
          </button>
        </div>
      ) : (
        <div className="mx-4 mb-4 flex flex-col items-center gap-3 rounded-2xl border border-success/25 bg-success/[0.06] p-5 text-center">
          <p className="flex items-center gap-2 text-[13px] font-medium text-foreground/90"><Check className="h-4 w-4 text-success" /> {c.demoEmpty}</p>
          <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-medium ring-1 ring-border transition hover:bg-muted">
            <RotateCcw className="h-3.5 w-3.5" /> {c.demoReset}
          </button>
        </div>
      )}
    </div>
  );
}

export default function YanitlaLanding() {
  const { lang, t } = useLang();
  const c = content[lang];
  const mk = appConfig.marketing;
  const [open, setOpen] = useState<number | null>(0);

  const channelChips = [
    { Ic: MessageCircle, label: "WhatsApp", hue: 152 },
    { Ic: AtSign, label: "Instagram", hue: 320 },
    { Ic: Globe, label: lang === "tr" ? "Web sohbet" : "Web chat", hue: 232 },
  ];

  const chanIcons: Record<string, typeof MessageCircle> = { whatsapp: MessageCircle, instagram: AtSign, web: Globe, email: Mail };
  const deflectIcons: Record<string, typeof Truck> = { truck: Truck, rotate: RotateCcw, package: PackageSearch, calendar: CalendarClock, headphones: Headphones };
  const faqItems = [...mk.faq.map((f) => ({ q: t(f.q), a: t(f.a) })), ...c.faqExtra];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5"><LogoMark className="h-8 w-8" /><span className="font-display text-lg font-semibold tracking-tight">{appConfig.name}</span></Link>
          <nav className="ml-auto hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#what" className="hover:text-foreground">{c.nav[0]}</a>
            <a href="#how" className="hover:text-foreground">{c.nav[1]}</a>
            <a href="#pricing" className="hover:text-foreground">{c.nav[2]}</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-7">
            <LanguageToggle className="mr-1" />
            <Link href="/login" className="hidden px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:inline-flex">{c.signin}</Link>
            <Link href="/signup" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90">{c.demo} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--grad-hero)" }} />
        <span className="blob -left-24 -top-24 -z-10 h-96 w-96 bg-primary/25 drift" aria-hidden />
        <span className="blob right-0 top-40 -z-10 h-80 w-80 bg-sky/20 drift" style={{ animationDelay: "2s" }} aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:py-24">
          <div>
            <p className="rise label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {t(mk.badge)}</p>
            <h1 className="rise mt-6 font-display text-[clamp(38px,6vw,66px)] font-extrabold leading-[1.0] tracking-tight" style={{ animationDelay: "0.08s" }}>
              {c.h1a}<br /><span className="hl-primary">{c.h1b}</span>
            </h1>
            <p className="rise mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: "0.18s" }}>{c.sub}</p>
            <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.28s" }}>
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground transition hover:opacity-90">{c.cta1} <ArrowRight className="h-4 w-4" /></Link>
              <a href="#how" className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium ring-1 ring-border transition hover:bg-muted">{c.cta2}</a>
            </div>
            <div className="rise mt-9 flex items-center gap-3 text-sm text-muted-foreground" style={{ animationDelay: "0.38s" }}>
              <div className="flex -space-x-2">{["ED", "CY", "MA", "SÖ"].map((i, k) => <span key={i} className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-background" style={{ background: `oklch(${56 - k * 4}% 0.18 ${258 - k * 12})` }}>{i}</span>)}</div>
              <span>{c.social}</span>
            </div>
          </div>
          <div className="rise" style={{ animationDelay: "0.3s" }}><ChatPreview /></div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="overflow-hidden border-y border-border py-7">
        <p className="label-mono mb-4 text-center text-muted-foreground">{c.marqueeTitle}</p>
        <div className="marquee gap-10">{[...c.marquee, ...c.marquee].map((it, i) => <span key={i} className="whitespace-nowrap px-2 font-display text-2xl font-semibold text-muted-foreground/55">{it}<span className="ml-10 text-primary">·</span></span>)}</div>
      </section>

      {/* LIVE INTERACTIVE DEMO */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1fr_1.05fr] lg:px-8">
          <div>
            <p className="label-mono inline-flex items-center gap-2 text-primary"><Sparkles className="h-3.5 w-3.5" /> {c.demoKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4.2vw,50px)] font-bold leading-[1.02] tracking-tight">{c.demoH[0]} <span className="text-primary">{c.demoH[1]}</span></h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">{c.demoBody}</p>
            <ul className="mt-7 space-y-3">
              {[
                { Ic: Bot, t: lang === "tr" ? "AI taslağı hazır gelir — sıfırdan yazmazsın." : "The AI draft arrives ready — you don't write from scratch." },
                { Ic: BookOpen, t: lang === "tr" ? "Her yanıt bir bilgi kaynağına dayanır." : "Every reply is grounded in a knowledge source." },
                { Ic: Zap, t: lang === "tr" ? "Tek tıkla gönder; bir sonraki mesaj düşer." : "Send in one tap; the next message lands." },
              ].map((it) => (
                <li key={it.t} className="flex items-start gap-3 text-sm">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><it.Ic className="h-4 w-4" /></span>
                  <span className="pt-1 leading-relaxed text-muted-foreground">{it.t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rise" style={{ animationDelay: "0.1s" }}><LiveDemo /></div>
        </div>
      </section>

      {/* CHANNELS SHOWCASE — one inbox */}
      <section className="border-t border-border bg-card/40 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl"><p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.chanKicker}</p><h2 className="mt-4 font-display text-[clamp(28px,4vw,48px)] font-bold leading-[1.04] tracking-tight">{c.chanH[0]} <span className="text-primary">{c.chanH[1]}</span></h2><p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">{c.chanBody}</p></div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {c.channels.map((ch) => { const Ic = chanIcons[ch.icon]; return (
              <article key={ch.name} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop">
                <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100" style={{ background: `oklch(70% 0.16 ${ch.hue} / 0.25)`, opacity: 0.6 }} aria-hidden />
                <span className="relative grid h-11 w-11 place-items-center rounded-2xl transition group-hover:scale-110" style={{ background: `oklch(94% 0.05 ${ch.hue})`, color: `oklch(48% 0.16 ${ch.hue})` }}><Ic className="h-5 w-5" /></span>
                <h3 className="relative mt-4 font-semibold tracking-tight">{ch.name}</h3>
                <p className="relative mt-1 text-sm text-muted-foreground">{ch.note}</p>
                <p className="relative mt-3 font-display text-sm font-semibold tnum" style={{ color: `oklch(48% 0.16 ${ch.hue})` }}>{ch.stat}</p>
              </article>); })}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm text-muted-foreground shadow-soft">
            <Inbox className="h-4 w-4 text-primary" /> {lang === "tr" ? "Hepsi tek gelen kutusunda toplanır — sekme değiştirmek yok." : "All merged into one inbox — no tab-switching."}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1fr_1.05fr] lg:px-8">
          <div>
            <p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.problemKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(30px,4.5vw,52px)] font-bold leading-[1.02] tracking-tight">{c.problemH[0]} <span className="text-primary">{c.problemH[1]}</span></h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">{c.problemBody}</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {channelChips.map((ch) => (
                <span key={ch.label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium shadow-soft">
                  <ch.Ic className="h-4 w-4" style={{ color: `oklch(58% 0.18 ${ch.hue})` }} /> {ch.label}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {c.problemStats.map((s, i) => <div key={s.l} className="rounded-3xl border border-border bg-card p-6 shadow-soft" style={{ transform: `rotate(${i % 2 ? 1.2 : -1.2}deg)` }}><p className="font-display text-[38px] font-bold leading-none tnum text-primary">{s.n}</p><p className="mt-2 text-[13px] text-muted-foreground">{s.l}</p></div>)}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="what" className="border-t border-border bg-card/40 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl"><p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.whatKicker}</p><h2 className="mt-4 font-display text-[clamp(30px,4.5vw,52px)] font-bold leading-[1.02] tracking-tight">{c.whatH[0]} <span className="text-primary">{c.whatH[1]}</span></h2></div>
          <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {mk.features.map((f, i) => { const Ic = featureIcons[i]; return (
              <article key={t(f.title)} className="rise group rounded-3xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/12 text-primary transition group-hover:scale-110"><Ic className="h-5 w-5" /></span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{t(f.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(f.body)}</p>
              </article>); })}
          </div>
        </div>
      </section>

      {/* DEFLECT / AUTOMATE — deep act */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1fr_1.1fr] lg:px-8">
          <div>
            <p className="label-mono inline-flex items-center gap-2 text-primary"><Workflow className="h-3.5 w-3.5" /> {c.deflectKicker}</p>
            <h2 className="mt-4 font-display text-[clamp(28px,4.2vw,50px)] font-bold leading-[1.02] tracking-tight">{c.deflectH[0]} <span className="text-primary">{c.deflectH[1]}</span></h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">{c.deflectBody}</p>
            <div className="mt-7 inline-flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-soft">
              <div><p className="font-display text-3xl font-bold tnum text-primary">%68</p><p className="text-xs text-muted-foreground">{lang === "tr" ? "AI ile kapanan" : "closed by AI"}</p></div>
              <span className="h-10 w-px bg-border" />
              <div><p className="font-display text-3xl font-bold tnum">5</p><p className="text-xs text-muted-foreground">{lang === "tr" ? "soru = trafiğin %70'i" : "questions = 70% of volume"}</p></div>
            </div>
          </div>
          <ul className="space-y-2.5">
            {c.deflectItems.map((it) => { const Ic = deflectIcons[it.icon]; return (
              <li key={it.t} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${it.auto ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning-foreground"}`}><Ic className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{it.t}</p><span className="shrink-0 font-display text-sm font-semibold tnum text-muted-foreground">{it.share}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${it.auto ? "bg-primary" : "bg-warning"}`} style={{ width: `${(it.share / 34) * 100}%` }} /></div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${it.auto ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"}`}>{it.auto ? c.deflectAuto : c.deflectHuman}</span>
              </li>); })}
          </ul>
        </div>
        {/* integrations strip */}
        <div className="mx-auto mt-16 max-w-6xl px-5 lg:px-8">
          <p className="label-mono mb-5 flex items-center justify-center gap-2 text-center text-muted-foreground"><Plug className="h-3.5 w-3.5 text-primary" /> {c.integKicker} · {c.integH}</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {c.integrations.map((it) => (
              <span key={it} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft transition hover:border-primary/40 hover:text-primary">
                <span className="h-2 w-2 rounded-full bg-primary/60" /> {it}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl"><p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.casesKicker}</p><h2 className="mt-4 font-display text-[clamp(28px,4vw,48px)] font-bold leading-[1.04] tracking-tight">{c.casesH[0]} <span className="text-primary">{c.casesH[1]}</span></h2></div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {c.cases.map((cs) => { const Ic = caseIcons[cs.icon]; return (
              <article key={cs.t} className="group rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-110"><Ic className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold tracking-tight">{cs.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{cs.b}</p>
              </article>); })}
          </div>
          {/* testimonial */}
          <figure className="mx-auto mt-12 max-w-3xl rounded-[2rem] border border-border bg-card p-8 text-center shadow-soft lg:p-12">
            <Quote className="mx-auto h-7 w-7 text-primary/40" />
            <blockquote className="mt-4 font-display text-[clamp(18px,2.4vw,26px)] font-medium leading-snug tracking-tight">{c.quote}</blockquote>
            <figcaption className="mt-5 flex items-center justify-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary">SÖ</span>
              <span className="text-left text-sm"><span className="block font-semibold">{c.quoteName}</span><span className="block text-muted-foreground">{c.quoteRole}</span></span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-card/40 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.stepsKicker}</p>
          <h2 className="mt-4 font-display text-[clamp(28px,4vw,48px)] font-bold tracking-tight">{c.stepsH}</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {c.steps.map((s, i) => <div key={s.t} className="rounded-3xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop"><span className="font-display text-4xl font-bold text-primary/25">0{i + 1}</span><h3 className="mt-2 text-lg font-semibold">{s.t}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.b}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${[40, 72, 100][i]}%` }} /></div></div>)}
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl"><p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.personaKicker}</p><h2 className="mt-4 font-display text-[clamp(28px,4vw,48px)] font-bold leading-[1.04] tracking-tight">{c.personaH[0]} <span className="text-primary">{c.personaH[1]}</span></h2></div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {c.personas.map((p) => { const Ic = caseIcons[p.icon]; return (
              <article key={p.t} className="group flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-110"><Ic className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold tracking-tight">{p.t}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">{p.b}</p>
                <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary"><TrendingUp className="h-3 w-3" /> {p.metric}</p>
              </article>); })}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="border-y border-border bg-card/40 py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="max-w-2xl"><p className="label-mono inline-flex items-center gap-2 text-primary"><span className="h-px w-7 bg-primary" /> {c.compareKicker}</p><h2 className="mt-4 font-display text-[clamp(28px,4vw,48px)] font-bold leading-[1.04] tracking-tight">{c.compareH[0]} <span className="text-primary">{c.compareH[1]}</span></h2></div>
          <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 font-medium text-muted-foreground lg:px-6" />
                  <th className="px-3 py-4 text-center text-[12px] font-medium text-muted-foreground lg:px-4">{c.compareCols[0]}</th>
                  <th className="px-3 py-4 text-center text-[12px] font-medium text-muted-foreground lg:px-4">{c.compareCols[1]}</th>
                  <th className="px-3 py-4 text-center lg:px-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[12px] font-semibold text-primary-foreground"><LogoMark className="h-3.5 w-3.5" /> {c.compareCols[2]}</span></th>
                </tr>
              </thead>
              <tbody>
                {c.compareRows.map((r, i) => (
                  <tr key={r.f} className={`${i % 2 ? "bg-muted/30" : ""} border-b border-border last:border-0`}>
                    <td className="px-4 py-3.5 font-medium lg:px-6">{r.f}</td>
                    {[r.a, r.b].map((v, k) => (
                      <td key={k} className="px-3 py-3.5 text-center text-muted-foreground lg:px-4">
                        {v === true ? <Check className="mx-auto h-4 w-4 text-success" /> : v === false ? <X className="mx-auto h-4 w-4 text-muted-foreground/40" /> : <span className="text-[12.5px]">{v}</span>}
                      </td>
                    ))}
                    <td className="bg-primary/[0.04] px-3 py-3.5 text-center lg:px-4">
                      {r.c === true ? <Check className="mx-auto h-4 w-4 text-primary" /> : <span className="text-[12.5px] font-semibold text-primary">{r.c}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL WALL — expanded */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl"><p className="label-mono inline-flex items-center gap-2 text-primary"><Quote className="h-3.5 w-3.5" /> {c.wallKicker}</p><h2 className="mt-4 font-display text-[clamp(28px,4vw,48px)] font-bold leading-[1.04] tracking-tight">{c.wallH[0]} <span className="text-primary">{c.wallH[1]}</span></h2></div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {c.wall.map((w) => (
              <figure key={w.name} className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop">
                <div className="mb-3 flex items-center gap-0.5 text-primary">{[0, 1, 2, 3, 4].map((s) => <Star key={s} className="h-4 w-4 fill-primary" />)}</div>
                <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/90">“{w.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: `oklch(56% 0.18 ${w.hue})` }}>{w.initials}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{w.name}</p><p className="truncate text-xs text-muted-foreground">{w.role}</p></div>
                  <div className="shrink-0 text-right"><p className="font-display text-lg font-bold tnum text-primary">{w.metric}</p><p className="text-[10px] text-muted-foreground">{w.metricL}</p></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="border-y border-border bg-card py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-3 lg:px-8">
          {c.proof.map((p) => <div key={p.l}><p className="font-display text-[60px] font-bold leading-none tnum text-primary">{p.big}</p><p className="mt-2 text-sm font-medium">{p.l}</p><p className="mt-1 text-xs text-muted-foreground">{p.c}</p></div>)}
        </div>
      </section>

      {/* TRUST — inverted dark act */}
      <section className="px-5 py-16 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-sidebar p-10 text-sidebar-foreground lg:p-16">
          <span className="blob -left-12 -top-16 h-72 w-72 bg-primary/40 drift" aria-hidden />
          <span className="blob bottom-0 right-10 h-64 w-64 bg-sky/25 drift" style={{ animationDelay: "1.5s" }} aria-hidden />
          <div className="relative grid gap-12 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <p className="label-mono inline-flex items-center gap-2 text-sidebar-active"><ShieldCheck className="h-4 w-4" /> {c.trustKicker}</p>
              <h2 className="mt-4 font-display text-[clamp(28px,4vw,48px)] font-bold leading-[1.04] tracking-tight">{c.trustH[0]} <span className="text-sidebar-active">{c.trustH[1]}</span></h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-sidebar-muted">{c.trustBody}</p>
            </div>
            <ul className="space-y-3">{c.trustBullets.map((b) => <li key={b} className="flex gap-3 rounded-2xl bg-white/[0.05] px-4 py-3.5 ring-1 ring-white/10"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-active" /><p className="text-[13.5px] leading-relaxed text-sidebar-foreground/90">{b}</p></li>)}</ul>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-12 lg:py-20">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="mx-auto mb-12 max-w-xl text-center"><p className="label-mono text-primary">{c.pricingKicker}</p><h2 className="mt-3 font-display text-[clamp(28px,4.5vw,48px)] font-bold tracking-tight">{c.pricingH[0]} <span className="text-primary">{c.pricingH[1]}</span></h2></div>
          <div className="grid gap-4 md:grid-cols-3">
            {mk.pricing.map((p) => (
              <article key={p.name} className={cn("relative rounded-3xl p-7 lg:p-8", p.featured ? "border border-primary/40 bg-card glow" : "border border-border bg-card shadow-soft")}>
                {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">{c.recommended}</span>}
                <p className="label-mono text-muted-foreground">{p.name}</p>
                <p className="mt-3 flex items-end gap-1"><span className="font-display text-5xl font-bold leading-none tnum">{p.price}</span><span className="pb-1.5 text-[13px] text-muted-foreground">{p.period}</span></p>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{t(p.tagline)}</p>
                <ul className="mt-6 space-y-2.5">{p.features.map((f) => <li key={t(f)} className="flex items-start gap-2 text-[13px]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t(f)}</li>)}</ul>
                <Link href="/signup" className={cn("mt-7 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-[13px] font-semibold transition", p.featured ? "bg-primary text-primary-foreground hover:opacity-90" : "ring-1 ring-border hover:bg-muted")}>{t(p.cta)}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-border bg-card/40 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <div className="mb-10 text-center"><p className="label-mono text-primary">{c.faqKicker}</p><h2 className="mt-3 font-display text-[clamp(26px,4vw,42px)] font-bold tracking-tight">{c.faqH}</h2></div>
          <ul className="space-y-2.5">
            {faqItems.map((item, i) => (
              <li key={item.q} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"><span className="text-[15px] font-semibold tracking-tight">{item.q}</span>{open === i ? <Minus className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />}</button>
                {open === i && <p className="px-5 pb-4 text-[13.5px] leading-relaxed text-muted-foreground">{item.a}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FINALE */}
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] p-10 text-center text-primary-foreground lg:p-16" style={{ background: "var(--grad-brand)" }}>
          <span className="blob left-1/4 -top-12 h-64 w-64 bg-white/25 drift" aria-hidden />
          <div className="relative">
            <p className="label-mono inline-flex items-center justify-center gap-2 opacity-80"><Clock className="h-3 w-3" /> {c.finaleKicker}</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(34px,5.5vw,64px)] font-extrabold leading-[1] tracking-tight">{c.finaleH}</h2>
            <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed opacity-90">{c.finaleBody}</p>
            <div className="mt-9"><Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-sidebar px-6 py-3 text-[15px] font-semibold text-sidebar-foreground transition hover:opacity-90">{c.cta1} <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-sm text-muted-foreground md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5"><LogoMark className="h-7 w-7" /><span className="font-display text-base font-semibold tracking-tight text-foreground">{appConfig.name}</span></Link>
              <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed">{c.footTagline}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {channelChips.map((ch) => <span key={ch.label} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card shadow-soft"><ch.Ic className="h-4 w-4" style={{ color: `oklch(58% 0.18 ${ch.hue})` }} /></span>)}
              </div>
            </div>
            <div><p className="label-mono mb-3">{c.footProduct}</p><ul className="space-y-1.5">{c.footProductLinks.map((l) => <li key={l}><a href="#what" className="hover:text-foreground">{l}</a></li>)}</ul></div>
            <div><p className="label-mono mb-3">{c.footCompany}</p><ul className="space-y-1.5">{c.footCompanyLinks.map((l) => <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>)}</ul></div>
            <div><p className="label-mono mb-3">{c.footResources}</p><ul className="space-y-1.5">{c.footResourceLinks.map((l) => <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>)}</ul></div>
            <div><p className="label-mono mb-3">{c.footLegal}</p><ul className="space-y-1.5">{c.footLegalLinks.map((l) => <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>)}</ul></div>
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-[12px] text-muted-foreground md:flex-row md:items-center">
            <p>hello@{appConfig.domain} · © 2026 {appConfig.name}.</p>
            <p className="label-mono inline-flex items-center gap-1.5 normal-case tracking-normal"><span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" /> {c.footStatus}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
