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
      { h: "Verileri nerede saklıyoruz", b: "Tüm veriler Supabase (PostgreSQL) üzerinde, organizasyon bazında ayrılmış olarak saklanır." },
      { h: "Üçüncü taraflarla paylaşım", b: "Mesajlar WhatsApp gönderim/alımı için Twilio üzerinden geçer. Başka hiçbir üçüncü tarafla veri paylaşılmaz." },
      { h: "Veri saklama ve silme", b: "İşletme sahibi, Ayarlar sayfasından bir kişinin tüm verisini kalıcı olarak silebilir veya organizasyon hesabını tamamen kapatabilir." },
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
      { h: "Where we store data", b: "All data is stored in Supabase (PostgreSQL), separated per organization." },
      { h: "Third-party sharing", b: "Messages pass through Twilio for WhatsApp sending/receiving. No data is shared with any other third party." },
      { h: "Data retention & deletion", b: "The business owner can permanently delete a contact's entire data from Settings, or close the organization account entirely." },
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
