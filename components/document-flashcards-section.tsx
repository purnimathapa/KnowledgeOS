"use client";

import { Loader2, Shuffle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Flashcard3D } from "@/components/flashcard-3d";
import { ContentReveal } from "@/components/motion/content-reveal";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGroqError } from "@/lib/groq-errors";
import { useAutostartFromQuery } from "@/lib/use-autostart-from-query";
import type { Document, Flashcard, FlashcardPair } from "@/types";

type DocumentFlashcardsSectionProps = {
  document: Document;
  initialCards: Flashcard[];
};

function shuffleCards<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toPairs(cards: Flashcard[]): FlashcardPair[] {
  return cards.map((card) => ({ front: card.front, back: card.back }));
}

export function DocumentFlashcardsSection({
  document,
  initialCards,
}: DocumentFlashcardsSectionProps) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [deck, setDeck] = useState<FlashcardPair[]>(() => toPairs(initialCards));
  const [index, setIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckKey, setDeckKey] = useState(0);

  const canGenerate =
    document.status === "ready" && Boolean(document.extracted_text?.trim());

  const currentCard = deck[index];
  const total = deck.length;

  useEffect(() => {
    setDeck(toPairs(cards));
    setIndex(0);
    setDeckKey((key) => key + 1);
  }, [cards]);

  const progressLabel = useMemo(() => {
    if (!total) return "0 / 0";
    return `${index + 1} / ${total}`;
  }, [index, total]);

  async function handleGenerate() {
    setError(null);
    setGenerating(true);

    try {
      const response = await fetch(
        `/api/documents/${document.id}/flashcards`,
        { method: "POST", credentials: "include" }
      );

      const body = (await response.json().catch(() => null)) as {
        cards?: Flashcard[];
        error?: string;
      } | null;

      if (!response.ok || !body?.cards?.length) {
        setError(formatGroqError(body?.error ?? "Failed to generate flashcards."));
        toast.error("Flashcard generation failed", {
          description: formatGroqError(
            body?.error ?? "Failed to generate flashcards.",
          ),
        });
        return;
      }

      setCards(body.cards);
      toast.success("Flashcards generated");
    } catch {
      const message = "Failed to generate flashcards.";
      setError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  function handlePrevious() {
    setIndex((current) => (current > 0 ? current - 1 : total - 1));
    setDeckKey((key) => key + 1);
  }

  function handleNext() {
    setIndex((current) => (current < total - 1 ? current + 1 : 0));
    setDeckKey((key) => key + 1);
  }

  function handleShuffle() {
    setDeck((current) => shuffleCards(current));
    setIndex(0);
    setDeckKey((key) => key + 1);
  }

  useAutostartFromQuery("flashcards", canGenerate, () => {
    if (cards.length > 0) return;
    void handleGenerate();
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="section-title">Flashcards</h2>
          <p className="section-lead">
            Study terms with 3D flip cards.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          disabled={!canGenerate || generating}
          onClick={handleGenerate}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate flashcards"
          )}
        </Button>
      </div>

      {!canGenerate ? (
        <p className="section-lead">
          Available after text extraction finishes (status: ready).
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {generating ? (
        <div className="space-y-4 rounded-lg bg-muted/50 p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating flashcards…
          </div>
          <Skeleton className="mx-auto h-56 max-w-md rounded-lg" />
        </div>
      ) : null}

      {!generating && total > 0 && currentCard ? (
        <ContentReveal revealKey={`deck-${cards[0]?.id ?? total}`}>
        <div className="space-y-4">
          <Flashcard3D key={`${deckKey}-${index}`} card={currentCard} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={handlePrevious}>
                Previous
              </Button>
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleNext}>
                Next
              </Button>
              <Button type="button" variant="secondary" size="sm" className="w-full sm:w-auto" onClick={handleShuffle}>
                <Shuffle className="mr-2 h-4 w-4" />
                Shuffle
              </Button>
            </div>
          </div>
        </div>
        </ContentReveal>
      ) : null}

      {!generating && total === 0 ? (
        <EmptyState
          title="No deck yet"
          description="When the PDF is ready, generate 10–15 term cards and flip through them like a real stack."
        />
      ) : null}
    </section>
  );
}
