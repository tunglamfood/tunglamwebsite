import clsx from "clsx";
import type { ReactNode } from "react";

export const H2_CLASS = "font-display text-[1.625rem] font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:text-4xl";

export function SectionHeading({
  eyebrow,
  title,
  text,
  action,
  align = "left",
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "mb-6 flex flex-col gap-4 sm:mb-10",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={clsx("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-3 sm:mb-4">{eyebrow}</p>}
        <Tag className={H2_CLASS}>{title}</Tag>
        {text && <p className="mt-2 text-[0.975rem] text-ink-soft sm:mt-3 sm:text-lg">{text}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
