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

function trimStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** Map LLM / loose JSON into a valid Keyword; preserves rows that strict parsing would drop. */
function coerceKeywordRow(o: unknown): Keyword | null {
  if (typeof o !== "object" || o === null) return null;
  const r = o as Record<string, unknown>;
  const keyword =
    trimStr(r.keyword) ??
    trimStr(r.term) ??
    trimStr(r.phrase) ??
    trimStr(r.text) ??
    trimStr(r.query) ??
    trimStr(r.name);
  if (!keyword) return null;

  const rawType = trimStr(r.type)?.toLowerCase();
  let type: Keyword["type"] = "secondary";
  if (rawType && (TYPES as string[]).includes(rawType)) {
    type = rawType as Keyword["type"];
  } else if (rawType) {
    if (/^(primary|main|head)$/i.test(rawType)) type = "primary";
    else if (/^(secondary|supporting)$/i.test(rawType)) type = "secondary";
    else if (/^(lsi|semantic)$/i.test(rawType)) type = "lsi";
    else if (/^long[-\s]?tail$/i.test(rawType)) type = "longtail";
  }

  const rawIntent = trimStr(r.intent)?.toLowerCase();
  let intent: Keyword["intent"] = "informational";
  if (rawIntent && (INTENTS as string[]).includes(rawIntent)) {
    intent = rawIntent as Keyword["intent"];
  } else if (rawIntent === "navigational" || rawIntent === "navigation") {
    intent = "informational";
  }

  const rawDiff = trimStr(r.difficulty)?.toLowerCase();
  let difficulty: Keyword["difficulty"] = "medium";
  if (rawDiff && (DIFFS as string[]).includes(rawDiff)) {
    difficulty = rawDiff as Keyword["difficulty"];
  } else if (rawDiff) {
    if (/^(easy|very\s*low)$/i.test(rawDiff)) difficulty = "low";
    else if (/^(hard|difficult|very\s*high)$/i.test(rawDiff)) difficulty = "high";
  }

  return { keyword, type, intent, difficulty };
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
  const out: Keyword[] = [];
  for (const item of raw) {
    const k = coerceKeywordRow(item);
    if (k) out.push(k);
  }
  return out;
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
