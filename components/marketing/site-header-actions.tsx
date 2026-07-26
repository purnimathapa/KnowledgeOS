"use client";

import Link from "next/link";

import { CommandPaletteTrigger } from "@/components/command-palette/command-palette-trigger";
import { Button } from "@/components/ui/button";

type SiteHeaderActionsProps = {
  variant?: "marketing" | "minimal";
};

export function SiteHeaderActions({ variant = "marketing" }: SiteHeaderActionsProps) {
  return (
    <nav className="flex items-center gap-2 sm:gap-3">
      <CommandPaletteTrigger variant="ghost" />
      {variant === "marketing" ? (
        <>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Start for free</Link>
          </Button>
        </>
      ) : (
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      )}
    </nav>
  );
}
