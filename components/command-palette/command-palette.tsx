"use client";

import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  fetchCommandPaletteData,
  filterSubjects,
  findSubjectByName,
  resolveAskDocumentId,
  type CommandPaletteData,
} from "@/lib/command-palette-data";
import { formatGroqError } from "@/lib/groq-errors";
import { parsePaletteInput } from "@/lib/parse-command-palette-input";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AskResult = {
  question: string;
  answer: string;
  documentId: string;
};

type ListItem =
  | { type: "subject"; subject: Subject; hint: string }
  | { type: "action"; id: string; label: string; hint: string; disabled?: boolean };

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [data, setData] = useState<CommandPaletteData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [askLoading, setAskLoading] = useState(false);
  const [askResult, setAskResult] = useState<AskResult | null>(null);
  const askDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAskQuestionRef = useRef<string>("");

  const parsed = useMemo(() => parsePaletteInput(query), [query]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const result = await fetchCommandPaletteData();
      setData(result);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setAskResult(null);
    setHighlightIndex(0);
    void loadData();
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, loadData]);

  const subjects = useMemo(() => data?.subjects ?? [], [data]);
  const documents = useMemo(() => data?.documents ?? [], [data]);
  const latestBySubject = useMemo(
    () => data?.latestDocumentBySubject ?? {},
    [data]
  );

  const listItems: ListItem[] = useMemo(() => {
    if (!data) return [];

    if (parsed.kind === "ask") {
      const q = parsed.question;
      return [
        {
          type: "action",
          id: "ask-run",
          label: q ? `Ask: ${q}` : "Ask a question…",
          hint: "Enter to send",
          disabled: !q || askLoading,
        },
      ];
    }

    if (parsed.kind === "quiz") {
      const subject = findSubjectByName(subjects, parsed.subjectQuery);
      return [
        {
          type: "action",
          id: "quiz-run",
          label: subject
            ? `Quiz · ${subject.name}`
            : parsed.subjectQuery
              ? `Quiz · ${parsed.subjectQuery}`
              : "Quiz · pick a subject",
          hint: subject ? "Enter to open quiz" : "Type a subject name",
          disabled: !subject,
        },
      ];
    }

    if (parsed.kind === "flashcards") {
      const subject = findSubjectByName(subjects, parsed.subjectQuery);
      return [
        {
          type: "action",
          id: "flashcards-run",
          label: subject
            ? `Flashcards · ${subject.name}`
            : parsed.subjectQuery
              ? `Flashcards · ${parsed.subjectQuery}`
              : "Flashcards · pick a subject",
          hint: subject ? "Enter to open deck" : "Type a subject name",
          disabled: !subject,
        },
      ];
    }

    const filtered = filterSubjects(subjects, parsed.query);
    return filtered.slice(0, 8).map((subject) => ({
      type: "subject" as const,
      subject,
      hint: "Enter to open folder",
    }));
  }, [askLoading, data, parsed, subjects]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, listItems.length]);

  const runAsk = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || askLoading) return;

      const documentId = resolveAskDocumentId(pathname, documents);
      if (!documentId) {
        toast.error("No document found", {
          description: "Upload a PDF first, or open a document page.",
        });
        return;
      }

      setAskLoading(true);
      setAskResult(null);
      lastAskQuestionRef.current = trimmed;

      try {
        const response = await fetch(`/api/documents/${documentId}/ask`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed }),
        });

        const body = (await response.json().catch(() => null)) as
          | { answer?: string; error?: string }
          | null;

        if (!response.ok || !body?.answer) {
          toast.error("Could not get an answer", {
            description: formatGroqError(body?.error ?? "Request failed."),
          });
          return;
        }

        setAskResult({
          question: trimmed,
          answer: body.answer,
          documentId,
        });
      } catch {
        toast.error("Could not get an answer.");
      } finally {
        setAskLoading(false);
      }
    },
    [askLoading, documents, pathname]
  );

  useEffect(() => {
    if (parsed.kind !== "ask") return;
    const q = parsed.question;
    if (askDebounceRef.current) {
      clearTimeout(askDebounceRef.current);
    }
    if (q.length < 4 || q === lastAskQuestionRef.current) return;

    askDebounceRef.current = setTimeout(() => {
      void runAsk(q);
    }, 650);

    return () => {
      if (askDebounceRef.current) clearTimeout(askDebounceRef.current);
    };
  }, [parsed, runAsk]);

  function navigateToSubject(subject: Subject) {
    onOpenChange(false);
    router.push(`/dashboard?subject=${encodeURIComponent(subject.id)}`);
  }

  function navigateToStudyTool(
    subject: Subject,
    tool: "quiz" | "flashcards"
  ) {
    const doc = latestBySubject[subject.id];
    if (!doc) {
      toast.error("No PDF in this subject", {
        description: "Upload a document to that folder first.",
      });
      return;
    }

    if (doc.status !== "ready" && String(doc.status).toLowerCase() !== "ready") {
      toast.error("Document not ready", {
        description: "Wait for text extraction, then try again.",
      });
      return;
    }

    onOpenChange(false);
    router.push(`/dashboard/documents/${doc.id}?autostart=${tool}`);
  }

  function executeHighlighted() {
    const item = listItems[highlightIndex];
    if (!item || (item.type === "action" && item.disabled)) return;

    if (parsed.kind === "ask") {
      void runAsk(parsed.question);
      return;
    }

    if (parsed.kind === "quiz") {
      const subject = findSubjectByName(subjects, parsed.subjectQuery);
      if (subject) navigateToStudyTool(subject, "quiz");
      return;
    }

    if (parsed.kind === "flashcards") {
      const subject = findSubjectByName(subjects, parsed.subjectQuery);
      if (subject) navigateToStudyTool(subject, "flashcards");
      return;
    }

    if (item.type === "subject") {
      navigateToSubject(item.subject);
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) =>
        Math.min(i + 1, Math.max(listItems.length - 1, 0))
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      executeHighlighted();
    }
  }

  const recentSubjects = subjects.slice(0, 5);
  const showEmptyHints = !query.trim() && !loadingData && data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "glass-panel max-h-[min(85vh,32rem)] max-w-xl gap-0 overflow-hidden border-border p-0 shadow-2xl workspace-panel",
          "data-[state=open]:motion-safe:animate-in data-[state=closed]:motion-safe:animate-out",
          "data-[state=open]:motion-safe:fade-in-0 data-[state=closed]:motion-safe:fade-out-0",
          "data-[state=open]:motion-safe:zoom-in-[0.98] data-[state=closed]:motion-safe:zoom-out-[0.98]",
          "data-[state=open]:motion-safe:duration-200"
        )}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>

        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAskResult(null);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search subjects or type a command…"
            className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            aria-autocomplete="list"
            aria-controls="command-palette-list"
            autoComplete="off"
          />
          <kbd className="hidden shrink-0 rounded-[var(--radius)] border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            esc
          </kbd>
        </div>

        {askResult ? (
          <div className="border-b border-border bg-muted/30 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">{askResult.question}</p>
            <p className="section-lead mt-2 whitespace-pre-wrap text-foreground/90">
              {askResult.answer}
            </p>
            <Link
              href={`/dashboard/documents/${askResult.documentId}`}
              className="mt-3 inline-block font-mono text-xs text-foreground underline-offset-4 hover:underline"
              onClick={() => onOpenChange(false)}
            >
              View full chat →
            </Link>
          </div>
        ) : null}

        {askLoading ? (
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Asking Groq…
          </div>
        ) : null}

        <div
          id="command-palette-list"
          role="listbox"
          className="max-h-64 overflow-y-auto px-2 py-2"
        >
          {loadingData ? (
            <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your workspace…
            </div>
          ) : !data ? (
            <div className="space-y-2 px-2 py-6 text-sm">
              <p className="text-foreground">
                Sign in to search subjects and run commands.
              </p>
              <Link
                href="/login"
                className="font-mono text-xs underline-offset-4 hover:underline"
                onClick={() => onOpenChange(false)}
              >
                Log in →
              </Link>
            </div>
          ) : listItems.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground">
              No matches. Try a subject name or{" "}
              <span className="font-mono text-xs">ask …</span>
            </p>
          ) : (
            listItems.map((item, index) => (
              <button
                key={item.type === "subject" ? item.subject.id : item.id}
                type="button"
                role="option"
                aria-selected={index === highlightIndex}
                disabled={item.type === "action" && item.disabled}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[var(--radius)] px-3 py-2.5 text-left text-sm transition-colors",
                  index === highlightIndex
                    ? "bg-muted/80"
                    : "hover:bg-muted/50",
                  item.type === "action" && item.disabled && "opacity-50"
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => {
                  setHighlightIndex(index);
                  executeHighlighted();
                }}
              >
                <span className="truncate font-medium text-foreground">
                  {item.type === "subject" ? item.subject.name : item.label}
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {item.hint}
                </span>
              </button>
            ))
          )}
        </div>

        {showEmptyHints ? (
          <div className="border-t border-border px-4 py-3">
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              Try:{" "}
              <span className="text-foreground/80">ask what is minimax</span>,{" "}
              <span className="text-foreground/80">quiz networks</span>, or a
              subject name
            </p>
            {recentSubjects.length > 0 ? (
              <ul className="mt-3 space-y-1">
                <li className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Recent subjects
                </li>
                {recentSubjects.map((subject) => (
                  <li key={subject.id}>
                    <button
                      type="button"
                      className="font-display text-sm text-foreground hover:underline"
                      onClick={() => navigateToSubject(subject)}
                    >
                      {subject.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
