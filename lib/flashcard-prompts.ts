export function buildFlashcardsSystemPrompt(extractedText: string): string {
  return `Generate 10-15 flashcards based on the following document text. Respond with ONLY a valid JSON array, no markdown code fences, no explanatory text before or after. Each object must have: front (string, term or prompt), back (string, definition or answer). Focus on key terms and concepts from the document.

Document text:
${extractedText}`;
}
