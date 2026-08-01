"use client";

import { useState } from "react";
import { Plus, FileText, Search } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { articles, knowledgeCategories, knowledgeStats } from "@/lib/demo/data";
import { cn } from "@/lib/utils";

const M = {
  tr: {
    title: "Bilgi tabanı", sub: "AI yanıtları yalnızca buradan beslenir — sen ne yazarsan onu söyler.",
    add: "Makale ekle", search: "Makalelerde ara…",
    statArticles: "makale", statCoverage: "soru kapsamı", statCited: "bugün kaynak gösterildi",
    used: "kez kaynak gösterildi · 7g", updated: "güncellendi", empty: "Bu kategoride makale yok.",
  },
  en: {
    title: "Knowledge base", sub: "The AI only answers from here — it says exactly what you write.",
    add: "Add article", search: "Search articles…",
    statArticles: "articles", statCoverage: "question coverage", statCited: "cited today",
    used: "times cited · 7d", updated: "updated", empty: "No articles in this category.",
  },
};

export default function KnowledgePage() {
  const { lang, t } = useLang();
  const m = M[lang];
  const [cat, setCat] = useState(0); // 0 = All

  const activeLabel = t(knowledgeCategories[cat].label);
  const visible = cat === 0 ? articles : articles.filter((a) => t(a.category) === activeLabel);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{m.title}</h2>
          <p className="text-sm text-muted-foreground">{m.sub}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          <Plus className="h-4 w-4" /> {m.add}
        </button>
      </div>

      {/* stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { v: knowledgeStats.articles, l: m.statArticles },
          { v: `%${knowledgeStats.coverage}`, l: m.statCoverage },
          { v: knowledgeStats.citedToday, l: m.statCited },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="font-display text-2xl font-semibold tnum text-primary">{s.v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      {/* search */}
      <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <input className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground" placeholder={m.search} />
      </div>

      {/* category tabs */}
      <div className="flex flex-wrap gap-2">
        {knowledgeCategories.map((c, i) => (
          <button
            key={t(c.label)}
            onClick={() => setCat(i)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              cat === i ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon name={c.icon} className="h-3.5 w-3.5" /> {t(c.label)}
          </button>
        ))}
      </div>

      {/* articles grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {visible.map((a) => (
          <article key={a.id} className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold tracking-tight">{t(a.title)}</h3>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{t(a.category)}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{t(a.excerpt)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="tnum"><span className="font-semibold text-primary">{a.uses}</span> {m.used}</span>
              <span className="tnum">{m.updated} {a.updated}</span>
            </div>
          </article>
        ))}
        {visible.length === 0 && <p className="col-span-full px-1 py-8 text-center text-sm text-muted-foreground">{m.empty}</p>}
      </div>
    </div>
  );
}
