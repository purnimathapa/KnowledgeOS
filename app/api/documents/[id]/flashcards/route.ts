import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildFlashcardsSystemPrompt } from "@/lib/flashcard-prompts";
import { askGemini } from "@/lib/gemini";
import { geminiErrorStatus } from "@/lib/gemini-errors";
import { parseFlashcardPairs } from "@/lib/parse-flashcards-json";
import type { Flashcard, FlashcardPair } from "@/types";
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
    const rawFlashcards = await askGemini(
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

    const { error: deleteError } = await supabase
      .from("flashcards")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const rows = pairs.map((pair, index) => ({
      document_id: documentId,
      user_id: user.id,
      front: pair.front,
      back: pair.back,
      sort_order: index,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("flashcards")
      .insert(rows)
      .select("*");

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Failed to save flashcards.");
    }

    const cards = [...inserted].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );

    return NextResponse.json({
      cards: cards as Flashcard[],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate flashcards.";

    return NextResponse.json(
      { error: message },
      { status: geminiErrorStatus(message) },
    );
  }
}
