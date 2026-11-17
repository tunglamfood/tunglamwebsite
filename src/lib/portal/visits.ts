"use server";

import { erp } from "./erp";
import { getPortal } from "./context";

/**
 * Sales rep visits: check in at the dealer being served (with the phone's location
 * when the rep allows it), add photos and a note, check out. The office sees them in
 * ERP → Sales → Visits. Only rep logins can record visits, and only at their own dealers.
 */
export type VisitResult = { ok: true } | { ok: false; error: "notRep" | "noDealer" | "noVisit" | "photo" | "tooMany" | "generic" };

const OUTCOMES = ["ordered", "no_order", "collected", "follow_up", "closed"] as const;
const MAX_PHOTOS = 6;

type Where = { lat?: number | null; lng?: number | null; accuracy?: number | null };
const coord = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= max ? v : null);

async function rep() {
  const ctx = await getPortal();
  if (!ctx || ctx.account.role !== "rep" || !ctx.account.repCode) return null;
  return ctx;
}

export async function checkIn(where: Where): Promise<VisitResult> {
  const ctx = await rep();
  if (!ctx) return { ok: false, error: "notRep" };
  if (!ctx.customer) return { ok: false, error: "noDealer" };
  const db = erp();
  // One visit at a time: an earlier one left open is closed now.
  await db.from("sales_visits").update({ checked_out_at: new Date().toISOString() }).eq("rep_code", ctx.account.repCode).is("checked_out_at", null);
  const { error } = await db.from("sales_visits").insert({
    rep_code: ctx.account.repCode,
    portal_account_id: ctx.account.id,
    customer_code: ctx.customer.code,
    in_lat: coord(where?.lat, 90),
    in_lng: coord(where?.lng, 180),
    in_accuracy_m: typeof where?.accuracy === "number" ? Math.round(Math.min(where.accuracy, 100000)) : null,
  });
  if (error) {
    console.error("visit check-in failed", error.message);
    return { ok: false, error: "generic" };
  }
  return { ok: true };
}

export async function checkOut(input: Where & { outcome?: string; note?: string }): Promise<VisitResult> {
  const ctx = await rep();
  if (!ctx) return { ok: false, error: "notRep" };
  const outcome = OUTCOMES.find((o) => o === input?.outcome) ?? null;
  const { data, error } = await erp()
    .from("sales_visits")
    .update({
      checked_out_at: new Date().toISOString(),
      out_lat: coord(input?.lat, 90),
      out_lng: coord(input?.lng, 180),
      outcome,
      note: String(input?.note ?? "").trim().slice(0, 1000) || null,
    })
    .eq("rep_code", ctx.account.repCode)
    .is("checked_out_at", null)
    .select("id");
  if (error) return { ok: false, error: "generic" };
  if (!data?.length) return { ok: false, error: "noVisit" };
  return { ok: true };
}

/** Adds one photo (already shrunk in the browser) to the rep's open visit. */
export async function addVisitPhoto(formData: FormData): Promise<VisitResult> {
  const ctx = await rep();
  if (!ctx) return { ok: false, error: "notRep" };
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0 || file.size > 4 * 1024 * 1024) return { ok: false, error: "photo" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (!jpeg && !png) return { ok: false, error: "photo" };

  const db = erp();
  const { data: visit } = await db
    .from("sales_visits").select("id, photo_paths").eq("rep_code", ctx.account.repCode).is("checked_out_at", null).maybeSingle();
  if (!visit) return { ok: false, error: "noVisit" };
  const paths = (visit.photo_paths as string[]) ?? [];
  if (paths.length >= MAX_PHOTOS) return { ok: false, error: "tooMany" };

  const path = `${ctx.account.repCode}/${visit.id}/${Date.now()}.${jpeg ? "jpg" : "png"}`;
  const up = await db.storage.from("visit-photos").upload(path, bytes, { contentType: jpeg ? "image/jpeg" : "image/png" });
  if (up.error) return { ok: false, error: "photo" };
  const { error } = await db.from("sales_visits").update({ photo_paths: [...paths, path] }).eq("id", visit.id);
  if (error) {
    await db.storage.from("visit-photos").remove([path]);
    return { ok: false, error: "generic" };
  }
  return { ok: true };
}
