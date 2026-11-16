import { getPortal } from "@/lib/portal/context";
import { getOrder } from "@/lib/portal/data";
import { orderPdf } from "@/lib/portal/order-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The dealer's own copy of an order. Only for orders this login may see. */
export async function GET(_request: Request, { params }: { params: Promise<{ no: string }> }) {
  const ctx = await getPortal();
  if (!ctx) return new Response("Please sign in again.", { status: 401 });
  const { no } = await params;
  const order = await getOrder(decodeURIComponent(no), ctx.customers.map((c) => c.code));
  if (!order) return new Response("Order not found.", { status: 404 });

  const pdf = await orderPdf(order, ctx.customers.find((c) => c.code === order.customerCode));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Tung-Lam-${order.orderNo}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
