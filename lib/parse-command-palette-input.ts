export type ParsedPaletteInput =
  | { kind: "ask"; question: string }
  | { kind: "quiz"; subjectQuery: string }
  | { kind: "flashcards"; subjectQuery: string }
  | { kind: "subject"; query: string };

export function parsePaletteInput(raw: string): ParsedPaletteInput {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith("ask ")) {
    return { kind: "ask", question: trimmed.slice(4).trim() };
  }
  if (lower.startsWith("quiz ")) {
    return { kind: "quiz", subjectQuery: trimmed.slice(5).trim() };
  }
  if (lower.startsWith("flashcards ")) {
    return { kind: "flashcards", subjectQuery: trimmed.slice(11).trim() };
  }

  return { kind: "subject", query: trimmed };
}
