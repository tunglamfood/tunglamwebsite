"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Trash2, XCircle } from "lucide-react";
import type { ActionResult } from "@/lib/admin/actions";
import { EditLangContext, LANGS, type Lang } from "./fields";
import { btnClass } from "./ui";

/**
 * Wraps an edit form: sticky top bar with back link, language switch, view-on-site,
 * delete and save. Calls the given server actions and shows the result.
 */
export function FormShell({
  title,
  backHref,
  viewHref,
  isNew,
  onSave,
  onDelete,
  editPath,
  children,
}: {
  title: string;
  backHref: string;
  viewHref?: string | null;
  isNew: boolean;
  onSave: () => Promise<ActionResult>;
  onDelete?: () => Promise<ActionResult>;
  /** Where to go after creating a new item, e.g. "/admin/products/" + id. */
  editPath: (id: string) => string;
  children: ReactNode;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  const save = () =>
    start(async () => {
      setStatus(null);
      const res = await onSave();
      if (!res.ok) return setStatus({ ok: false, text: res.error });
      setStatus({ ok: true, text: res.message ?? "Saved." });
      if (isNew && res.id) router.replace(editPath(res.id));
      else router.refresh();
    });

  const remove = () => {
    if (!onDelete || !confirm("Delete this permanently? This cannot be undone.")) return;
    start(async () => {
      const res = await onDelete();
      if (!res.ok) return setStatus({ ok: false, text: res.error });
      router.replace(backHref);
      router.refresh();
    });
  };

  return (
    <EditLangContext.Provider value={lang}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="pb-24"
      >
        <div className="sticky top-14 z-20 -mx-4 -mt-6 mb-6 border-b border-line bg-cream/90 px-4 py-3 backdrop-blur-xl sm:-mx-8 sm:-mt-8 sm:px-8 lg:top-16">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={backHref} className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink-soft shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors hover:border-zinc-300 hover:text-ink" aria-label="Back">
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="min-w-0 flex-1 basis-[calc(100%-3rem)] truncate text-lg font-semibold tracking-[-0.01em] text-ink sm:basis-auto sm:text-xl">{title}</h1>

            <div className="flex rounded-lg border border-line bg-white p-0.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] max-sm:mr-auto" role="tablist" aria-label="Editing language">
              {LANGS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  role="tab"
                  aria-selected={lang === l.key}
                  onClick={() => setLang(l.key)}
                  className={clsx("rounded-md px-3 py-1 text-sm font-medium transition-colors", lang === l.key ? "bg-ink text-white shadow-sm" : "text-ink-soft hover:bg-sand hover:text-ink")}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {viewHref && !isNew && (
                <a href={viewHref} target="_blank" rel="noopener" className={btnClass("secondary", "md", "hidden sm:inline-flex")}>
                  <ExternalLink className="size-4" /> View
                </a>
              )}
              {onDelete && !isNew && (
                <button type="button" onClick={remove} disabled={pending} className={btnClass("danger", "md", "w-9 px-0")} aria-label="Delete">
                  <Trash2 className="size-4" />
                </button>
              )}
              <button type="submit" disabled={pending} className={btnClass("primary", "md", "px-4")}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                {isNew ? "Create" : "Save"}
              </button>
            </div>
          </div>
          {status && (
            <p
              role="status"
              className={clsx(
                "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                status.ok ? "animate-fade-in border border-emerald-200 bg-emerald-50 text-emerald-700" : "animate-fade-in border border-red-200 bg-red-50 text-red-700",
              )}
            >
              {status.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
              {status.text}
            </p>
          )}
        </div>
        <div className="space-y-6">{children}</div>
      </form>
    </EditLangContext.Provider>
  );
}
