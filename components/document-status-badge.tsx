import { Badge } from "@/components/ui/badge";
import type { DocumentStatus } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  error: "Error",
  failed: "Failed",
};

type DocumentStatusBadgeProps = {
  status: DocumentStatus;
  className?: string;
};

export function DocumentStatusBadge({
  status,
  className,
}: DocumentStatusBadgeProps) {
  const normalized = status.toLowerCase();
  const label = STATUS_LABELS[normalized] ?? status;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-transparent font-mono font-normal",
        (normalized === "pending" || normalized === "processing") &&
          "bg-warning/15 text-warning hover:bg-warning/15",
        normalized === "ready" &&
          "bg-success/15 text-success hover:bg-success/15",
        (normalized === "failed" || normalized === "error") &&
          "bg-destructive/15 text-destructive hover:bg-destructive/15",
        className
      )}
    >
      {label}
    </Badge>
  );
}
