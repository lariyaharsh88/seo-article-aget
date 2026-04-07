import type { Keyword } from "@/lib/types";

const TYPES: Keyword["type"][] = ["primary", "secondary", "lsi", "longtail"];
const INTENTS: Keyword["intent"][] = [
  "informational",
  "commercial",
  "transactional",
];
const DIFFS: Keyword["difficulty"][] = ["low", "medium", "high"];

function isKeywordType(v: unknown): v is Keyword["type"] {
  return typeof v === "string" && (TYPES as string[]).includes(v);
}

function isKeywordIntent(v: unknown): v is Keyword["intent"] {
  return typeof v === "string" && (INTENTS as string[]).includes(v);
}

function isDifficulty(v: unknown): v is Keyword["difficulty"] {
  return typeof v === "string" && (DIFFS as string[]).includes(v);
}

export function isKeywordRecord(x: unknown): x is Keyword {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.keyword === "string" &&
    o.keyword.length > 0 &&
    isKeywordType(o.type) &&
    isKeywordIntent(o.intent) &&
    isDifficulty(o.difficulty)
  );
}

export function normalizeKeywordList(raw: unknown): Keyword[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isKeywordRecord);
}

export function fallbackKeywords(topic: string): Keyword[] {
  const base = topic.trim().slice(0, 80) || "content marketing";
  return [
    {
      keyword: base,
      type: "primary",
      intent: "informational",
      difficulty: "medium",
    },
    {
      keyword: `${base} guide`,
      type: "secondary",
      intent: "informational",
      difficulty: "medium",
    },
    {
      keyword: `${base} tips`,
      type: "longtail",
      intent: "informational",
      difficulty: "low",
    },
  ];
}
