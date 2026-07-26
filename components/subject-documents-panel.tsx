"use client";

import { FileText, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DocumentStatusBadge } from "@/components/document-status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { buildDocumentStoragePath } from "@/lib/document-storage";
import { cn } from "@/lib/utils";
import { uploadPdfWithProgress } from "@/lib/upload-pdf";
import type { Document, Subject } from "@/types";
import { createClient } from "@/utils/supabase/client";

type PdfUploadZoneProps = {
  subject: Subject;
  userId: string;
  onUploadComplete?: () => void;
};

export function PdfUploadZone({ subject, userId, onUploadComplete }: PdfUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        const message = "Only PDF files are allowed.";
        setError(message);
        toast.error(message);
        return;
      }

      setError(null);
      setIsExtracting(false);
      setUploadingName(file.name);
      setUploadProgress(0);

      try {
        const supabase = createClient();
        const storagePath = buildDocumentStoragePath(
          userId,
          subject.id,
          file.name
        );

        const { error: uploadError } = await uploadPdfWithProgress({
          supabase,
          path: storagePath,
          file,
          onProgress: setUploadProgress,
        });

        if (uploadError) {
          setError(uploadError.message);
          toast.error("Upload failed", { description: uploadError.message });
          return;
        }

        const { data: inserted, error: insertError } = await supabase
          .from("documents")
          .insert({
            subject_id: subject.id,
            user_id: userId,
            file_name: file.name,
            storage_path: storagePath,
            status: "pending",
          })
          .select("id")
          .single();

        if (insertError || !inserted) {
          await supabase.storage.from("documents").remove([storagePath]);
          const message =
            insertError?.message ?? "Failed to save document record.";
          setError(message);
          toast.error("Could not save document", { description: message });
          return;
        }

        setUploadProgress(100);
        setIsExtracting(true);

        const extractResponse = await fetch(
          `/api/documents/${inserted.id}/extract`,
          { method: "POST", credentials: "include" }
        );

        if (!extractResponse.ok) {
          const body = (await extractResponse.json().catch(() => null)) as {
            error?: string;
          } | null;
          const message =
            body?.error ??
            "Upload succeeded but text extraction failed. Open the document to retry.";
          setError(message);
          toast.error("Text extraction failed", { description: message });
        } else {
          toast.success("PDF uploaded and text extracted");
        }

        onUploadComplete?.();
      } catch {
        const message = "Upload failed unexpectedly. Please try again.";
        setError(message);
        toast.error(message);
      } finally {
        setUploadProgress(null);
        setUploadingName(null);
        setIsExtracting(false);
      }
    },
    [onUploadComplete, subject.id, userId]
  );

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "upload-dropzone",
          dragActive && "upload-dropzone-active"
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] border border-border/60 bg-card/80">
          <Upload className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Drop a PDF here</p>
          <p className="section-lead">
            or choose a file — <span className="font-mono text-xs">.pdf</span> only
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            Browse PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={uploadProgress !== null || isExtracting}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </Button>
      </div>

      {uploadProgress !== null ? (
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">
              Uploading {uploadingName}
            </span>
            <span className="text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      ) : null}

      {isExtracting ? (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Extracting text from {uploadingName}…
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SubjectDocumentsPanelProps = {
  subject: Subject;
  userId: string;
  documents: Document[];
  onDocumentsChange?: () => void;
};

export function SubjectDocumentsPanel({
  subject,
  userId,
  documents,
  onDocumentsChange,
}: SubjectDocumentsPanelProps) {
  const router = useRouter();

  const refreshDocuments = useCallback(() => {
    router.refresh();
    onDocumentsChange?.();
  }, [router, onDocumentsChange]);

  useEffect(() => {
    const needsPoll = documents.some((doc) => {
      const status = doc.status.toLowerCase();
      return status === "pending" || status === "processing";
    });
    if (!needsPoll) return;

    const interval = window.setInterval(() => {
      refreshDocuments();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [documents, refreshDocuments]);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className="space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Step 01
          </p>
          <h2 className="section-title">Upload PDF</h2>
        </div>
        <PdfUploadZone
          subject={subject}
          userId={userId}
          onUploadComplete={refreshDocuments}
        />
      </section>

      <section className="space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            In this folder
          </p>
          <h2 className="section-title">Documents</h2>
        </div>
        {documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="This folder's empty"
            description="Upload a PDF to start building your notes, quizzes, and flashcards for this subject."
          />
        ) : (
          <ul className="space-y-3">
            {documents.map((doc) => {
              const isReady = doc.status === "ready";
              return (
                <li key={doc.id} className="doc-card">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] border border-border/60 bg-muted/40">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {doc.file_name ?? doc.storage_path.split("/").pop()}
                      </p>
                      <p className="section-lead">
                        {isReady
                          ? "Ready — open study tools"
                          : "Processing — check status inside"}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
                    <DocumentStatusBadge status={doc.status} />
                    <Button
                      variant={isReady ? "default" : "outline"}
                      size="sm"
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <Link href={`/dashboard/documents/${doc.id}`}>
                        {isReady ? "Study" : "View"}
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
