"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { erp } from "@/lib/portal/erp";

export type InquiryState = { status: "idle" | "success" | "error" | "invalid" };

const schema = z
  .object({
    kind: z.enum(["general", "wholesale", "product", "career"]),
    name: z.string().trim().min(1).max(120),
    company: z.string().trim().max(160).optional(),
    email: z.union([z.literal(""), z.string().trim().email().max(200)]).optional(),
    phone: z.string().trim().max(40).optional(),
    message: z.string().trim().max(4000).optional(),
    product_slug: z.string().trim().max(160).optional(),
    locale: z.enum(["en", "ms", "zh"]).optional(),
    page_url: z.string().trim().max(500).optional(),
    // Spam traps: a hidden field that must stay empty, and a minimum fill time.
    website: z.string().max(0).optional(),
    started_at: z.coerce.number().optional(),
  })
  .refine((v) => Boolean(v.email) || Boolean(v.phone), { path: ["email"] });

const blank = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v : undefined);

export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const parsed = schema.safeParse({
    kind: formData.get("kind") ?? "general",
    name: formData.get("name") ?? "",
    company: blank(formData.get("company")),
    email: blank(formData.get("email")) ?? "",
    phone: blank(formData.get("phone")),
    message: blank(formData.get("message")),
    product_slug: blank(formData.get("product_slug")),
    locale: blank(formData.get("locale")),
    page_url: blank(formData.get("page_url")),
    website: (formData.get("website") as string) ?? "",
    started_at: blank(formData.get("started_at")),
  });

  if (!parsed.success) return { status: "invalid" };
  const v = parsed.data;

  // Silently accept obvious bots (filled honeypot or sub-2s submissions) without storing.
  if (v.started_at && Date.now() - v.started_at < 2000) return { status: "success" };

  const h = await headers();
  const { data, error } = await adminClient()
    .from("inquiries")
    .insert({
      kind: v.kind,
      name: v.name,
      company: v.company ?? null,
      email: v.email || null,
      phone: v.phone ?? null,
      message: v.message ?? null,
      product_slug: v.product_slug ?? null,
      locale: v.locale ?? null,
      page_url: v.page_url ?? null,
      user_agent: h.get("user-agent")?.slice(0, 300) ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("inquiry insert failed", error.message);
    return { status: "error" };
  }

  // Sales follows enquiries up in the office system (ERP → Sales → Enquiries).
  // Copied after the reply, so a slow or unreachable ERP never fails the form.
  // Job applications are not sales leads; they stay in /admin only.
  if (v.kind !== "career") {
    after(async () => {
      try {
        const { error: copyError } = await erp().from("sales_leads").insert({
          website_id: data.id,
          kind: v.kind,
          name: v.name,
          company: v.company ?? null,
          email: v.email || null,
          phone: v.phone ?? null,
          message: v.message ?? null,
          product_slug: v.product_slug ?? null,
          locale: v.locale ?? null,
          page_url: v.page_url ?? null,
        });
        if (copyError) console.error("enquiry copy to ERP failed", copyError.message);
      } catch (e) {
        console.error("enquiry copy to ERP failed", (e as Error).message);
      }
    });
  }
  return { status: "success" };
}
