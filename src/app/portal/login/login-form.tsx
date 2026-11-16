"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { requestCode, setPortalLang, verifyCode, type LoginState } from "@/lib/portal/actions";
import { LANG_LABEL, PORTAL_LANGS, pfmt, type PortalDict, type PortalLang } from "@/lib/portal/i18n";
import { showPhone, normalisePhone } from "@/lib/portal/phone";
import { PhoneField } from "@/components/portal/phone-field";
import { pbtn } from "@/components/portal/bits";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-lg text-ink shadow-[var(--shadow-xs)] outline-none transition placeholder:text-muted/60 hover:border-ink/20 focus:border-ink/40 focus:ring-4 focus:ring-ink/5";
const primary = pbtn("primary", "lg", "w-full");

export function LoginForm({ labels, lang }: { labels: PortalDict["login"]; lang: PortalLang }) {
  // Which number a code was sent to; null while still asking for the number.
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneState, sendAction, sending] = useActionState<LoginState, FormData>(async (prev, fd) => {
    const res = await requestCode(prev, fd);
    if (res.step === "code") setPhone(res.phone);
    return res;
  }, { step: "phone" });
  const [codeState, verifyAction, verifying] = useActionState<LoginState, FormData>(verifyCode, { step: "phone" });
  const router = useRouter();
  const [langPending, startLang] = useTransition();
  const codeError = codeState.step === "code" && codeState.phone === phone ? codeState.error : undefined;

  const errorText = (e?: string) => (e ? (labels as unknown as Record<string, string>)[e] ?? labels.badCode : null);

  return (
    <div>
      {phone === null ? (
        <form action={sendAction} className="space-y-4">
          <PhoneField label={labels.phone} />
          {phoneState.step === "phone" && phoneState.error && (
            <p role="alert" className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorText(phoneState.error)}</p>
          )}
          <button type="submit" disabled={sending} className={primary}>
            {sending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {sending ? labels.sending : labels.sendCode}
          </button>
        </form>
      ) : (
        <form action={verifyAction} className="space-y-4">
          <p className="animate-fade-in rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{pfmt(labels.codeSent, { phone: showPhone(normalisePhone(phone) ?? phone) })}</p>
          <input type="hidden" name="phone" value={phone} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">{labels.code}</span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={8}
              required
              autoFocus
              className={`${field} text-center text-2xl tracking-[0.5em]`}
            />
          </label>
          {codeError && (
            <p role="alert" className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errorText(codeError)}</p>
          )}
          <button type="submit" disabled={verifying} className={primary}>
            {verifying && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {verifying ? labels.verifying : labels.verify}
          </button>
          <button type="button" onClick={() => setPhone(null)} className="w-full rounded-lg py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-sand hover:text-ink">
            {labels.changePhone}
          </button>
        </form>
      )}

      <div className="mx-auto mt-8 grid w-fit grid-cols-3 gap-1 rounded-xl bg-sand p-1">
        {PORTAL_LANGS.map((l) => (
          <button
            key={l}
            type="button"
            disabled={langPending}
            onClick={() => startLang(async () => { await setPortalLang(l); router.refresh(); })}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${l === lang ? "bg-white text-ink shadow-[var(--shadow-card)]" : "text-ink-soft hover:text-ink"}`}
          >
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
