"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StrokeCheckmark } from "@/components/motion/stroke-checkmark";
import { Button } from "@/components/ui/button";
import { useStatusReadyTransition } from "@/lib/use-status-ready-transition";
import type { DocumentStatus } from "@/types";

type DocumentProcessingBannerProps = {
  documentId: string;
  status: DocumentStatus;
};

const POLL_STATUSES = new Set(["pending", "processing"]);

export function DocumentProcessingBanner({
  documentId,
  status,
}: DocumentProcessingBannerProps) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const normalized = status.toLowerCase();
  const justReady = useStatusReadyTransition(status);

  useEffect(() => {
    if (!POLL_STATUSES.has(normalized)) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [normalized, router]);

  async function handleRetryExtraction() {
    setRetrying(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/extract`, {
        method: "POST",
        credentials: "include",
      });

      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        const message = body?.error ?? "Text extraction failed.";
        toast.error("Extraction failed", { description: message });
        router.refresh();
        return;
      }

      toast.success("Text extracted — study tools are ready");
      router.refresh();
    } catch {
      toast.error("Text extraction failed.");
    } finally {
      setRetrying(false);
    }
  }

  if (justReady && normalized === "ready") {
    return (
      <div
        className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-4 text-sm"
        role="status"
      >
        <StrokeCheckmark className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            <span className="display-emphasis">Ready to study</span> — text
            extraction finished.
          </p>
          <p className="section-lead">
            Generate a summary, quiz, or flashcards whenever you like.
          </p>
        </div>
      </div>
    );
  }

  if (POLL_STATUSES.has(normalized)) {
    return (
      <div
        className="flex items-start gap-3 rounded-lg bg-warning/10 px-4 py-4 text-sm"
        role="status"
      >
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-warning" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            Extracting text from your PDF…
          </p>
          <p className="section-lead">
            Summary, quiz, flashcards, and Q&amp;A unlock when extraction
            finishes. This page refreshes automatically.
          </p>
        </div>
      </div>
    );
  }

  if (normalized === "error" || normalized === "failed") {
    return (
      <div
        className="flex flex-col gap-4 rounded-lg bg-destructive/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <div className="flex items-start gap-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Text extraction failed</p>
            <p className="section-lead">
              Retry extraction or upload the PDF again from the subject page.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={retrying}
          onClick={handleRetryExtraction}
        >
          {retrying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retrying…
            </>
          ) : (
            "Retry extraction"
          )}
        </Button>
      </div>
    );
  }

  return null;
}
