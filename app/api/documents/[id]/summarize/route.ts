import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { askGroq } from "@/lib/groq";
import { groqErrorStatus } from "@/lib/groq-errors";
import { SUMMARY_SYSTEM_PROMPT } from "@/lib/summary-prompts";
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
    .select("id, extracted_text, status, user_id")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const extractedText = document.extracted_text?.trim();
  if (!extractedText) {
    return NextResponse.json(
      { error: "Document text is not ready for summarization." },
      { status: 400 }
    );
  }

  try {
    const summaryContent = await askGroq(
      SUMMARY_SYSTEM_PROMPT,
      `Extracted document text:\n\n${extractedText}`
    );

    const { data: existing } = await supabase
      .from("summaries")
      .select("id")
      .eq("document_id", documentId)
      .maybeSingle();

    let summaryRow: { id: string; content: string };

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("summaries")
        .update({ content: summaryContent })
        .eq("id", existing.id)
        .select("id, content")
        .single();

      if (updateError || !updated) {
        throw new Error(updateError?.message ?? "Failed to update summary.");
      }

      summaryRow = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("summaries")
        .insert({
          document_id: documentId,
          content: summaryContent,
        })
        .select("id, content")
        .single();

      if (insertError || !inserted) {
        throw new Error(insertError?.message ?? "Failed to save summary.");
      }

      summaryRow = inserted;
    }

    return NextResponse.json({
      id: summaryRow.id,
      content: summaryRow.content,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate summary.";

    return NextResponse.json(
      { error: message },
      { status: groqErrorStatus(message) },
    );
  }
}
