"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "@/lib/admin/actions";
import { inputClass } from "@/components/admin/fields";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_40px_-20px_rgb(0_0_0/0.2)]">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-[0.8125rem] font-medium text-ink">
          Password
        </label>
        <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className={`${inputClass} h-10`} />
      </div>
      {state?.error && (
        <p role="alert" className="animate-fade-in rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(0_0_0/0.2)] transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </button>
    </form>
  );
}
