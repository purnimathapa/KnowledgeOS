import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { askGemini } from "@/lib/gemini";
import { geminiErrorStatus } from "@/lib/gemini-errors";
import { buildDocumentQaSystemPrompt } from "@/lib/qa-prompts";
import { createClient } from "@/utils/supabase/server";

type RouteContext = {
  params: { id: string };
};

type AskRequestBody = {
  question?: string;
};

export async function POST(request: Request, context: RouteContext) {
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

  let body: AskRequestBody;
  try {
    body = (await request.json()) as AskRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
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
      { error: "Document text is not ready for Q&A." },
      { status: 400 }
    );
  }

  try {
    const answer = await askGemini(
      buildDocumentQaSystemPrompt(extractedText),
      question
    );

    const { data: inserted, error: insertError } = await supabase
      .from("qa_history")
      .insert({
        document_id: documentId,
        user_id: user.id,
        question,
        answer,
      })
      .select("id, question, answer, created_at")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Failed to save Q&A exchange.");
    }

    return NextResponse.json(inserted);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to answer question.";

    return NextResponse.json(
      { error: message },
      { status: geminiErrorStatus(message) },
    );
  }
}
