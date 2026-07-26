"use client";

import Link from "next/link";

import { CommandPaletteTrigger } from "@/components/command-palette/command-palette-trigger";
import { LogoutButton } from "@/components/logout-button";

type DashboardNavBarProps = {
  email: string;
};

export function DashboardNavBar({ email }: DashboardNavBarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/dashboard"
            className="font-display text-base font-medium tracking-tight text-foreground"
          >
            KnowledgeOS
          </Link>
          <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground lg:inline">
            Workspace
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <CommandPaletteTrigger />
          <span
            className="hidden max-w-[12rem] truncate text-sm text-muted-foreground xl:inline"
            title={email}
          >
            {email}
          </span>
          <LogoutButton />
        </div>
      </div>
      <div className="brass-rule opacity-80" aria-hidden />
    </header>
  );
}
