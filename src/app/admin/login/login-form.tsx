"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "@/lib/admin/actions";
import { inputClass } from "@/components/admin/fields";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-line bg-white p-6">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
          Password
        </label>
        <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className={inputClass} />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </button>
    </form>
  );
}
