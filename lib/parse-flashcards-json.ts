import { stripJsonCodeFences } from "@/lib/parse-quiz-json";
import type { FlashcardPair } from "@/types";

function isFlashcardPair(value: unknown): value is FlashcardPair {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.front === "string" && typeof item.back === "string";
}

export function parseFlashcardPairs(raw: string): FlashcardPair[] {
  const cleaned = stripJsonCodeFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Gemini returned invalid flashcard JSON. Try generating again."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Flashcard response must be a JSON array.");
  }

  if (parsed.length < 10 || parsed.length > 15) {
    throw new Error("Flashcards must contain 10-15 cards.");
  }

  if (!parsed.every(isFlashcardPair)) {
    throw new Error(
      "Flashcard JSON is missing required fields or has an invalid shape."
    );
  }

  return parsed.map((card) => ({
    front: card.front.trim(),
    back: card.back.trim(),
  }));
}
