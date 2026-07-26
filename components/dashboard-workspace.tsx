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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      <aside className="glass-panel w-full shrink-0 p-4 lg:w-60 xl:w-72">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Library
            </p>
            <h2 className="font-display text-lg">Subjects</h2>
          </div>
          <AddSubjectDialog />
        </div>

        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects yet"
            description="Add a folder tab to start your first study universe."
            action={<AddSubjectDialog />}
            className="min-h-36 bg-transparent"
          />
        ) : (
          <nav className="flex flex-col gap-2" aria-label="Subject folders">
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

      <section className="glass-panel min-w-0 flex-1 p-6 sm:p-8">
        {!selectedSubject ? (
          <EmptyState
            title="Open a subject folder"
            description="Pick a tab on the left — your PDFs, summaries, and practice tools live in one workspace."
            className="min-h-64 bg-transparent"
          />
        ) : loadingDocs ? (
          <div className="flex min-h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading workspace…
          </div>
        ) : (
          <div className="space-y-8">
            <header className="space-y-4 border-b border-border/60 pb-8">
              <StudyLoopSteps compact />
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {selectedIndex >= 0
                    ? String(selectedIndex + 1).padStart(2, "0")
                    : "—"}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl">
                  {selectedSubject.name}
                </h1>
                <p className="page-lead max-w-xl">
                  Your study universe for this topic — upload PDFs, then move
                  through summary, Q&amp;A, quiz, and flashcards without leaving
                  the loop.
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
  );
}
