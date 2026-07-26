"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { FlashcardPair } from "@/types";

type Flashcard3DProps = {
  card: FlashcardPair;
  className?: string;
};

export function Flashcard3D({ card, className }: Flashcard3DProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={cn("mx-auto w-full max-w-md [perspective:1200px]", className)}
    >
      <motion.button
        type="button"
        aria-label={flipped ? "Show term" : "Show definition"}
        onClick={() => setFlipped((value) => !value)}
        className="relative h-56 w-full cursor-pointer border-0 bg-transparent p-0 [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg border border-border bg-card p-6 text-center shadow-md [backface-visibility:hidden]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Term
            </p>
            <p className="font-semibold leading-snug">{card.front}</p>
          </div>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center rounded-lg border border-primary/20 bg-primary/5 p-6 text-center shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Definition
            </p>
            <p className="leading-relaxed">{card.back}</p>
          </div>
        </div>
      </motion.button>
      <p className="mt-4 text-center section-lead">
        Click the card to flip
      </p>
    </div>
  );
}
