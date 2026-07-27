import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { flashcardsFromRow } from "@/lib/flashcard-models";
import { buildFlashcardsSystemPrompt } from "@/lib/flashcard-prompts";
import { askGroq } from "@/lib/groq";
import { groqErrorStatus } from "@/lib/groq-errors";
import { parseFlashcardPairs } from "@/lib/parse-flashcards-json";
import type { FlashcardPair } from "@/types";
import { createClient } from "@/utils/supabase/server";

type RouteContext = {
  params: { id: string };
};

export async function POST(_request: Request, context: RouteContext) {
  const documentId = context.params.id;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, extracted_text")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const extractedText = document.extracted_text?.trim();
  if (!extractedText) {
    return NextResponse.json(
      { error: "Document text is not ready for flashcard generation." },
      { status: 400 }
    );
  }

  try {
    const rawFlashcards = await askGroq(
      buildFlashcardsSystemPrompt(extractedText),
      "Generate the flashcard JSON array now."
    );

    let pairs: FlashcardPair[];
    try {
      pairs = parseFlashcardPairs(rawFlashcards);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to parse flashcard JSON from Gemini.";
      throw new Error(message);
    }

    const { data: existing } = await supabase
      .from("flashcards")
      .select("id")
      .eq("document_id", documentId)
      .maybeSingle();

    let savedRow: {
      id: string;
      document_id: string;
      cards: FlashcardPair[];
      created_at: string;
    };

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("flashcards")
        .update({ cards: pairs })
        .eq("id", existing.id)
        .select("id, document_id, cards, created_at")
        .single();

      if (updateError || !updated) {
        throw new Error(updateError?.message ?? "Failed to update flashcards.");
      }

      savedRow = updated as typeof savedRow;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("flashcards")
        .insert({
          document_id: documentId,
          cards: pairs,
        })
        .select("id, document_id, cards, created_at")
        .single();

      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? "Failed to save flashcards.");
      }

      savedRow = inserted as typeof savedRow;
    }

    return NextResponse.json({
      cards: flashcardsFromRow(savedRow),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards.";

    return NextResponse.json(
      { error: message },
      { status: groqErrorStatus(message) },
    );
  }
}
