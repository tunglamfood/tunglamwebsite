import Image from "next/image";
import clsx from "clsx";

const CERTS = [
  { key: "halal", label: "Halal" },
  { key: "haccp", label: "HACCP" },
  { key: "gmp", label: "GMP" },
  { key: "mesti", label: "MeSTI" },
] as const;

export function CertBadges({ size = 56, className, tone = "light" }: { size?: number; className?: string; tone?: "light" | "dark" }) {
  return (
    <ul className={clsx("flex flex-wrap items-center", className)} aria-label="Certifications: Halal, HACCP, GMP, MeSTI">
      {CERTS.map((c) => (
        <li
          key={c.key}
          className={clsx("grid place-items-center rounded-full p-1.5", tone === "dark" ? "bg-white" : "bg-white shadow-[var(--shadow-card)]")}
          style={{ width: size, height: size }}
          title={c.label}
        >
          <Image src={`/certs/${c.key}.webp`} alt={`${c.label} certified`} width={size} height={size} className="h-full w-full object-contain" />
        </li>
      ))}
    </ul>
  );
}
