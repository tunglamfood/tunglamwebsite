import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

/** Rendered inside the [lang] layout. Text is trilingual because not-found has no params. */
export default function NotFound() {
  return (
    <section className="container-x grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="font-display text-8xl font-semibold text-brand">404</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">Page not found · Halaman tidak ditemui · 找不到页面</h1>
        <p className="mx-auto mt-3 max-w-lg text-ink-soft">The page you&rsquo;re looking for has moved or no longer exists.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonClass("primary", "md")}>Home</Link>
          <Link href="/products" className={buttonClass("ghost", "md")}>Products</Link>
        </div>
      </div>
    </section>
  );
}
