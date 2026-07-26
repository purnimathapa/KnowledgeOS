"use client";

import { useEffect, useRef, useState } from "react";

import type { DocumentStatus } from "@/types";

const PROCESSING = new Set(["pending", "processing"]);

export function useStatusReadyTransition(status: DocumentStatus): boolean {
  const normalized = status.toLowerCase();
  const previousRef = useRef<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const previous = previousRef.current;

    if (
      previous &&
      normalized === "ready" &&
      PROCESSING.has(previous)
    ) {
      setShowCelebration(true);
      const timeout = window.setTimeout(() => setShowCelebration(false), 2400);
      previousRef.current = normalized;
      return () => window.clearTimeout(timeout);
    }

    previousRef.current = normalized;
  }, [normalized]);

  return showCelebration;
}
