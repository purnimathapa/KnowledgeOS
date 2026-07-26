import type { LucideIcon } from "lucide-react";
import { FileUp, Sparkles, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

type StudyLoopStepsProps = {
  className?: string;
  compact?: boolean;
};

const STEPS: { n: string; label: string; icon: LucideIcon }[] = [
  { n: "01", label: "Upload", icon: FileUp },
  { n: "02", label: "Extract & summarize", icon: Sparkles },
  { n: "03", label: "Quiz & flashcards", icon: Trophy },
];

export function StudyLoopSteps({ className, compact = false }: StudyLoopStepsProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none absolute left-[16%] right-[16%] top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-border via-primary/25 to-border sm:block"
        aria-hidden
      />
      <ol
        className={cn(
          "relative grid gap-2 sm:grid-cols-3",
          compact ? "gap-2" : "gap-3"
        )}
        aria-label="Study loop"
      >
        {STEPS.map((step) => (
          <li
            key={step.n}
            className={cn(
              "relative z-[1] flex items-center gap-3 rounded-[var(--radius)] border border-border/60 bg-card/80 px-3 py-2.5 shadow-sm backdrop-blur-sm",
              compact && "py-2"
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius)] border border-border/60 bg-muted/50 font-mono text-[10px] text-foreground">
              {step.n}
            </span>
            <step.icon
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="text-xs font-medium text-foreground">
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
