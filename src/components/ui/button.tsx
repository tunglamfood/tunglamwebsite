import clsx from "clsx";

type Variant = "primary" | "brand" | "secondary" | "ghost" | "light" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base =
  "btn inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 ease-out active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap select-none";
const variants: Record<Variant, string> = {
  // Near-black: the main call to action.
  primary: "bg-ink text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.18)] hover:bg-[#2a2826]",
  // Tung Lam red, used sparingly.
  brand: "bg-brand text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(159_17_23/0.3)] hover:bg-brand-600",
  // Outline on white.
  secondary: "border border-line bg-white text-ink shadow-[var(--shadow-xs)] hover:border-ink/20 hover:bg-sand/60",
  ghost: "border border-line bg-white text-ink shadow-[var(--shadow-xs)] hover:border-ink/20 hover:bg-sand/60",
  // White button on dark backgrounds.
  light: "bg-white text-ink hover:bg-white/90",
  whatsapp: "bg-[#1fa855] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.15)] hover:bg-[#1a964b]",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}
