import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-brand text-sm font-bold text-white">TL</span>
          <div>
            <p className="text-sm font-semibold text-ink">Tung Lam Admin</p>
            <p className="text-xs text-muted">Website content management</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
