import type { Flashcard, FlashcardPair } from "@/types";

type FlashcardsRow = {
  id: string;
  document_id: string;
  cards: FlashcardPair[] | null;
  created_at: string;
};

export function flashcardsFromRow(row: FlashcardsRow): Flashcard[] {
  const pairs = Array.isArray(row.cards) ? row.cards : [];
  return pairs.map((pair, index) => ({
    front: pair.front,
    back: pair.back,
    id: `${row.id}-${index}`,
    document_id: row.document_id,
    created_at: row.created_at,
  }));
}
