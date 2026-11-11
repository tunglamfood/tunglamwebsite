"use client";

import { useActionState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/lib/actions/inquiry";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import type { Locale } from "@/lib/i18n";

export type InquiryFormLabels = {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  messagePlaceholder: string;
  kind: string;
  kinds: Record<"general" | "wholesale" | "product" | "career", string>;
  submit: string;
  sending: string;
  success: string;
  error: string;
  required: string;
  consent: string;
  orWhatsapp: string;
};

type Kind = keyof InquiryFormLabels["kinds"];

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

export function InquiryForm({
  labels,
  locale,
  defaultKind = "general",
  kinds,
  productSlug,
  defaultMessage,
  whatsappHref,
}: {
  labels: InquiryFormLabels;
  locale: Locale;
  defaultKind?: Kind;
  /** Which kinds to offer in the selector; hidden when only one. */
  kinds?: Kind[];
  productSlug?: string;
  defaultMessage?: string;
  whatsappHref: string;
}) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  const options = kinds ?? (["general", "wholesale", "product", "career"] as Kind[]);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-card)] bg-leaf-soft p-8 text-center" role="status">
        <CheckCircle2 className="size-10 text-leaf" aria-hidden />
        <p className="text-lg font-semibold text-ink">{labels.success}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2" noValidate={false}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="page_url" value={pathname ?? ""} />
      <input ref={startedRef} type="hidden" name="started_at" defaultValue="" />
      {productSlug && <input type="hidden" name="product_slug" value={productSlug} />}
      {/* Honeypot — hidden from humans. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {options.length > 1 ? (
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink-soft">{labels.kind}</span>
          <select name="kind" defaultValue={defaultKind} className={field}>
            {options.map((k) => (
              <option key={k} value={k}>
                {labels.kinds[k]}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="kind" value={options[0]} />
      )}

      <label>
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">{labels.name} *</span>
        <input name="name" required maxLength={120} autoComplete="name" className={field} />
      </label>
      <label>
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">{labels.company}</span>
        <input name="company" maxLength={160} autoComplete="organization" className={field} />
      </label>
      <label>
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">{labels.phone}</span>
        <input name="phone" type="tel" maxLength={40} autoComplete="tel" inputMode="tel" className={field} />
      </label>
      <label>
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">{labels.email}</span>
        <input name="email" type="email" maxLength={200} autoComplete="email" className={field} />
      </label>
      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-ink-soft">{labels.message}</span>
        <textarea
          name="message"
          rows={5}
          maxLength={4000}
          defaultValue={defaultMessage}
          placeholder={labels.messagePlaceholder}
          className={`${field} resize-y`}
        />
      </label>

      {(state.status === "invalid" || state.status === "error") && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 sm:col-span-2" role="alert">
          {state.status === "invalid" ? labels.required : labels.error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg")}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? labels.sending : labels.submit}
        </button>
        <a href={whatsappHref} target="_blank" rel="noopener" className={buttonClass("ghost", "lg")}>
          <WhatsAppIcon className="size-5 text-[#1fa855]" />
          {labels.orWhatsapp}
        </a>
      </div>
      <p className="text-xs text-muted sm:col-span-2">{labels.consent}</p>
    </form>
  );
}
