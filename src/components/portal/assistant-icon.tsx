import Image from "next/image";

/** The order assistant's glass sparkle (generated artwork, transparent WebP). */
export function AssistantIcon({ size = 32 }: { size?: number }) {
  return <Image src="/images/portal/assistant.webp" alt="" width={size} height={size} className="shrink-0 select-none" style={{ width: size, height: size }} aria-hidden />;
}
