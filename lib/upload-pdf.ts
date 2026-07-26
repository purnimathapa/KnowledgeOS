import type { SupabaseClient } from "@supabase/supabase-js";

import { DOCUMENTS_BUCKET } from "@/types";

type UploadPdfOptions = {
  supabase: SupabaseClient;
  bucket?: string;
  path: string;
  file: File;
  onProgress?: (percent: number) => void;
};

export async function uploadPdfWithProgress({
  supabase,
  bucket = DOCUMENTS_BUCKET,
  path,
  file,
  onProgress,
}: UploadPdfOptions): Promise<{ error: Error | null }> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { error: new Error("You must be signed in to upload files.") };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { error: new Error("Supabase environment variables are missing.") };
  }

  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", supabaseKey);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve({ error: null });
        return;
      }

      let message = `Upload failed (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        message = body.message ?? body.error ?? message;
      } catch {
        // keep default message
      }
      resolve({ error: new Error(message) });
    };

    xhr.onerror = () => {
      resolve({ error: new Error("Network error while uploading the file.") });
    };

    xhr.send(file);
  });
}
