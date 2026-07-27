import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { DocumentFlashcardsSection } from "@/components/document-flashcards-section";
import { DocumentProcessingBanner } from "@/components/document-processing-banner";
import { DocumentQaChat } from "@/components/document-qa-chat";
import { DocumentQuizSection } from "@/components/document-quiz-section";
import { DocumentStatusBadge } from "@/components/document-status-badge";
import { DocumentSummarySection } from "@/components/document-summary-section";
import { StudyLoopSteps } from "@/components/study-loop-steps";
import { flashcardsFromRow } from "@/lib/flashcard-models";
import type {
  Document,
  Flashcard,
  QaExchange,
  Quiz,
  Subject,
  Summary,
} from "@/types";
import { createClient } from "@/utils/supabase/server";

type DocumentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId =
    typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (!userId) {
    redirect("/login");
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (documentError || !document) {
    notFound();
  }

  const documentRow = document as Document;

  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", documentRow.subject_id)
    .maybeSingle();

  const subjectRow = subject as Subject | null;

  const { data: summary } = await supabase
    .from("summaries")
    .select("*")
    .eq("document_id", id)
    .maybeSingle();

  const { data: qaHistory, error: qaError } = await supabase
    .from("qa_history")
    .select("*")
    .eq("document_id", id)
    .order("created_at", { ascending: true });

  if (qaError) {
    console.error("Failed to load Q&A history:", qaError.message);
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("document_id", id)
    .maybeSingle();

  if (quizError) {
    console.error("Failed to load quiz:", quizError.message);
  }

  const { data: flashcardsRow, error: flashcardsError } = await supabase
    .from("flashcards")
    .select("id, document_id, cards, created_at")
    .eq("document_id", id)
    .maybeSingle();

  if (flashcardsError) {
    console.error("Failed to load flashcards:", flashcardsError.message);
  }

  const initialFlashcards: Flashcard[] = flashcardsRow
    ? flashcardsFromRow(flashcardsRow)
    : [];

  const isReady =
    documentRow.status === "ready" &&
    Boolean(documentRow.extracted_text?.trim());

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="glass-panel space-y-4 p-6 sm:p-8">
        <StudyLoopSteps compact />
        <div className="flex flex-wrap items-start justify-between gap-4 pt-2">
          <div className="min-w-0 space-y-2">
            <h1 className="font-display truncate text-2xl sm:text-3xl">
              {documentRow.file_name ??
                documentRow.storage_path.split("/").pop()}
            </h1>
            {subjectRow ? (
              <p className="page-lead">{subjectRow.name}</p>
            ) : null}
          </div>
          <DocumentStatusBadge status={documentRow.status} />
        </div>
      </header>

      <DocumentProcessingBanner
        documentId={documentRow.id}
        status={documentRow.status}
      />

      <div
        className={
          isReady ? "flex flex-col gap-8" : "flex flex-col gap-8 opacity-90"
        }
      >
        <div className="glass-panel p-6 sm:p-8">
          <DocumentSummarySection
            document={documentRow}
            initialSummary={(summary as Summary | null) ?? null}
          />
        </div>

        <div className="glass-panel p-6 sm:p-8">
          <Suspense fallback={null}>
            <DocumentQuizSection
              document={documentRow}
              initialQuiz={(quiz as Quiz | null) ?? null}
            />
          </Suspense>
        </div>

        <div className="glass-panel p-6 sm:p-8">
          <Suspense fallback={null}>
            <DocumentFlashcardsSection
              document={documentRow}
              initialCards={initialFlashcards}
            />
          </Suspense>
        </div>

        <div className="glass-panel p-6 sm:p-8">
          <DocumentQaChat
            document={documentRow}
            initialHistory={(qaHistory ?? []) as QaExchange[]}
          />
        </div>
      </div>
    </div>
  );
}
