import { requireCustomer, getPortalDict } from "@/lib/portal/context";
import { AssistantChat } from "@/components/portal/assistant-chat";

export const metadata = { title: "Assistant" };
/** The model call can take a few seconds. */
export const maxDuration = 60;

export default async function PortalAssistant() {
  const [ctx, d] = await Promise.all([requireCustomer(), getPortalDict()]);
  return (
    <div className="mx-auto max-w-3xl">
      <AssistantChat scope={`${ctx.account.id}:${ctx.customer.code}`} currency={ctx.customer.currency} labels={d.assistant} priceTbc={d.products.priceTbc} />
    </div>
  );
}
