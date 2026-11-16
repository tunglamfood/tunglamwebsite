import { Children, type ReactNode } from "react";
import clsx from "clsx";

/**
 * Phones: a horizontal, swipeable row (cards peek in from the right).
 * Tablet and up: a normal grid.
 */
export function Rail({
  children,
  grid = "sm:grid-cols-2 lg:grid-cols-3",
  itemWidth = "w-[78%]",
  className,
}: {
  children: ReactNode;
  grid?: string;
  itemWidth?: string;
  className?: string;
}) {
  return (
    <ul
      className={clsx(
        "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "sm:mx-0 sm:grid sm:snap-none sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0",
        grid,
        className,
      )}
    >
      {Children.toArray(children).map((child, i) => (
        <li key={i} className={clsx("shrink-0 snap-start sm:w-auto", itemWidth)}>
          {child}
        </li>
      ))}
    </ul>
  );
}
