import Image from "next/image";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden px-4">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div aria-hidden className="absolute left-1/2 top-0 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-brand/[0.06] blur-3xl" />
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid h-16 w-24 place-items-center rounded-2xl border border-line bg-white p-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
            <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} priority className="h-auto w-full" />
          </span>
          <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-ink">Sign in to Tung Lam Admin</h1>
          <p className="mt-1 text-sm text-muted">Manage the content of tunglamfood.my</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
