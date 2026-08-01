"use client";

import Link from "next/link";
import { Plus, FileText, Search } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Article = Database["public"]["Tables"]["knowledge_documents"]["Row"];

const M = {
  tr: {
    title: "Bilgi tabanı", sub: "AI yanıtları yalnızca buradan beslenir — sen ne yazarsan onu söyler.",
    add: "Makale ekle", search: "İçerikte ara…",
    statArticles: "makale", statPublished: "yayında",
    updated: "güncellendi", empty: "Bu görünümde makale yok.",
    draft: "Taslak", published: "Yayında", allCategories: "Tümü",
  },
  en: {
    title: "Knowledge base", sub: "The AI only answers from here — it says exactly what you write.",
    add: "Add article", search: "Search content…",
    statArticles: "articles", statPublished: "published",
    updated: "updated", empty: "No articles in this view.",
    draft: "Draft", published: "Published", allCategories: "All",
  },
};

export function KnowledgeClient({
  articles,
  categories,
  category,
  query,
}: {
  articles: Article[];
  categories: string[];
  category?: string;
  query?: string;
}) {
  const { lang } = useLang();
  const m = M[lang];

  function buildHref(next: { category?: string; query?: string }) {
    const params = new URLSearchParams();
    const c = next.category !== undefined ? next.category : category;
    const q = next.query !== undefined ? next.query : query;
    if (c) params.set("category", c);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/knowledge${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{m.title}</h2>
          <p className="text-sm text-muted-foreground">{m.sub}</p>
        </div>
        <Link
          href="/knowledge/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> {m.add}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="font-display text-2xl font-semibold tnum text-primary">{articles.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">{m.statArticles}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="font-display text-2xl font-semibold tnum text-primary">{articles.filter((a) => a.status === "published").length}</p>
          <p className="mt-1 text-xs text-muted-foreground">{m.statPublished}</p>
        </div>
      </div>

      <form action="/knowledge" className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground">
        {category && <input type="hidden" name="category" value={category} />}
        <Search className="h-4 w-4" />
        <input
          name="q"
          defaultValue={query}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          placeholder={m.search}
        />
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref({ category: undefined })}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            !category ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {m.allCategories}
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={buildHref({ category: c })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {articles.map((a) => (
          <Link
            key={a.id}
            href={`/knowledge/${a.id}`}
            className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold tracking-tight">{a.title}</h3>
                  <span className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    a.status === "published" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground",
                  )}>
                    {a.status === "published" ? m.published : m.draft}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{a.content}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>{a.category ?? "—"}</span>
              <span className="tnum">{m.updated} {new Date(a.updated_at).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}</span>
            </div>
          </Link>
        ))}
        {articles.length === 0 && <p className="col-span-full px-1 py-8 text-center text-sm text-muted-foreground">{m.empty}</p>}
      </div>
    </div>
  );
}
