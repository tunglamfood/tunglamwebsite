import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

export function WhatsAppFab({ label }: { label: string }) {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener"
      aria-label={label}
      className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#1fa855] p-3.5 text-white shadow-[0_12px_30px_-10px_rgb(31_168_85/0.8)] transition hover:bg-[#178f47] sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="size-6" />
      <span className="hidden max-w-0 overflow-hidden text-sm font-semibold transition-all duration-300 group-hover:max-w-40 group-hover:pr-1 sm:inline">
        {label}
      </span>
    </a>
  );
}
