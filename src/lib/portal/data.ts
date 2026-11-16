import "server-only";
import { erp } from "./erp";
import type { PortalLang } from "./i18n";
import { getProducts } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

/* ── Catalogue ─────────────────────────────────────────────────────────────── */

export type CatalogVariant = {
  itemCode: string;
  label: string;
  uom: string;
  /** null = no price set yet ("price on confirmation"). */
  price: number | null;
  priceSource: "dealer" | "group" | "list" | "none";
  image: string | null;
};

export type CatalogProduct = {
  id: number;
  name: string;
  category: "tofu" | "steamboat" | "dessert" | "grocery";
  brand: string;
  image: string | null;
  variants: CatalogVariant[];
};

type CatalogRow = {
  product_id: number; name_en: string; name_ms: string | null; name_zh: string | null;
  category: CatalogProduct["category"]; brand: string; website_slug: string | null; product_sort: number;
  item_code: string; description: string; uom: string;
  label_en: string; label_ms: string | null; label_zh: string | null; variant_slug: string | null;
  variant_sort: number; price: string | number | null; price_source: CatalogVariant["priceSource"];
};

const pick = (lang: PortalLang, en: string, ms: string | null, zh: string | null) =>
  (lang === "ms" ? ms : lang === "zh" ? zh : en) || en;

/** Product photos come from the public website's catalogue, matched by slug. */
async function websiteImages(): Promise<Map<string, string>> {
  try {
    const products = await getProducts();
    const out = new Map<string, string>();
    for (const p of products) {
      const url = mediaUrl(p.images[0]?.path);
      if (url) out.set(p.slug, url);
    }
    return out;
  } catch {
    return new Map();
  }
}

/** Everything one dealer can order, grouped into products, at that dealer's prices. */
export async function getCatalog(customerCode: string, lang: PortalLang): Promise<CatalogProduct[]> {
  const [{ data, error }, images] = await Promise.all([
    erp().rpc("portal_catalog", { p_customer: customerCode }),
    websiteImages(),
  ]);
  if (error) throw new Error(`Could not load the catalogue: ${error.message}`);

  const byId = new Map<number, CatalogProduct>();
  for (const r of (data ?? []) as CatalogRow[]) {
    let p = byId.get(r.product_id);
    if (!p) {
      p = {
        id: r.product_id,
        name: pick(lang, r.name_en, r.name_ms, r.name_zh),
        category: r.category,
        brand: r.brand,
        image: (r.website_slug && images.get(r.website_slug)) || null,
        variants: [],
      };
      byId.set(r.product_id, p);
    }
    const price = r.price == null ? null : Number(r.price);
    p.variants.push({
      itemCode: r.item_code,
      label: pick(lang, r.label_en, r.label_ms, r.label_zh),
      uom: r.uom,
      price: price && price > 0 ? price : null,
      priceSource: r.price_source,
      image: (r.variant_slug && images.get(r.variant_slug)) || null,
    });
  }
  // A product without its own photo borrows the first variant photo it has.
  for (const p of byId.values()) p.image ??= p.variants.find((v) => v.image)?.image ?? null;
  return [...byId.values()];
}

/* ── Orders ────────────────────────────────────────────────────────────────── */

export type OrderLine = {
  lineNo: number;
  itemCode: string;
  description: string;
  qty: number;
  uom: string;
  price: number;
  priceSource: string | null;
};

export type OrderEvent = { at: string; actor: string; kind: string };

export type PortalOrder = {
  id: number;
  orderNo: string;
  customerCode: string;
  orderDate: string;
  deliverOn: string | null;
  status: "submitted" | "draft" | "confirmed" | "delivered" | "cancelled";
  theirRef: string | null;
  note: string | null;
  source: "erp" | "portal" | "rep";
  placedBy: string | null;
  currency: string;
  createdAt: string;
  lines: OrderLine[];
  total: number;
  hasTbc: boolean;
};

