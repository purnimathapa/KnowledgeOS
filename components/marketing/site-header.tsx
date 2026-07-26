import Link from "next/link";

import { Button } from "@/components/ui/button";

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
        <nav className="flex items-center gap-2 sm:gap-3">
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
      </div>
    </header>
  );
}
