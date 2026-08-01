"use client";

import Link from "next/link";
import appConfig from "@/app.config";
import { useLang } from "@/components/i18n/language-provider";

const M = {
  tr: {
    title: "Gizlilik Politikası",
    disclaimer: "Bu metin bir taslaktır ve otomatik olarak yasal uyumluluk sağlamaz. Yayınlamadan önce bir avukata incelettirin.",
    updated: "Son güncelleme: taslak",
    sections: [
      {
        h: "Hangi verileri topluyoruz",
        b: `${appConfig.name}, hizmeti sağlamak için müşterilerinizin WhatsApp/web sohbeti mesajlarını, iletişim bilgilerini (telefon numarası gibi) ve senin (işletme sahibi/ekip üyesi) hesap bilgilerini (ad, e-posta) işler.`,
      },
      { h: "Verileri nerede saklıyoruz", b: "Uygulama verileri, seçilen proje bölgesindeki Supabase (PostgreSQL) altyapısında organizasyon bazında ayrılmış olarak saklanır. Barındırma ve yedek konumları canlıya alma öncesinde ayrıca belgelenir." },
      { h: "Hizmet sağlayıcılar", b: "Supabase veri saklama ve kimlik doğrulama için; barındırma sağlayıcısı uygulamayı sunmak için; Twilio WhatsApp etkinleştirildiğinde; Meta Instagram etkinleştirildiğinde kullanılır. AI özelliği etkinleştirilirse seçilen model sağlayıcısı ayrıca alt işleyen olarak açıklanır." },
      { h: "Veri saklama ve silme", b: "Yetkili işletme kullanıcısı bir kişiyi ve o kişiye bağlanmış konuşma/webhook kayıtlarını silebilir veya organizasyonu kapatabilir. Twilio ve Meta gibi bağımsız sağlayıcılardaki kopyalar kendi saklama politikalarına tabidir ve ayrıca yönetilmelidir." },
      { h: "İletişim", b: `Sorularınız için: hello@${appConfig.domain}` },
    ],
  },
  en: {
    title: "Privacy Policy",
    disclaimer: "This text is a draft and does not automatically ensure legal compliance. Have a lawyer review it before publishing.",
    updated: "Last updated: draft",
    sections: [
      {
        h: "What data we collect",
        b: `${appConfig.name} processes your customers' WhatsApp/web chat messages, contact info (like phone numbers), and your (business owner/team member) account info (name, email) to provide the service.`,
      },
      { h: "Where we store data", b: "Application data is separated by organization in Supabase (PostgreSQL) in the selected project region. Hosting and backup locations will be documented before production launch." },
      { h: "Service providers", b: "Supabase provides storage and authentication; the hosting provider serves the app; Twilio is used when WhatsApp is enabled; and Meta is used when Instagram is enabled. If AI is activated, the selected model provider will be disclosed as an additional subprocessor." },
      { h: "Data retention & deletion", b: "An authorized business user can delete a contact and linked conversations/webhook records, or close the organization. Copies held independently by providers such as Twilio and Meta follow their own retention controls and must be managed separately." },
      { h: "Contact", b: `Questions: hello@${appConfig.domain}` },
    ],
  },
};

export default function PrivacyPage() {
  const { lang } = useLang();
  const m = M[lang];

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <Link href="/" className="text-sm text-primary hover:underline">← {appConfig.name}</Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">{m.title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">{m.updated}</p>
      <p className="mt-4 rounded-lg bg-warning/15 px-4 py-3 text-sm text-warning-foreground">{m.disclaimer}</p>
      <div className="mt-8 space-y-6">
        {m.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-lg font-semibold">{s.h}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.b}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
