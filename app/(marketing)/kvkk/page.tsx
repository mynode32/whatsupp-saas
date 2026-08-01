"use client";

import Link from "next/link";
import appConfig from "@/app.config";
import { useLang } from "@/components/i18n/language-provider";

const M = {
  tr: {
    title: "KVKK Aydınlatma Metni",
    disclaimer: "Bu metin bir taslaktır ve 6698 sayılı KVKK'ya otomatik uyumluluk sağlamaz. Yayınlamadan önce mutlaka bir avukata/veri koruma uzmanına incelettirin — veri sorumlusu/veri işleyen rollerinin net tanımlanması gerekir.",
    updated: "Son güncelleme: taslak",
    sections: [
      { h: "Veri sorumlusu", b: `Bu hizmeti kullanan işletme (sen), kendi müşteri verileri için veri sorumlusudur. ${appConfig.name} bu veriler için veri işleyen konumundadır.` },
      { h: "İşlenen kişisel veriler", b: "Müşteri adı/telefon numarası, WhatsApp/web sohbeti mesaj içeriği, ekip üyelerinin ad ve e-posta bilgileri." },
      { h: "İşleme amacı", b: "Müşteri destek taleplerinin yönetilmesi ve yanıtlanması." },
      { h: "Veri sahibinin hakları", b: "Veri sahibi erişim, düzeltme, silme ve mevzuatta tanınan diğer hakları için veri sorumlusu işletmeye başvurabilir. Yetkili işletme kullanıcısı ilgili kişi ve bağlı uygulama kayıtlarını panelden silebilir; dış sağlayıcı kayıtları ayrıca yönetilir." },
      { h: "İletişim", b: `Sorularınız için: hello@${appConfig.domain}` },
    ],
  },
  en: {
    title: "Data Processing Notice (Turkish KVKK)",
    disclaimer: "This text is a draft and does not automatically ensure compliance with Turkey's KVKK (or GDPR). Have a lawyer/data protection specialist review it before publishing — the controller/processor roles need to be clearly defined.",
    updated: "Last updated: draft",
    sections: [
      { h: "Data controller", b: `The business using this service (you) is the data controller for your customer data. ${appConfig.name} acts as the data processor.` },
      { h: "Personal data processed", b: "Customer name/phone number, WhatsApp/web chat message content, team members' name and email." },
      { h: "Purpose of processing", b: "Managing and responding to customer support requests." },
      { h: "Data subject rights", b: "Data subjects may contact the controller business to exercise access, correction, deletion and other statutory rights. Authorized business users can remove the contact and linked application records; external provider records are handled separately." },
      { h: "Contact", b: `Questions: hello@${appConfig.domain}` },
    ],
  },
};

export default function KvkkPage() {
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
