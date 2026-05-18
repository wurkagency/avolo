// AI provider failover — Groq → Gemini → Nvidia.
// Sequential only. Never parallel. Do not change this order.

import type { AiRankingResponse } from "@/types/search";

// ─── Provider implementations ──────────────────────────────────────────────

async function callGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4096,
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body}`);
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");
  return content;
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Gemini returned empty content");
  return content;
}

async function callNvidia(prompt: string): Promise<string> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("NVIDIA_API_KEY not configured");

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Nvidia ${res.status}: ${body}`);
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Nvidia returned empty content");
  return content;
}

// ─── Text variants (no JSON mode) — for prose generation ──────────────────

async function callGroqText(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body}`);
  }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");
  return content;
}

async function callGeminiText(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Gemini returned empty content");
  return content;
}

// ─── Sequential failover ───────────────────────────────────────────────────

export async function callAI(prompt: string): Promise<string> {
  const providers: Array<() => Promise<string>> = [
    () => callGroq(prompt),
    () => callGemini(prompt),
    () => callNvidia(prompt),
  ];

  for (const provider of providers) {
    try {
      return await provider();
    } catch (err) {
      console.error("[AI failover]", err instanceof Error ? err.message : err);
    }
  }

  throw new Error("All AI providers failed");
}

// Like callAI but also returns which providers failed before success (or all if all failed).
export async function callAIDetailed(
  prompt: string,
): Promise<{ text: string; failedProviders: string[] }> {
  const PROVIDERS: Array<{ name: string; fn: () => Promise<string> }> = [
    { name: "Groq AI",   fn: () => callGroq(prompt)   },
    { name: "Gemini AI", fn: () => callGemini(prompt)  },
    { name: "NVIDIA AI", fn: () => callNvidia(prompt)  },
  ];

  const failedProviders: string[] = [];
  for (const { name, fn } of PROVIDERS) {
    try {
      const text = await fn();
      return { text, failedProviders };
    } catch (err) {
      console.error(`[AI failover] ${name}:`, err instanceof Error ? err.message : err);
      failedProviders.push(name);
    }
  }

  throw Object.assign(new Error("All AI providers failed"), { failedProviders });
}

export async function callAIText(prompt: string): Promise<string> {
  const providers: Array<() => Promise<string>> = [
    () => callGroqText(prompt),
    () => callGeminiText(prompt),
    () => callNvidia(prompt),
  ];

  for (const provider of providers) {
    try {
      return await provider();
    } catch (err) {
      console.error("[AI text failover]", err instanceof Error ? err.message : err);
    }
  }

  throw new Error("All AI providers failed");
}

// ─── Ranking helpers ───────────────────────────────────────────────────────

function parseRankingResponse(raw: string): AiRankingResponse {
  const parsed = JSON.parse(raw) as unknown;
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "ranked" in parsed &&
    Array.isArray((parsed as { ranked: unknown }).ranked)
  ) {
    return parsed as AiRankingResponse;
  }
  throw new Error("AI response missing 'ranked' array");
}

export async function rankWithAI(prompt: string): Promise<AiRankingResponse> {
  try {
    const raw = await callAI(prompt);
    return parseRankingResponse(raw);
  } catch (err) {
    console.error("[AI ranking parse]", err instanceof Error ? err.message : err);
    return { ranked: [] };
  }
}

/** Like rankWithAI but also returns which AI providers failed. Non-throwing. */
export async function rankWithAIDetailed(
  prompt: string,
): Promise<{ result: AiRankingResponse; failedProviders: string[] }> {
  try {
    const { text, failedProviders } = await callAIDetailed(prompt);
    const result = parseRankingResponse(text);
    return { result, failedProviders };
  } catch (err) {
    const failedProviders: string[] =
      err instanceof Error && "failedProviders" in err
        ? (err as unknown as { failedProviders: string[] }).failedProviders
        : [];
    console.error("[AI ranking]", err instanceof Error ? err.message : err);
    return { result: { ranked: [] }, failedProviders };
  }
}
