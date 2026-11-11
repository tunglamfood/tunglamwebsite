import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "light" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-[0_8px_20px_-8px_rgb(215_25_32/0.7)] hover:bg-brand-600",
  secondary: "bg-ink text-white hover:bg-ink/85",
  ghost: "border border-ink/15 bg-white/60 text-ink backdrop-blur hover:border-ink/40 hover:bg-white",
  light: "bg-white text-ink hover:bg-cream",
  whatsapp: "bg-[#1fa855] text-white hover:bg-[#178f47] shadow-[0_8px_20px_-8px_rgb(31_168_85/0.7)]",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}
