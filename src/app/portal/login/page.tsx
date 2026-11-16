import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { pfmt } from "@/lib/portal/i18n";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function PortalLogin() {
  if (await getPortal()) redirect("/portal");
  const [d, lang] = await Promise.all([getPortalDict(), getPortalLang()]);
  const demo = process.env.PORTAL_DEMO_OTP ? pfmt(d.demoBanner, { code: process.env.PORTAL_DEMO_OTP }) : null;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div aria-hidden className="absolute -right-40 -top-40 -z-10 size-[34rem] rounded-full bg-sun-soft blur-3xl" />
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-10 w-auto" priority />
          <span className="text-sm font-semibold text-ink-soft">{d.appName}</span>
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{d.login.title}</h1>
        <p className="mt-2 text-ink-soft">{d.login.lead}</p>
        {demo && <p className="mt-5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white">{demo}</p>}
        <div className="mt-6">
          <LoginForm labels={d.login} lang={lang} />
        </div>
        <Link href="/wholesale" className="mt-6 block text-center text-sm font-medium text-brand hover:underline">
          {d.login.apply}
        </Link>
      </div>
    </main>
  );
}
