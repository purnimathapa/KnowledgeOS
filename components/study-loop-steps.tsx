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
    <ol
      className={cn(
        "grid gap-2 sm:grid-cols-3",
        compact ? "gap-2" : "gap-3",
        className
      )}
      aria-label="Study loop"
    >
      {STEPS.map((step, index) => (
        <li
          key={step.n}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius)] border border-border/50 bg-muted/30 px-3 py-2.5",
            compact && "py-2"
          )}
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {step.n}
          </span>
          <step.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-xs text-foreground">{step.label}</span>
          {index < STEPS.length - 1 ? (
            <span className="sr-only">then</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
