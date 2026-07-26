import type { Document, Subject } from "@/types";
import { createClient } from "@/utils/supabase/client";

export type PaletteDocument = Pick<
  Document,
  "id" | "subject_id" | "file_name" | "status" | "created_at"
>;

export type CommandPaletteData = {
  subjects: Subject[];
  documents: PaletteDocument[];
  latestDocumentBySubject: Record<string, PaletteDocument>;
};

export async function fetchCommandPaletteData(): Promise<CommandPaletteData | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [subjectsResult, documentsResult] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name, color, user_id, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id, subject_id, file_name, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const subjects = (subjectsResult.data ?? []) as Subject[];
  const documents = (documentsResult.data ?? []) as PaletteDocument[];

  const latestDocumentBySubject: Record<string, PaletteDocument> = {};
  for (const doc of documents) {
    if (!latestDocumentBySubject[doc.subject_id]) {
      latestDocumentBySubject[doc.subject_id] = doc;
    }
  }

  return { subjects, documents, latestDocumentBySubject };
}

export function filterSubjects(subjects: Subject[], query: string): Subject[] {
  const q = query.trim().toLowerCase();
  if (!q) return subjects;
  return subjects.filter((s) => s.name.toLowerCase().includes(q));
}

export function findSubjectByName(
  subjects: Subject[],
  nameQuery: string
): Subject | null {
  const q = nameQuery.trim().toLowerCase();
  if (!q) return null;

  const exact = subjects.find((s) => s.name.toLowerCase() === q);
  if (exact) return exact;

  const partial = subjects.filter((s) => s.name.toLowerCase().includes(q));
  if (partial.length === 1) return partial[0]!;
  return null;
}

export function resolveAskDocumentId(
  pathname: string,
  documents: PaletteDocument[]
): string | null {
  const match = pathname.match(/\/dashboard\/documents\/([^/]+)/);
  if (match?.[1]) return match[1];

  const ready = documents.find(
    (d) => String(d.status).toLowerCase() === "ready"
  );
  if (ready) return ready.id;

  return documents[0]?.id ?? null;
}
