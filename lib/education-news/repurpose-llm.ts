import { groqChat } from "@/lib/groq";
import { geminiText } from "@/lib/gemini";
import { openRouterChatWithKey } from "@/lib/openrouter";

/** API keys for repurposing — try in order: Gemini → OpenRouter → Groq. */
export type RepurposeLlmKeys = {
  gemini?: string;
  openrouter?: string;
  groq?: string;
};

export function hasAnyRepurposeKey(keys: RepurposeLlmKeys): boolean {
  return Boolean(keys.gemini || keys.openrouter || keys.groq);
}

export function repurposeKeysFromEnv(): RepurposeLlmKeys {
  return {
    gemini: process.env.GEMINI_API_KEY?.trim(),
    openrouter: process.env.OPENROUTER_API_KEY?.trim(),
    groq: process.env.GROQ_API_KEY?.trim(),
  };
}

/**
 * Generate repurposed markdown. On Gemini failure (or short output), falls back to
 * OpenRouter, then Groq.
 */
export async function generateRepurposeMarkdown(
  prompt: string,
  keys: RepurposeLlmKeys,
  onStep?: (message: string) => void,
): Promise<string> {
  if (!hasAnyRepurposeKey(keys)) {
    throw new Error(
      "Configure GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY for repurposing.",
    );
  }

  const geminiOpts = { temperature: 0.55, maxOutputTokens: 4096 } as const;

  if (keys.gemini) {
    try {
      onStep?.("Gemini is writing (800–1000 words)…");
      const md = (await geminiText(prompt, keys.gemini, geminiOpts)).trim();
      if (md.length >= 200) return md;
      throw new Error("Gemini returned too little text");
    } catch (e) {
      console.error("[repurpose] Gemini failed:", e);
    }
  }

  if (keys.openrouter) {
    try {
      onStep?.("OpenRouter is writing (800–1000 words)…");
      const { content } = await openRouterChatWithKey(
        [{ role: "user", content: prompt }],
        keys.openrouter,
        { temperature: 0.55, maxTokens: 4096 },
      );
      const md = content.trim();
      if (md.length >= 200) return md;
      throw new Error("OpenRouter returned too little text");
    } catch (e) {
      console.error("[repurpose] OpenRouter failed:", e);
    }
  }

  if (keys.groq) {
    onStep?.("Groq is writing (800–1000 words)…");
    const md = await groqChat(prompt, keys.groq, {
      temperature: 0.55,
      maxOutputTokens: 4096,
    });
    return md.trim();
  }

  throw new Error("All configured LLM providers failed for repurposing.");
}
