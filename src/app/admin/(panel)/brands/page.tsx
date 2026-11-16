import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { adminBrands, adminProducts } from "@/lib/admin/queries";
import { brandLogoSrc } from "@/components/brand/brand-logos";
import { AdminHeader, NewButton } from "@/components/admin/ui";

export const metadata = { title: "Brands" };

export default async function BrandsAdmin() {
  const [brands, products] = await Promise.all([adminBrands(), adminProducts()]);
  return (
    <>
      <AdminHeader title="Brands" description={`${brands.length} brands made by Tung Lam.`} action={<NewButton href="/admin/brands/new" label="New brand" />} />
      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {brands.map((b) => {
          const logo = brandLogoSrc(b);
          const count = products.filter((p) => p.brand_id === b.id).length;
          return (
            <li key={b.id}>
              <Link
                href={`/admin/brands/${b.id}`}
                className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.15)] sm:p-5"
              >
                <span className="grid h-16 w-24 shrink-0 place-items-center rounded-xl border border-line bg-cream p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {logo && <img src={logo} alt="" className="max-h-full max-w-full object-contain" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{b.name}</span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{b.tagline.en}</span>
                  <span className="mt-2 inline-block rounded-md bg-sand px-1.5 py-0.5 text-xs font-medium text-ink-soft">{count} products</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 self-start text-muted transition group-hover:text-ink" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
