const MAX_WORDS = 15_000;
const TRUNCATED_NOTE = "\n\n[truncated]";

export function truncateToWordLimit(text: string, maxWords = MAX_WORDS): {
  text: string;
  truncated: boolean;
} {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return { text: "", truncated: false };
  }

  const words = normalized.split(" ");
  if (words.length <= maxWords) {
    return { text: normalized, truncated: false };
  }

  return {
    text: `${words.slice(0, maxWords).join(" ")}${TRUNCATED_NOTE}`,
    truncated: true,
  };
}

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return result.text ?? "";
}
