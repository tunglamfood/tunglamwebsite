import Image from "next/image";

/**
 * The order assistant is Cili, the chilli mascot (redrawn from the Cili pack artwork).
 * Large sizes show the whole mascot; small sizes show the face in a round white badge.
 */
export function AssistantIcon({ size = 32 }: { size?: number }) {
  if (size >= 56) {
    return <Image src="/images/portal/cili.webp" alt="" width={size} height={size} className="shrink-0 select-none" style={{ width: size, height: size }} aria-hidden />;
  }
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/80 bg-white" style={{ width: size, height: size }} aria-hidden>
      <Image src="/images/portal/cili-face.webp" alt="" width={size} height={size} className="select-none" style={{ width: size, height: size }} />
    </span>
  );
}
