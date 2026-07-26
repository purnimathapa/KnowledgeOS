import type { QuizQuestion } from "@/types";

export function stripJsonCodeFences(raw: string): string {
  let text = raw.trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "");
    text = text.replace(/\s*```$/i, "");
  }

  return text.trim();
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;
  if (typeof item.question !== "string") return false;
  if (typeof item.explanation !== "string") return false;
  if (typeof item.correct_index !== "number") return false;
  if (!Number.isInteger(item.correct_index)) return false;
  if (item.correct_index < 0 || item.correct_index > 3) return false;
  if (!Array.isArray(item.options) || item.options.length !== 4) return false;

  return item.options.every((option) => typeof option === "string");
}

export function parseQuizQuestions(raw: string): QuizQuestion[] {
  const cleaned = stripJsonCodeFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Gemini returned invalid quiz JSON. Try generating the quiz again."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Quiz response must be a JSON array.");
  }

  if (parsed.length < 8 || parsed.length > 10) {
    throw new Error("Quiz must contain 8-10 questions.");
  }

  if (!parsed.every(isQuizQuestion)) {
    throw new Error(
      "Quiz JSON is missing required fields or has an invalid shape."
    );
  }

  return parsed;
}
