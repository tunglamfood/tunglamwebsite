import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

/** Plain floating WhatsApp button — no animation. */
export function WhatsAppFab({ label }: { label: string }) {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener"
      aria-label={label}
      title={label}
      className="wa-fab fixed bottom-4 right-4 z-40 grid size-12 place-items-center rounded-full bg-[#25d366] text-white shadow-md sm:bottom-6 sm:right-6 sm:size-14"
    >
      <WhatsAppIcon className="size-6 shrink-0 sm:size-7" />
    </a>
  );
}
