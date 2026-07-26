"use client";

import { cn } from "@/lib/utils";

type ContentRevealProps = {
  children: React.ReactNode;
  /** Change when new content should replay the reveal */
  revealKey: string | number;
  className?: string;
};

export function ContentReveal({
  children,
  revealKey,
  className,
}: ContentRevealProps) {
  return (
    <div
      key={revealKey}
      className={cn(
        "motion-safe:animate-content-reveal [transform-origin:left_center]",
        className
      )}
    >
      {children}
    </div>
  );
}
