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

/** Every orderable item for this dealer with its names in all three languages (for the order assistant). */
export type AssistantItem = {
  itemCode: string;
  names: string[];
  labels: string[];
  description: string;
  uom: string;
  brand: string;
  category: CatalogProduct["category"];
};

export async function getAssistantCatalog(customerCode: string): Promise<AssistantItem[]> {
  const { data, error } = await erp().rpc("portal_catalog", { p_customer: customerCode });
  if (error) throw new Error(`Could not load the catalogue: ${error.message}`);
  const uniq = (xs: (string | null)[]) => [...new Set(xs.filter((x): x is string => !!x && !!x.trim()))];
  return ((data ?? []) as CatalogRow[]).map((r) => ({
    itemCode: r.item_code,
    names: uniq([r.name_en, r.name_ms, r.name_zh]),
    labels: uniq([r.label_en, r.label_ms, r.label_zh]),
    description: r.description,
    uom: r.uom,
    brand: r.brand,
    category: r.category,
  }));
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

export type OrderChange = { item: string; description: string; from: number; to: number; uom: string };

export type OrderEvent = {
  at: string;
  actor: string;
  kind: string;
  /** Done by Tung Lam's office (not by the dealer). */
  office: boolean;
  /** What the office changed, and its message to the dealer. */
  changes: OrderChange[];
  message: string | null;
};

/** The ERP writes office events as "Tung Lam" ("Office" on older ones); the portal writes the dealer's name. */
const OFFICE_ACTORS = ["Tung Lam", "Office"];

/** The latest thing the office did on each of the dealer's orders, newest first (for the "Updated" marks). */
export type OrderUpdate = { orderNo: string; at: string; kind: string; deliverOn: string | null };

export async function getOrderUpdates(customerCodes: string[], days = 30): Promise<OrderUpdate[]> {
  if (customerCodes.length === 0) return [];
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data, error } = await erp()
    .from("sales_order_events")
    .select("at, kind, sales_orders!inner(order_no, customer_code, status, deliver_on)")
    .in("sales_orders.customer_code", customerCodes)
    .neq("sales_orders.status", "draft")
    .in("actor", OFFICE_ACTORS)
    .gte("at", since)
    .order("at", { ascending: false })
    .limit(100);
  if (error) return [];
  const seen = new Set<string>();
  const out: OrderUpdate[] = [];
  for (const r of (data ?? []) as unknown as { at: string; kind: string; sales_orders: unknown }[]) {
    const o = (Array.isArray(r.sales_orders) ? r.sales_orders[0] : r.sales_orders) as { order_no: string; deliver_on: string | null } | undefined;
    if (!o || seen.has(o.order_no)) continue;
    seen.add(o.order_no);
    out.push({ orderNo: o.order_no, at: r.at, kind: r.kind, deliverOn: o.deliver_on });
  }
  return out;
}

export type PortalOrder = {
  id: number;
  orderNo: string;
  customerCode: string;
  orderDate: string;
  deliverOn: string | null;
  status: "submitted" | "on_hold" | "draft" | "confirmed" | "delivered" | "cancelled";
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
    db.from("sales_order_events").select("at, actor, kind, detail").eq("order_id", o.id).order("at"),
  ]);
  type Raw = { at: string; actor: string; kind: string; detail: { changes?: { item: string; from: number; to: number; uom?: string }[]; message?: string } | null };
  const raw = (ev ?? []) as Raw[];
  const codes = [...new Set(raw.flatMap((e) => e.detail?.changes?.map((c) => c.item) ?? []))];
  const { data: items } = codes.length
    ? await db.from("sales_products").select("item_code, description").in("item_code", codes)
    : { data: [] };
  const desc = new Map(((items ?? []) as { item_code: string; description: string }[]).map((i) => [i.item_code, i.description]));
  const events: OrderEvent[] = raw.map((e) => {
    const office = OFFICE_ACTORS.includes(e.actor);
    return {
      at: e.at,
      // The dealer sees the company, not which person in the office did it.
      actor: office ? "Tung Lam" : e.actor,
      kind: e.kind,
      office,
      changes: (e.detail?.changes ?? []).map((c) => ({
        item: c.item, description: desc.get(c.item) ?? c.item, from: Number(c.from), to: Number(c.to), uom: c.uom ?? "",
      })),
      message: office ? (e.detail?.message ?? null) : null,
    };
  });
  return { ...toOrder(o, lines.get(o.id) ?? []), events };
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

/* ── Payment slips ─────────────────────────────────────────────────────────── */

export type PortalPayment = {
  id: number;
  orderNo: string | null;
  amount: number;
  currency: string;
  paidOn: string;
  reference: string | null;
  fileType: string;
  status: "submitted" | "checked" | "rejected";
  officeNote: string | null;
  createdAt: string;
};

/** Slips this dealer sent, newest first. The amounts are as the dealer typed them. */
export async function getPayments(customerCode: string): Promise<PortalPayment[]> {
  const { data, error } = await erp()
    .from("portal_payments")
    .select("id, order_no, amount, currency, paid_on, reference, file_type, status, office_note, created_at")
    .eq("customer_code", customerCode)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(`Could not load your payment slips: ${error.message}`);
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as number,
    orderNo: (r.order_no as string) ?? null,
    amount: Number(r.amount),
    currency: (r.currency as string) ?? "MYR",
    paidOn: r.paid_on as string,
    reference: (r.reference as string) ?? null,
    fileType: r.file_type as string,
    status: r.status as PortalPayment["status"],
    // A note is only for the dealer when the slip was turned down.
    officeNote: r.status === "rejected" ? ((r.office_note as string) ?? null) : null,
    createdAt: r.created_at as string,
  }));
}

/* ── Usual items ───────────────────────────────────────────────────────────── */

export type UsualItem = { times: number; lastQty: number; lastOrdered: string };

/** What this dealer ordered in the last six months, by item code — most often first. */
export async function getUsualItems(customerCode: string): Promise<Record<string, UsualItem>> {
  const { data, error } = await erp().rpc("portal_usual_items", { p_customer: customerCode, p_limit: 40 });
  if (error) return {};
  const out: Record<string, UsualItem> = {};
  for (const r of (data ?? []) as { item_code: string; times: number; last_qty: number; last_ordered: string }[]) {
    out[r.item_code] = { times: Number(r.times), lastQty: Number(r.last_qty), lastOrdered: r.last_ordered };
  }
  return out;
}

/* ── Announcements ─────────────────────────────────────────────────────────── */

export type Announcement = { id: number; title: string; body: string };

/** Notices the office has switched on for today (Malaysia time), in the dealer's language. */
export async function getAnnouncements(lang: PortalLang): Promise<Announcement[]> {
  const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
  const { data, error } = await erp()
    .from("portal_announcements")
    .select("id, title_en, title_ms, title_zh, body_en, body_ms, body_zh, starts_on, ends_on")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  const showing = (data ?? []).filter(
    (r) => (!r.starts_on || r.starts_on <= today) && (!r.ends_on || r.ends_on >= today),
  );
  return showing.slice(0, 5).map((r) => ({
    id: r.id,
    title: pick(lang, r.title_en, r.title_ms, r.title_zh),
    // A translated title with no translated body keeps the English body.
    body: pick(lang, r.body_en, r.body_ms, r.body_zh),
  }));
}
