import { geminiJSON } from "@/lib/gemini";
import type { BacklinkOpportunity } from "@/lib/off-page-seo/types";

function ruleBased(row: BacklinkOpportunity): BacklinkOpportunity {
  let score = 32;
  if (row.contact_email) score += 24;
  score += Math.round(row.estimated_da / 4.5);
  score -= row.spam_score * 3;
  if (/guest|write for us/i.test(row.type)) score += 8;
  score = Math.max(5, Math.min(98, Math.round(score)));

  let category = "Niche editorial";
  if (row.spam_score >= 6) category = "Ignore (risky/spam)";
  else if (/directory/i.test(row.type)) category = "Directory / easy win";
  else if (row.estimated_da >= 48 && row.contact_email) {
    category = "High Value Guest Post";
  } else if (row.estimated_da < 22) category = "Low priority";

  const action = row.contact_email
    ? "Personalized outreach; reference their guidelines and propose 1–2 titles."
    : "Locate editor contact (About/LinkedIn); avoid bulk templates.";

  return { ...row, priority_score: score, category, action };
}

interface GeminiPriItem {
  domain?: string;
  priority_score?: number;
  category?: string;
  action?: string;
}

export async function applyGeminiPrioritization(
  rows: BacklinkOpportunity[],
  niche: string,
  apiKey: string,
): Promise<BacklinkOpportunity[]> {
  const chunkSize = 22;
  const out: BacklinkOpportunity[] = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const payload = chunk.map((r) => ({
      domain: r.domain,
      estimated_da: r.estimated_da,
      traffic_estimate: r.traffic_estimate,
      spam_score: r.spam_score,
      type: r.type,
      has_email: Boolean(r.contact_email),
      snippet: (r.notes ? `${r.notes} ` : "") + (r.type || ""),
    }));

    const prompt = `You are an off-page SEO lead prioritizer for ${niche} outreach.

For EACH object in the input array (same order), output one result with:
- domain (exact match)
- priority_score: integer 0-100 (higher = better prospect)
- category: one of: "High Value Guest Post", "Directory / easy win", "Niche editorial", "Low priority", "Ignore (risky/spam)"
- action: one short imperative sentence for the outreach rep

Penalize high spam_score and reward realistic DA + verified email presence.

Input JSON:
${JSON.stringify({ items: payload })}

Return JSON only:
{"items":[{"domain":"string","priority_score":number,"category":"string","action":"string"}]}`;

    try {
      const parsed = await geminiJSON<{ items: GeminiPriItem[] }>(prompt, apiKey, {
        temperature: 0.25,
        maxOutputTokens: 4096,
      });
      const byDomain = new Map(
        (parsed.items ?? []).map((x) => [x.domain?.toLowerCase(), x]),
      );
      for (const r of chunk) {
        const g = byDomain.get(r.domain.toLowerCase());
        if (
          g &&
          typeof g.priority_score === "number" &&
          g.category &&
          g.action
        ) {
          out.push({
            ...r,
            priority_score: Math.max(0, Math.min(100, Math.round(g.priority_score))),
            category: g.category,
            action: g.action,
          });
        } else {
          out.push(ruleBased(r));
        }
      }
    } catch {
      for (const r of chunk) out.push(ruleBased(r));
    }
  }

  return out;
}

export function applyRulePrioritization(rows: BacklinkOpportunity[]): BacklinkOpportunity[] {
  return rows.map((r) => ruleBased(r));
}
