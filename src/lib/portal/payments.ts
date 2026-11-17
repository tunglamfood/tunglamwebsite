"use server";

import { erp } from "./erp";
import { getPortal } from "./context";

/**
 * A dealer uploads a bank-transfer slip. The file goes to the ERP's private
 * "payment-slips" bucket and a row to `portal_payments`; the office checks it in
 * ERP → Sales → Payments. The amount is what the dealer typed — nothing is calculated.
 */
export type PaymentState = { ok: true; at: number } | { ok: false; error: "amount" | "date" | "file" | "tooBig" | "type" | "generic" | "tooMany" | "signedOut" } | null;

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PER_DAY = 20;

/** The file's own first bytes must match what it claims to be. */
function kindOf(bytes: Uint8Array, claimed: string): { ext: string; type: string } | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (claimed === "image/jpeg" && starts(0xff, 0xd8, 0xff)) return { ext: "jpg", type: claimed };
  if (claimed === "image/png" && starts(0x89, 0x50, 0x4e, 0x47)) return { ext: "png", type: claimed };
  if (claimed === "image/webp" && starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return { ext: "webp", type: claimed };
  if (claimed === "application/pdf" && starts(0x25, 0x50, 0x44, 0x46)) return { ext: "pdf", type: claimed };
  return null;
}

export async function submitPayment(_prev: PaymentState, formData: FormData): Promise<PaymentState> {
  const ctx = await getPortal();
  if (!ctx?.customer) return { ok: false, error: "signedOut" };

  const amount = Number(String(formData.get("amount") ?? "").replace(/[,\s]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) return { ok: false, error: "amount" };
  const paidOn = String(formData.get("paid_on") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) return { ok: false, error: "date" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "file" };
  if (file.size > MAX_BYTES) return { ok: false, error: "tooBig" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = kindOf(bytes, file.type);
  if (!kind) return { ok: false, error: "type" };

  const db = erp();
  const since = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await db
    .from("portal_payments")
    .select("id", { count: "exact", head: true })
    .eq("portal_account_id", ctx.account.id)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_DAY) return { ok: false, error: "tooMany" };

  // Only one of this dealer's own orders can be named.
  let orderNo = String(formData.get("order_no") ?? "").trim() || null;
  if (orderNo) {
    const { data } = await db.from("sales_orders").select("order_no").eq("order_no", orderNo).eq("customer_code", ctx.customer.code).maybeSingle();
    if (!data) orderNo = null;
  }

  const path = `${ctx.customer.code.replace(/[^\w-]/g, "_")}/${Date.now()}-${crypto.randomUUID()}.${kind.ext}`;
  const up = await db.storage.from("payment-slips").upload(path, bytes, { contentType: kind.type, upsert: false });
  if (up.error) {
    console.error("payment slip upload failed", up.error.message);
    return { ok: false, error: "generic" };
  }
  const { error } = await db.from("portal_payments").insert({
    customer_code: ctx.customer.code,
    portal_account_id: ctx.account.id,
    placed_by: ctx.account.name || ctx.account.phone,
    order_no: orderNo,
    amount: Math.round(amount * 100) / 100,
    currency: ctx.customer.currency ?? "MYR",
    paid_on: paidOn,
    reference: String(formData.get("reference") ?? "").trim().slice(0, 80) || null,
    note: String(formData.get("note") ?? "").trim().slice(0, 500) || null,
    file_path: path,
    file_type: kind.type,
  });
  if (error) {
    console.error("payment slip save failed", error.message);
    await db.storage.from("payment-slips").remove([path]);
    return { ok: false, error: "generic" };
  }
  return { ok: true, at: Date.now() };
}
