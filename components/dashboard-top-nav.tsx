import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";

type DashboardTopNavProps = {
  email: string;
};

export function DashboardTopNav({ email }: DashboardTopNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link
          href="/dashboard"
          className="font-display text-base font-medium tracking-tight text-foreground"
        >
          KnowledgeOS
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="hidden max-w-xs truncate text-sm text-muted-foreground sm:inline"
            title={email}
          >
            {email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
