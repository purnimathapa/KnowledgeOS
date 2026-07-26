import { GoogleGenerativeAI } from "@google/generative-ai";

import { formatGeminiError } from "@/lib/gemini-errors";

const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

export async function askGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  });

  try {
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    if (!text.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    return text.trim();
  } catch (error) {
    const raw =
      error instanceof Error ? error.message : "Gemini request failed.";
    throw new Error(formatGeminiError(raw));
  }
}
