"use client";

import Link from "next/link";
import appConfig from "@/app.config";
import { useLang } from "@/components/i18n/language-provider";

const M = {
  tr: {
    title: "Kullanım Şartları",
    disclaimer: "Bu metin bir taslaktır ve otomatik olarak yasal uyumluluk sağlamaz. Yayınlamadan önce bir avukata incelettirin.",
    updated: "Son güncelleme: taslak",
    sections: [
      { h: "Hizmet tanımı", b: `${appConfig.name}, WhatsApp ve web sohbeti üzerinden gelen müşteri mesajlarını tek bir gelen kutusunda toplayan bir müşteri destek aracıdır.` },
      { h: "Hesap sorumluluğu", b: "Hesabının ve ekibinin bu hesap altında yaptığı işlemlerin güvenliğinden sen sorumlusun." },
      { h: "Kabul edilebilir kullanım", b: "Hizmeti yasa dışı, aldatıcı veya istenmeyen (spam) mesajlar göndermek için kullanamazsın." },
      { h: "Sorumluluk sınırlaması", b: "Hizmet \"olduğu gibi\" sunulur; kesintisiz veya hatasız çalışacağına dair garanti verilmez." },
      { h: "İletişim", b: `Sorularınız için: hello@${appConfig.domain}` },
    ],
  },
  en: {
    title: "Terms of Service",
    disclaimer: "This text is a draft and does not automatically ensure legal compliance. Have a lawyer review it before publishing.",
    updated: "Last updated: draft",
    sections: [
      { h: "Service description", b: `${appConfig.name} is a customer support tool that unifies WhatsApp and web chat messages into one inbox.` },
      { h: "Account responsibility", b: "You're responsible for the security of your account and what your team does under it." },
      { h: "Acceptable use", b: "You may not use the service to send illegal, deceptive, or unsolicited (spam) messages." },
      { h: "Limitation of liability", b: "The service is provided \"as is\" — no guarantee of uninterrupted or error-free operation." },
      { h: "Contact", b: `Questions: hello@${appConfig.domain}` },
    ],
  },
};

export default function TermsPage() {
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
