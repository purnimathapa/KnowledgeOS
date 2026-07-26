"use client";

import { Search } from "lucide-react";

import { useCommandPalette } from "@/components/command-palette/command-palette-provider";
import { cn } from "@/lib/utils";

type CommandPaletteTriggerProps = {
  className?: string;
  variant?: "default" | "ghost";
};

function shortcutLabel() {
  if (typeof navigator === "undefined") return "⌘K";
  return /Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘K" : "Ctrl+K";
}

export function CommandPaletteTrigger({
  className,
  variant = "default",
}: CommandPaletteTriggerProps) {
  const { setOpen } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius)] border border-border text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "default" && "bg-card/80 px-2.5 py-1.5",
        variant === "ghost" && "border-transparent px-2 py-1.5",
        className
      )}
      aria-label="Open command palette"
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="hidden sm:inline">Search</span>
      <kbd className="rounded-[var(--radius)] border border-border/80 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] leading-none">
        {shortcutLabel()}
      </kbd>
    </button>
  );
}
