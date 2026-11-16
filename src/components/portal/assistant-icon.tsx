import Image from "next/image";

/** The order assistant is Cili, the chilli mascot (redrawn from the Cili pack artwork). Always the full figure. */
export function AssistantIcon({ size = 40 }: { size?: number }) {
  return <Image src="/images/portal/cili.webp" alt="" width={size} height={size} className="shrink-0 select-none object-contain" style={{ width: size, height: size }} aria-hidden />;
}
