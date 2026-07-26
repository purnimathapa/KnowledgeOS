import { formatGroqError } from "@/lib/groq-errors";

const GROQ_API_BASE = "https://api.groq.com/openai/v1";
const GROQ_MODEL =
  process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

type GroqErrorBody = {
  choices?: { message?: { content?: string } }[];
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

function groqErrorMessage(body: GroqErrorBody, status: number): string {
  const msg = body.error?.message?.trim();
  if (msg) {
    return formatGroqError(msg, body.error?.code);
  }
  return formatGroqError(`Groq API error (${status})`);
}

export async function askGroq(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });
  } catch (error) {
    const raw =
      error instanceof Error ? error.message : "Groq request failed.";
    throw new Error(formatGroqError(raw));
  }

  const body = (await response.json()) as GroqErrorBody;

  if (!response.ok) {
    throw new Error(groqErrorMessage(body, response.status));
  }

  const text = body.choices?.[0]?.message?.content ?? "";

  if (!text.trim()) {
    throw new Error("Groq returned an empty response.");
  }

  return text.trim();
}
