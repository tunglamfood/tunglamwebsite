import { requireCustomer, getPortalDict } from "@/lib/portal/context";
import { AssistantChat } from "@/components/portal/assistant-chat";
import { AssistantIcon } from "@/components/portal/assistant-icon";

export const metadata = { title: "Assistant" };
/** The model call can take a few seconds. */
export const maxDuration = 60;

export default async function PortalAssistant() {
  const [ctx, d] = await Promise.all([requireCustomer(), getPortalDict()]);
  return (
    <div className="mx-auto max-w-3xl">
      {/* Slim chat header (like a messaging app) */}
      <div className="mb-3 flex items-center gap-2.5 sm:mb-5">
        <AssistantIcon size={40} />
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold leading-tight tracking-[-0.02em] text-ink sm:text-2xl">{d.assistant.title}</h1>
          <p className="text-xs text-muted">Cili · Tung Lam</p>
        </div>
      </div>
      <AssistantChat scope={`${ctx.account.id}:${ctx.customer.code}`} currency={ctx.customer.currency} labels={d.assistant} priceTbc={d.products.priceTbc} />
    </div>
  );
}
