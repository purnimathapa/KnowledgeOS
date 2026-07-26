"use client";

import { cn } from "@/lib/utils";

type StrokeCheckmarkProps = {
  className?: string;
  /** When true, runs the stroke-draw animation once */
  animate?: boolean;
  "aria-hidden"?: boolean;
};

export function StrokeCheckmark({
  className,
  animate = true,
}: StrokeCheckmarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-4 w-4 shrink-0 text-foreground", className)}
      aria-hidden
    >
      <path
        d="M5 13l4 4L19 7"
        className={cn(
          "stroke-current [stroke-width:2] [stroke-linecap:round] [stroke-linejoin:round]",
          animate &&
            "motion-safe:[stroke-dasharray:22] motion-safe:[stroke-dashoffset:22] motion-safe:animate-stroke-draw"
        )}
      />
    </svg>
  );
}
