import Link from "next/link";

import { SiteHeaderActions } from "@/components/marketing/site-header-actions";

type SiteHeaderProps = {
  variant?: "marketing" | "minimal";
};

export function SiteHeader({ variant = "marketing" }: SiteHeaderProps) {
  return (
    <header className="relative z-10 border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-base font-medium tracking-tight text-foreground"
        >
          KnowledgeOS
        </Link>
        <SiteHeaderActions variant={variant} />
      </div>
    </header>
  );
}
