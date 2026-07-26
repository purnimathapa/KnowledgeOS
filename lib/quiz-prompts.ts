export function buildQuizSystemPrompt(extractedText: string): string {
  return `Generate 8-10 multiple choice quiz questions based on the following document text. Respond with ONLY a valid JSON array, no markdown code fences, no explanatory text before or after. Each object must have: question (string), options (array of 4 strings), correct_index (integer 0-3), explanation (string).

Document text:
${extractedText}`;
}
