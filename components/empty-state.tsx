import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-44 flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius)] bg-muted/60">
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
      ) : null}
      <h3 className="font-display text-lg">{title}</h3>
      <p className="section-lead mt-2 max-w-sm">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
