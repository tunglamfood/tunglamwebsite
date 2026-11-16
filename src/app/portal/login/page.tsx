import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, KeyRound } from "lucide-react";
import { getPortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function PortalLogin() {
  if (await getPortal()) redirect("/portal");
  const [d, lang] = await Promise.all([getPortalDict(), getPortalLang()]);

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      {/* Desktop: brand panel */}
      <aside className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image src="/images/wholesale.webp" alt="" fill priority sizes="50vw" className="object-cover opacity-45" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(215_25_32/0.35),transparent_55%)]" />
        <Link href="/" className="relative inline-flex w-fit items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5">
          <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-9 w-auto" />
          <span className="text-sm font-semibold text-ink-soft">{d.appName}</span>
        </Link>
        <div className="relative max-w-md animate-fade-up">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.03em]">{d.login.lead}</h2>
          <ul className="mt-8 space-y-3.5">
            {d.login.points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-white/85">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <Check className="size-4" aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/45">Tung Lam Food Industries · Menglembu, Perak</p>
      </aside>

      {/* Sign-in form */}
      <section className="relative isolate flex items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <div aria-hidden className="absolute -top-32 left-1/2 -z-10 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand/[0.05] blur-3xl" />
        <div className="w-full max-w-sm animate-fade-up">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-10 w-auto" priority />
            <span className="rounded-md bg-sand px-1.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{d.appName}</span>
          </Link>
          <span className="mb-5 hidden size-12 place-items-center rounded-2xl border border-line bg-white text-ink shadow-[var(--shadow-xs)] lg:grid">
            <KeyRound className="size-5" aria-hidden />
          </span>
          <h1 className="font-display text-[1.875rem] font-bold leading-tight tracking-[-0.03em] text-ink">{d.login.title}</h1>
          <p className="mt-2 text-ink-soft lg:hidden">{d.login.lead}</p>
          <div className="mt-6">
            <LoginForm labels={d.login} lang={lang} />
          </div>
          <Link href="/wholesale" className="mt-6 block text-center text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline">
            {d.login.apply}
          </Link>
        </div>
      </section>
    </main>
  );
}
