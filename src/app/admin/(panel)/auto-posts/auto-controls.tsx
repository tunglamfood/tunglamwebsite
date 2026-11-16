"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { addAutoTopic, checkAutoImages, deleteAutoPost, retryAutoPost, runAutoNow, setAutoEnabled, type ActionResult } from "@/lib/admin/actions";
import { Toggle, inputClass } from "@/components/admin/fields";

function useAction() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.message ?? "Done." } : { ok: false, text: r.error });
      router.refresh();
    });
  const note = msg && <p className={msg.ok ? "text-sm text-leaf" : "text-sm text-brand-700"}>{msg.text}</p>;
  return { pending, run, note };
}

const btn = "inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink-soft hover:text-ink disabled:opacity-50";

export function AutoToggle({ enabled }: { enabled: boolean }) {
  const { pending, run, note } = useAction();
  return (
    <div className="space-y-2">
      <Toggle
        label="Publish automatically every day"
        description={enabled ? "On — 3 new posts a day" : "Paused — nothing is written or published"}
        checked={enabled}
        onChange={(x) => !pending && run(() => setAutoEnabled(x))}
      />
      {note}
    </div>
  );
}

export function RunButtons() {
  const { pending, run, note } = useAction();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => runAutoNow("recipe"))} className={btn}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Write a recipe now
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => runAutoNow("guide"))} className={btn}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Write a guide now
        </button>
        <button type="button" disabled={pending} onClick={() => run(checkAutoImages)} className={btn}>
          <RefreshCw className="size-4" /> Check photos
        </button>
      </div>
      {pending && <p className="text-xs text-muted">Writing and checking takes 1–3 minutes. Keep this page open.</p>}
      {note}
    </div>
  );
}

export function AddTopic() {
  const { pending, run, note } = useAction();
  const [kind, setKind] = useState<"recipe" | "guide">("recipe");
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const r = await addAutoTopic(kind, title, keyword);
          if (r.ok) {
            setTitle("");
            setKeyword("");
          }
          return r;
        });
      }}
    >
      <p className="text-sm font-semibold text-ink">Suggest a topic</p>
      <p className="text-xs text-muted">Optional. Topics are planned automatically; anything you add here is written before them.</p>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as "recipe" | "guide")} className={inputClass}>
          <option value="recipe">Recipe</option>
          <option value="guide">Guide</option>
        </select>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fish ball curry for lok-lok" className={inputClass} />
      </div>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Main search phrase in English (optional), e.g. curry fish balls" className={inputClass} />
      <button type="submit" disabled={pending || title.trim().length < 4} className={btn}>
        {pending && <Loader2 className="size-4 animate-spin" />} Add to queue
      </button>
      {note}
    </form>
  );
}

export function PostActions({ id, status }: { id: string; status: string }) {
  const { pending, run } = useAction();
  if (!["planned", "rejected", "failed"].includes(status)) return null;
  return (
    <span className="flex gap-1">
      {(status === "rejected" || status === "failed") && (
        <button type="button" title="Try this topic again" disabled={pending} onClick={() => run(() => retryAutoPost(id))} className="grid size-7 place-items-center rounded-md text-muted hover:bg-cream hover:text-ink">
          <RotateCcw className="size-3.5" />
        </button>
      )}
      <button type="button" title="Remove" disabled={pending} onClick={() => run(() => deleteAutoPost(id))} className="grid size-7 place-items-center rounded-md text-muted hover:bg-cream hover:text-brand">
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </button>
    </span>
  );
}
