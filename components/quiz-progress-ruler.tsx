"use client";

import { cn } from "@/lib/utils";

type QuizProgressRulerProps = {
  total: number;
  /** Number of questions completed (answered and advanced past, or all when finished) */
  completed: number;
  className?: string;
};

export function QuizProgressRuler({
  total,
  completed,
  className,
}: QuizProgressRulerProps) {
  if (total <= 0) return null;

  const clamped = Math.min(Math.max(completed, 0), total);
  const fillPercent = (clamped / total) * 100;

  return (
    <div
      className={cn("relative h-2 w-full", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={clamped}
      aria-label={`Quiz progress: ${clamped} of ${total} questions`}
    >
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      <div
        className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-foreground/25 motion-safe:transition-[width] motion-safe:duration-300"
        style={{ width: `${fillPercent}%` }}
      />
      <div className="absolute inset-x-0 top-0 flex justify-between">
        {Array.from({ length: total }, (_, index) => {
          const tickDone = index < clamped;
          return (
            <span
              key={index}
              className={cn(
                "relative block h-2 w-px bg-border",
                tickDone && "bg-foreground/40"
              )}
              aria-hidden
            />
          );
        })}
      </div>
    </div>
  );
}
