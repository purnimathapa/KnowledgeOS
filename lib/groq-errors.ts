const MAX_USER_MESSAGE_LENGTH = 280;

export function formatGroqError(message: string, code?: string): string {
  const lower = message.toLowerCase();
  const normalizedCode = code?.toLowerCase() ?? "";

  if (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    normalizedCode === "rate_limit_exceeded"
  ) {
    return (
      "Groq rate limit reached. Wait a moment and try again, or set GROQ_MODEL to a smaller model."
    );
  }

  if (
    lower.includes("invalid api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid authentication")
  ) {
    return (
      "Groq API key is invalid. Create a key at console.groq.com and set GROQ_API_KEY in .env.local."
    );
  }

  if (lower.includes("groq_api_key is not configured")) {
    return "Groq is not configured. Add GROQ_API_KEY to .env.local and restart the dev server.";
  }

  if (lower.includes("model") && lower.includes("not found")) {
    return (
      "That Groq model is unavailable. Set GROQ_MODEL in .env.local (e.g. llama-3.3-70b-versatile)."
    );
  }

  if (message.length > MAX_USER_MESSAGE_LENGTH) {
    return (
      "The AI service returned an error. Check the server logs or try again in a few minutes."
    );
  }

  return message;
}

export function groqErrorStatus(message: string): number {
  const lower = message.toLowerCase();
  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("rate limit reached")
  ) {
    return 429;
  }
  if (
    lower.includes("unauthorized") ||
    lower.includes("invalid api key") ||
    lower.includes("invalid authentication")
  ) {
    return 401;
  }
  return 500;
}