type OrderRow = {
  id: number; order_no: string; customer_code: string; order_date: string; deliver_on: string | null;
  status: PortalOrder["status"]; their_ref: string | null; note: string | null; source: PortalOrder["source"];
  placed_by: string | null; currency: string | null; created_at: string;
};

/** Orders the dealer should see: theirs, newest first. Office drafts stay internal. */
export async function getOrders(customerCodes: string[], limit = 50): Promise<PortalOrder[]> {
  if (customerCodes.length === 0) return [];
  const db = erp();
  const { data, error } = await db
    .from("sales_orders")
    .select("id, order_no, customer_code, order_date, deliver_on, status, their_ref, note, source, placed_by, currency, created_at")
    .in("customer_code", customerCodes)
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load your orders: ${error.message}`);
  const orders = (data ?? []) as OrderRow[];
  if (orders.length === 0) return [];
  const lines = await linesFor(orders.map((o) => o.id));
  return orders.map((o) => toOrder(o, lines.get(o.id) ?? []));
}

export async function getOrder(orderNo: string, customerCodes: string[]): Promise<(PortalOrder & { events: OrderEvent[] }) | null> {
  const db = erp();
  const { data } = await db
    .from("sales_orders")
    .select("id, order_no, customer_code, order_date, deliver_on, status, their_ref, note, source, placed_by, currency, created_at")
    .eq("order_no", orderNo)
    .maybeSingle();
  const o = data as OrderRow | null;
  if (!o || !customerCodes.includes(o.customer_code) || o.status === "draft") return null;
  const [lines, { data: ev }] = await Promise.all([
    linesFor([o.id]),
    db.from("sales_order_events").select("at, actor, kind").eq("order_id", o.id).order("at"),
  ]);
  return { ...toOrder(o, lines.get(o.id) ?? []), events: (ev ?? []) as OrderEvent[] };
}

async function linesFor(orderIds: number[]): Promise<Map<number, OrderLine[]>> {
  const db = erp();
  const { data, error } = await db
    .from("sales_order_lines")
    .select("order_id, line_no, item_code, qty, uom, price, price_source")
    .in("order_id", orderIds)
    .order("line_no");
  if (error) throw new Error(`Could not load the order lines: ${error.message}`);
  const rows = (data ?? []) as { order_id: number; line_no: number; item_code: string; qty: number; uom: string; price: number; price_source: string | null }[];
  const codes = [...new Set(rows.map((r) => r.item_code))];
  const { data: items } = codes.length
    ? await db.from("sales_products").select("item_code, description").in("item_code", codes)
    : { data: [] };
  const desc = new Map(((items ?? []) as { item_code: string; description: string }[]).map((i) => [i.item_code, i.description]));
  const out = new Map<number, OrderLine[]>();
  for (const r of rows) {
    if (!out.has(r.order_id)) out.set(r.order_id, []);
    out.get(r.order_id)!.push({
      lineNo: r.line_no,
      itemCode: r.item_code,
      description: desc.get(r.item_code) ?? r.item_code,
      qty: Number(r.qty),
      uom: r.uom,
      price: Number(r.price),
      priceSource: r.price_source,
    });
  }
  return out;
}

function toOrder(o: OrderRow, lines: OrderLine[]): PortalOrder {
  const total = Math.round(lines.reduce((s, l) => s + l.qty * l.price, 0) * 100) / 100;
  return {
    id: o.id,
    orderNo: o.order_no,
    customerCode: o.customer_code,
    orderDate: o.order_date,
    deliverOn: o.deliver_on,
    status: o.status,
    theirRef: o.their_ref,
    note: o.note,
    source: o.source ?? "erp",
    placedBy: o.placed_by,
    currency: o.currency ?? "MYR",
    createdAt: o.created_at,
    lines,
    total,
    hasTbc: lines.some((l) => !(l.price > 0)),
  };
}
