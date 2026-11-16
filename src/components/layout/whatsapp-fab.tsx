import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

/** Floating WhatsApp button. */
export function WhatsAppFab({ label }: { label: string }) {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener"
      aria-label={label}
      title={label}
      className="wa-fab group fixed bottom-4 right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-[#1fa855] pl-3 pr-3 text-white shadow-[0_10px_30px_-10px_rgb(31_168_85/0.7),0_2px_6px_rgb(0_0_0/0.12)] ring-4 ring-white/70 transition duration-300 hover:-translate-y-0.5 hover:bg-[#1a964b] sm:bottom-6 sm:right-6 sm:h-14 sm:pl-4 sm:pr-4"
    >
      <WhatsAppIcon className="size-6 shrink-0" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-[max-width] duration-300 group-hover:max-w-40 sm:inline">{label}</span>
    </a>
  );
}
