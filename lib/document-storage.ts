export function sanitizePdfFilename(name: string): string {
  const base = name.trim().replace(/[/\\?%*:|"<>]/g, "_");
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

export function buildDocumentStoragePath(
  userId: string,
  subjectId: string,
  filename: string
): string {
  return `${userId}/${subjectId}/${sanitizePdfFilename(filename)}`;
}
