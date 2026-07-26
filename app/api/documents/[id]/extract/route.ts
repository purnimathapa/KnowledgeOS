import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  extractTextFromPdfBuffer,
  truncateToWordLimit,
} from "@/lib/pdf-text-extraction";
import { DOCUMENTS_BUCKET } from "@/types";
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
    .select("id, storage_path, status")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await supabase
    .from("documents")
    .update({ status: "processing" })
    .eq("id", documentId);

  try {
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(document.storage_path);

    if (downloadError || !fileBlob) {
      throw new Error(downloadError?.message ?? "Failed to download PDF");
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const rawText = await extractTextFromPdfBuffer(buffer);
    const { text: extractedText, truncated } = truncateToWordLimit(rawText);

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        extracted_text: extractedText,
        status: "ready",
      })
      .eq("id", documentId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ ok: true, truncated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Text extraction failed";

    await supabase
      .from("documents")
      .update({ status: "error" })
      .eq("id", documentId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
