"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { refreshWebsite } from "@/lib/admin/actions";
import { btnClass } from "./ui";

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
      className={btnClass("secondary")}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : done ? <Check className="size-4 text-emerald-600" /> : <RefreshCw className="size-4" />}
      Refresh website
    </button>
  );
}
