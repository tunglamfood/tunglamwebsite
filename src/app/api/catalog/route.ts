import { getBrands, getCategories, getProducts } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

/**
 * The published product list with photos, for the ERP's dealer-portal catalogue
 * (tunglam.vercel.app → Sales → Dealer portal → Catalogue), where staff pick
 * which website product's photo a portal product shows.
 *
 * Only what the public product pages already show. Not for search engines.
 */
export const revalidate = 600;

export async function GET() {
  const [products, categories, brands] = await Promise.all([getProducts(), getCategories(), getBrands()]);
  const category = new Map(categories.map((c) => [c.id, c.name.en ?? c.slug]));
  const brand = new Map(brands.map((b) => [b.id, b.name]));
  return Response.json(
    {
      products: products.map((p) => ({
        slug: p.slug,
        name: p.name.en ?? p.slug,
        weight: p.net_weight,
        category: (p.category_id && category.get(p.category_id)) || null,
        brand: (p.brand_id && brand.get(p.brand_id)) || null,
        image: mediaUrl(p.images[0]?.path),
      })),
    },
    { headers: { "X-Robots-Tag": "noindex" } },
  );
}
