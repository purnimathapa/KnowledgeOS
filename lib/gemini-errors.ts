const MAX_USER_MESSAGE_LENGTH = 280;

export function formatGeminiError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted")
  ) {
    const retryMatch = message.match(/retry in ([\d.]+)s/i);
    const retryHint = retryMatch
      ? ` Try again in about ${Math.ceil(Number(retryMatch[1]))} seconds.`
      : " Wait a minute and try again.";

    return (
      "Gemini API rate limit reached (free tier quota). " +
      retryHint +
      " For heavier use, enable billing in Google AI Studio or switch to a paid API key."
    );
  }

  if (
    lower.includes("api key not valid") ||
    lower.includes("invalid api key") ||
    lower.includes("api_key_invalid")
  ) {
    return (
      "Gemini API key is invalid. Create a key at Google AI Studio and set GEMINI_API_KEY in .env.local."
    );
  }

  if (lower.includes("gemini_api_key is not configured")) {
    return "Gemini is not configured. Add GEMINI_API_KEY to .env.local and restart the dev server.";
  }

  if (message.length > MAX_USER_MESSAGE_LENGTH) {
    return (
      "The AI service returned an error. Check the server logs or try again in a few minutes."
    );
  }

  return message;
}

export function geminiErrorStatus(message: string): number {
  const lower = message.toLowerCase();
  if (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("quota") ||
    lower.includes("resource_exhausted")
  ) {
    return 429;
  }
  if (lower.includes("unauthorized") || lower.includes("api key")) {
    return 401;
  }
  return 500;
}
