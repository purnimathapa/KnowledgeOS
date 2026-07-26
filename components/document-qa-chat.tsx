"use client";

import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGroqError } from "@/lib/groq-errors";
import type { Document, QaExchange } from "@/types";

type DocumentQaChatProps = {
  document: Document;
  initialHistory: QaExchange[];
};

export function DocumentQaChat({ document, initialHistory }: DocumentQaChatProps) {
  const [history, setHistory] = useState<QaExchange[]>(initialHistory);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canAsk =
    document.status === "ready" && Boolean(document.extracted_text?.trim());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading || !canAsk) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/documents/${document.id}/ask`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      const body = (await response.json().catch(() => null)) as
        | (QaExchange & { error?: string })
        | { error?: string }
        | null;

      if (!response.ok || !body || !("answer" in body) || !body.answer) {
        const message = formatGroqError(
          (body && "error" in body && body.error) ||
            "Failed to get an answer. Please try again.",
        );
        setError(message);
        toast.error("Could not get an answer", { description: message });
        return;
      }

      setHistory((prev) => [...prev, body as QaExchange]);
      setQuestion("");
      toast.success("Answer received");
    } catch {
      const message = "Failed to get an answer. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="section-title">Document Q&amp;A</h2>
        <p className="section-lead">
          Ask questions grounded in this document&apos;s extracted text.
        </p>
      </div>

      <div className="flex h-96 flex-col rounded-lg bg-muted/40 sm:h-[26rem]">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {history.length === 0 ? (
            <p className="section-lead max-w-sm">
              <span className="display-emphasis">Nothing asked yet.</span> Type a
              question about the reading — answers stay grounded in this PDF only.
            </p>
          ) : (
            history.map((exchange) => (
              <div key={exchange.id} className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg bg-background px-3 py-2">
                    {exchange.question}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-3 py-2 text-muted-foreground">
                    {exchange.answer}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center"
        >
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              canAsk
                ? "Ask a question about this document…"
                : "Available after text extraction is ready"
            }
            disabled={!canAsk || loading}
            aria-label="Question"
            className="w-full bg-background"
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0 self-end sm:self-auto"
            disabled={!canAsk || loading || !question.trim()}
            aria-label="Send question"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      {!canAsk ? (
        <p className="section-lead">Q&amp;A unlocks when the document status is ready.</p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
