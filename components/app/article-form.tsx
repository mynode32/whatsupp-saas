"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createArticleAction, updateArticleAction } from "@/lib/actions/knowledge";
import type { AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

const M = {
  tr: { title: "Başlık", category: "Kategori", content: "İçerik", save: "Kaydet", create: "Oluştur" },
  en: { title: "Title", category: "Category", content: "Content", save: "Save", create: "Create" },
};

export function ArticleForm({
  organizationId,
  article,
}: {
  organizationId: string;
  article?: { id: string; title: string; content: string; category: string | null };
}) {
  const { lang } = useLang();
  const m = M[lang];
  const isEdit = !!article;
  const [state, formAction, pending] = useActionState(isEdit ? updateArticleAction : createArticleAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      {isEdit && <input type="hidden" name="id" value={article.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="title">{m.title}</Label>
        <Input id="title" name="title" defaultValue={article?.title} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">{m.category}</Label>
        <Input id="category" name="category" defaultValue={article?.category ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="content">{m.content}</Label>
        <textarea
          id="content"
          name="content"
          defaultValue={article?.content}
          required
          rows={12}
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {state.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="gap-2">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isEdit ? m.save : m.create}
      </Button>
    </form>
  );
}
