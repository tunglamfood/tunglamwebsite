"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { refreshWebsite } from "@/lib/admin/actions";

/** Expires the public website cache (saves already do this automatically). */
export function RefreshButton() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title="Saving content already updates the website. Use this after editing data directly in Supabase."
      onClick={() =>
        start(async () => {
          await refreshWebsite();
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        })
      }
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink-soft hover:text-ink"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : done ? <Check className="size-4 text-leaf" /> : <RefreshCw className="size-4" />}
      Refresh website
    </button>
  );
}
