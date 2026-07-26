import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { askGemini } from "@/lib/gemini";
import { geminiErrorStatus } from "@/lib/gemini-errors";
import { parseQuizQuestions } from "@/lib/parse-quiz-json";
import { buildQuizSystemPrompt } from "@/lib/quiz-prompts";
import type { QuizQuestion } from "@/types";
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
      { error: "Document text is not ready for quiz generation." },
      { status: 400 }
    );
  }

  try {
    const rawQuiz = await askGemini(
      buildQuizSystemPrompt(extractedText),
      "Generate the quiz JSON array now."
    );

    let questions: QuizQuestion[];
    try {
      questions = parseQuizQuestions(rawQuiz);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to parse quiz JSON from Gemini.";
      throw new Error(message);
    }

    const { data: existing } = await supabase
      .from("quizzes")
      .select("id")
      .eq("document_id", documentId)
      .maybeSingle();

    let quizRow: { id: string; questions: QuizQuestion[] };

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("quizzes")
        .update({ questions })
        .eq("id", existing.id)
        .select("id, questions")
        .single();

      if (updateError || !updated) {
        throw new Error(updateError?.message ?? "Failed to update quiz.");
      }

      quizRow = updated as { id: string; questions: QuizQuestion[] };
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("quizzes")
        .insert({
          document_id: documentId,
          user_id: user.id,
          questions,
        })
        .select("id, questions")
        .single();

      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? "Failed to save quiz.");
      }

      quizRow = inserted as { id: string; questions: QuizQuestion[] };
    }

    return NextResponse.json({
      id: quizRow.id,
      questions: quizRow.questions,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate quiz.";

    return NextResponse.json(
      { error: message },
      { status: geminiErrorStatus(message) },
    );
  }
}
