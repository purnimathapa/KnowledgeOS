"use client";

import { BookOpen, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AddSubjectDialog } from "@/components/add-subject-dialog";
import { EmptyState } from "@/components/empty-state";
import { SubjectDocumentsPanel } from "@/components/subject-documents-panel";
import { SubjectFolderTab } from "@/components/subject-folder-tab";
import { StudyLoopSteps } from "@/components/study-loop-steps";
import type { Document, Subject } from "@/types";
import { createClient } from "@/utils/supabase/client";

type DashboardWorkspaceProps = {
  subjects: Subject[];
  userId: string;
  initialSubjectId?: string | null;
};

export function DashboardWorkspace({
  subjects: initialSubjects,
  userId,
  initialSubjectId = null,
}: DashboardWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState(initialSubjects);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const selectedId = useMemo(() => {
    const fromUrl = searchParams.get("subject");
    if (fromUrl && subjects.some((s) => s.id === fromUrl)) return fromUrl;
    if (initialSubjectId && subjects.some((s) => s.id === initialSubjectId)) {
      return initialSubjectId;
    }
    return subjects[0]?.id ?? null;
  }, [searchParams, subjects, initialSubjectId]);

  const selectedSubject = subjects.find((s) => s.id === selectedId) ?? null;
  const selectedIndex = subjects.findIndex((s) => s.id === selectedId);

  const docStats = useMemo(() => {
    const ready = documents.filter(
      (d) => String(d.status).toLowerCase() === "ready"
    ).length;
    return { total: documents.length, ready };
  }, [documents]);

  const loadDocuments = useCallback(async (subjectId: string) => {
    setLoadingDocs(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });

    if (!error) {
      setDocuments((data ?? []) as Document[]);
    }
    setLoadingDocs(false);
  }, []);

  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  useEffect(() => {
    if (!selectedId) {
      setDocuments([]);
      return;
    }
    void loadDocuments(selectedId);
  }, [selectedId, loadDocuments]);

  function selectSubject(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subject", id);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  }

  function handleMutate() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Today&apos;s desk
          </p>
          <h1 className="font-display text-xl sm:text-2xl">Your study workspace</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="stat-chip">
            <span className="text-foreground">{subjects.length}</span> subjects
          </span>
          {selectedSubject ? (
            <>
              <span className="stat-chip">
                <span className="text-foreground">{docStats.total}</span> PDFs
              </span>
              <span className="stat-chip">
                <span className="text-foreground">{docStats.ready}</span> ready
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-5">
        <aside className="library-rail w-full shrink-0 p-4 lg:w-64 xl:w-72">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Folder rail
              </p>
              <h2 className="font-display text-lg">Subjects</h2>
            </div>
            <AddSubjectDialog />
          </div>

          {subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects yet"
              description="Name your first folder tab — one course, one drawer for PDFs and study tools."
              action={<AddSubjectDialog />}
              className="min-h-36 border-border/60 bg-muted/30 shadow-none"
            />
          ) : (
            <nav className="flex flex-col gap-2.5" aria-label="Subject folders">
              {subjects.map((subject, index) => (
                <SubjectFolderTab
                  key={subject.id}
                  subject={subject}
                  index={index}
                  active={subject.id === selectedId}
                  onSelect={() => selectSubject(subject.id)}
                  onMutate={handleMutate}
                />
              ))}
            </nav>
          )}
        </aside>

        <section className="workspace-panel min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
          {!selectedSubject ? (
            <EmptyState
              title="Pick a folder"
              description="Select a subject tab on the left. Each folder holds the PDFs and study loop for that topic."
              className="min-h-64 border-border/60 bg-muted/30 shadow-none"
            />
          ) : loadingDocs ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="font-mono text-xs uppercase tracking-widest">
                Opening folder…
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              <header className="space-y-5 border-b border-border/60 pb-8">
                <StudyLoopSteps compact />
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Folder{" "}
                      {selectedIndex >= 0
                        ? String(selectedIndex + 1).padStart(2, "0")
                        : "—"}
                    </p>
                    <span
                      className="subject-accent-bar"
                      style={{ backgroundColor: selectedSubject.color }}
                      aria-hidden
                    />
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl">
                    {selectedSubject.name}
                  </h2>
                  <p className="page-lead max-w-xl">
                    <span className="display-emphasis">Drop a PDF</span>, then
                    run the loop — summary, grounded Q&amp;A, quiz, and
                    flashcards without leaving this folder.
                  </p>
                </div>
              </header>
              <SubjectDocumentsPanel
                subject={selectedSubject}
                userId={userId}
                documents={documents}
                onDocumentsChange={() => void loadDocuments(selectedSubject.id)}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
