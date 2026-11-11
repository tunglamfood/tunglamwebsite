import Link from "next/link";
import { adminBrands, adminProducts } from "@/lib/admin/queries";
import { brandLogoSrc } from "@/components/brand/brand-logos";
import { AdminHeader, Card, NewButton } from "@/components/admin/ui";

export const metadata = { title: "Brands" };

export default async function BrandsAdmin() {
  const [brands, products] = await Promise.all([adminBrands(), adminProducts()]);
  return (
    <>
      <AdminHeader title="Brands" action={<NewButton href="/admin/brands/new" label="New brand" />} />
      <Card>
        <ul className="divide-y divide-line">
          {brands.map((b) => {
            const logo = brandLogoSrc(b);
            return (
              <li key={b.id}>
                <Link href={`/admin/brands/${b.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-cream">
                  <span className="grid h-10 w-16 shrink-0 place-items-center rounded-md border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {logo && <img src={logo} alt="" className="max-h-8 max-w-14 object-contain" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{b.name}</span>
                    <span className="block truncate text-xs text-muted">{b.tagline.en}</span>
                  </span>
                  <span className="text-xs text-muted">{products.filter((p) => p.brand_id === b.id).length} products</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
