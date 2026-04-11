import { google } from "googleapis";

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
}

const WEBMASTERS_READONLY = "https://www.googleapis.com/auth/webmasters.readonly";

/** True when GSC_SITE_URL is set and either service account JSON or full OAuth is set. */
export function searchConsoleEnvConfigured(): boolean {
  const site = Boolean(process.env.GSC_SITE_URL?.trim());
  const serviceAccount = Boolean(process.env.GSC_SERVICE_ACCOUNT_JSON?.trim());
  const oauth =
    Boolean(process.env.GSC_CLIENT_ID?.trim()) &&
    Boolean(process.env.GSC_CLIENT_SECRET?.trim()) &&
    Boolean(process.env.GSC_REFRESH_TOKEN?.trim());
  return site && (serviceAccount || oauth);
}

function parseServiceAccountJson(): { client_email: string; private_key: string } {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error("GSC_SERVICE_ACCOUNT_JSON is not set.");
  }
  try {
    const creds = JSON.parse(raw) as Record<string, unknown>;
    const client_email = creds.client_email;
    const private_key = creds.private_key;
    if (typeof client_email !== "string" || typeof private_key !== "string") {
      throw new Error("Invalid service account JSON (need client_email, private_key).");
    }
    return {
      client_email,
      private_key: private_key.replace(/\\n/g, "\n"),
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("GSC_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }
    throw e;
  }
}

async function getAuthenticatedWebmasters() {
  const siteUrl = process.env.GSC_SITE_URL?.trim();
  if (!siteUrl) {
    throw new Error(
      "GSC_SITE_URL is required (exact Search Console property URL).",
    );
  }

  if (process.env.GSC_SERVICE_ACCOUNT_JSON?.trim()) {
    const { client_email, private_key } = parseServiceAccountJson();
    const auth = new google.auth.JWT({
      email: client_email,
      key: private_key,
      scopes: [WEBMASTERS_READONLY],
    });
    const webmasters = google.webmasters({ version: "v3", auth });
    return { webmasters, siteUrl };
  }

  const clientId = process.env.GSC_CLIENT_ID?.trim();
  const clientSecret = process.env.GSC_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GSC_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Configure Search Console: set GSC_SITE_URL and either GSC_SERVICE_ACCOUNT_JSON (recommended) or GSC_CLIENT_ID, GSC_CLIENT_SECRET, and GSC_REFRESH_TOKEN.",
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const webmasters = google.webmasters({ version: "v3", auth: oauth2Client });
  return { webmasters, siteUrl };
}

/**
 * Top queries from Google Search Console (last 28 days), optionally filtered to one page URL.
 * Prefer **service account** (`GSC_SERVICE_ACCOUNT_JSON`): add the service account email as a user
 * on the property in Search Console (Owner or Full user).
 */
export async function fetchSearchConsoleTopQueries(options: {
  pageUrl?: string;
  rowLimit?: number;
}): Promise<GscQueryRow[]> {
  const { webmasters, siteUrl } = await getAuthenticatedWebmasters();

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 28);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  type FilterGroup = {
    filters: Array<{
      dimension: string;
      operator: string;
      expression: string;
    }>;
  };

  const requestBody: {
    startDate: string;
    endDate: string;
    dimensions: string[];
    rowLimit: number;
    dimensionFilterGroups?: FilterGroup[];
  } = {
    startDate,
    endDate,
    dimensions: ["query"],
    rowLimit: Math.min(options.rowLimit ?? 50, 25000),
  };

  const page = options.pageUrl?.trim();
  if (page) {
    requestBody.dimensionFilterGroups = [
      {
        filters: [
          {
            dimension: "page",
            operator: "equals",
            expression: page,
          },
        ],
      },
    ];
  }

  const response = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody,
  });

  const rows = response.data.rows ?? [];
  return rows
    .map((row) => ({
      query: row.keys?.[0] ?? "",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
    }))
    .filter((r) => r.query.length > 0)
    .sort(
      (a, b) =>
        b.clicks - a.clicks || b.impressions - a.impressions || a.query.localeCompare(b.query),
    );
}
