"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

type Crumb = {
  label: string;
  href?: string;
};

function displayFileName(fileName: string | null, filePath: string | null): string {
  if (fileName?.trim()) return fileName;
  if (filePath) return filePath.split("/").pop() ?? "Document";
  return "Document";
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ label: "Dashboard" }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (pathname === "/dashboard") {
        const subjectId = searchParams.get("subject");
        if (!subjectId) {
          setCrumbs([{ label: "Dashboard" }]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const supabase = createClient();
        const { data: subject } = await supabase
          .from("subjects")
          .select("name")
          .eq("id", subjectId)
          .maybeSingle();

        if (cancelled) return;

        setCrumbs([
          { label: "Dashboard", href: "/dashboard" },
          { label: subject?.name ?? "Subject" },
        ]);
        setLoading(false);
        return;
      }

      const subjectMatch = pathname.match(/^\/dashboard\/subjects\/([^/]+)/);
      const documentMatch = pathname.match(/^\/dashboard\/documents\/([^/]+)/);

      if (!subjectMatch && !documentMatch) {
        setCrumbs([{ label: "Dashboard", href: "/dashboard" }]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createClient();

      if (documentMatch) {
        const documentId = documentMatch[1];
        const { data: document } = await supabase
          .from("documents")
          .select("file_name, storage_path, subject_id")
          .eq("id", documentId)
          .maybeSingle();

        if (cancelled) return;

        if (!document) {
          setCrumbs([
            { label: "Dashboard", href: "/dashboard" },
            { label: "Document" },
          ]);
          setLoading(false);
          return;
        }

        const { data: subject } = await supabase
          .from("subjects")
          .select("name")
          .eq("id", document.subject_id)
          .maybeSingle();

        if (cancelled) return;

        setCrumbs([
          { label: "Dashboard", href: "/dashboard" },
          {
            label: subject?.name ?? "Subject",
            href: `/dashboard/subjects/${document.subject_id}`,
          },
          {
            label: displayFileName(document.file_name, document.storage_path),
          },
        ]);
        setLoading(false);
        return;
      }

      if (subjectMatch) {
        const subjectId = subjectMatch[1];
        const { data: subject } = await supabase
          .from("subjects")
          .select("name")
          .eq("id", subjectId)
          .maybeSingle();

        if (cancelled) return;

        setCrumbs([
          { label: "Dashboard", href: "/dashboard" },
          { label: subject?.name ?? "Subject" },
        ]);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);

  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {loading ? (
          <li className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            <span className="sr-only">Loading navigation</span>
          </li>
        ) : (
          crumbs.map((crumb, index) => (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="max-w-40 truncate hover:text-foreground sm:max-w-xs"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "max-w-40 truncate sm:max-w-md",
                    index === crumbs.length - 1 && "font-medium text-foreground"
                  )}
                  aria-current={index === crumbs.length - 1 ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          ))
        )}
      </ol>
    </nav>
  );
}
