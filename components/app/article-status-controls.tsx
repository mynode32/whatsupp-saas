"use client";

import { Archive, Send, RotateCcw, Trash2 } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { setArticleStatusAction, deleteArticleAction } from "@/lib/actions/knowledge";

const M = {
  tr: { publish: "Yayınla", unpublish: "Taslağa al", archive: "Arşivle", restore: "Arşivden çıkar", delete: "Sil", chunks: "parça (arama indeksi)" },
  en: { publish: "Publish", unpublish: "Unpublish", archive: "Archive", restore: "Unarchive", delete: "Delete", chunks: "chunks (search index)" },
};

export function ArticleStatusControls({
  id,
  organizationId,
  status,
  chunkCount,
}: {
  id: string;
  organizationId: string;
  status: "draft" | "published" | "archived";
  chunkCount: number;
}) {
  const { lang } = useLang();
  const m = M[lang];

  function statusForm(newStatus: "draft" | "published" | "archived", label: string, Icon: typeof Send) {
    return (
      <form
        action={async (formData: FormData) => {
          await setArticleStatusAction({}, formData);
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="status" value={newStatus} />
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-border transition hover:bg-muted cursor-pointer">
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "published" && statusForm("published", m.publish, Send)}
      {status === "published" && statusForm("draft", m.unpublish, RotateCcw)}
      {status !== "archived" && statusForm("archived", m.archive, Archive)}
      {status === "archived" && statusForm("draft", m.restore, RotateCcw)}
      <form action={deleteArticleAction}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-destructive ring-1 ring-border transition hover:bg-destructive/10 cursor-pointer">
          <Trash2 className="h-3.5 w-3.5" /> {m.delete}
        </button>
      </form>
      {status === "published" && (
        <span className="ml-auto text-xs text-muted-foreground">{chunkCount} {m.chunks}</span>
      )}
    </div>
  );
}
