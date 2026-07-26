"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { formatGeminiError } from "@/lib/gemini-errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Document, Summary } from "@/types";

type DocumentSummarySectionProps = {
  document: Document;
  initialSummary: Summary | null;
};

export function DocumentSummarySection({
  document,
  initialSummary,
}: DocumentSummarySectionProps) {
  const [summary, setSummary] = useState<Summary | null>(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSummarize =
    document.status === "ready" && Boolean(document.extracted_text?.trim());

  async function handleGenerateSummary() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/documents/${document.id}/summarize`, {
        method: "POST",
        credentials: "include",
      });

      const body = (await response.json().catch(() => null)) as {
        content?: string;
        id?: string;
        error?: string;
      } | null;

      if (!response.ok || !body?.content) {
        const message = formatGeminiError(
          body?.error ?? "Failed to generate summary.",
        );
        setError(message);
        toast.error("Summary generation failed", { description: message });
        return;
      }

      setSummary({
        id: body.id ?? summary?.id ?? document.id,
        document_id: document.id,
        user_id: document.user_id,
        content: body.content,
        created_at: summary?.created_at ?? new Date().toISOString(),
      });
      toast.success("Summary generated");
    } catch {
      const message = "Failed to generate summary.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="section-title">Study summary</h2>
          <p className="section-lead">
            AI-generated markdown summary for exam review.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          disabled={!canSummarize || loading}
          onClick={handleGenerateSummary}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate summary"
          )}
        </Button>
      </div>

      {!canSummarize ? (
        <p className="section-lead">
          Available after text extraction finishes (status: ready).
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3 rounded-lg bg-muted/50 p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating summary…
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : null}

      {!loading && summary?.content ? (
        <article className="rounded-lg bg-muted/40 p-6 leading-relaxed text-foreground [&_h1]:mb-2 [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-medium [&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:font-medium [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
          <ReactMarkdown>{summary.content}</ReactMarkdown>
        </article>
      ) : null}

      {!loading && !summary?.content && canSummarize ? (
        <EmptyState
          icon={FileText}
          title="No summary yet"
          description="Generate a structured study summary from this document's extracted text."
          action={
            <Button type="button" size="sm" onClick={handleGenerateSummary}>
              Generate summary
            </Button>
          }
        />
      ) : null}
    </section>
  );
}
