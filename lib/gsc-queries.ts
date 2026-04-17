import { google } from "googleapis";

/** Extract Google API error text and attach a hint for common permission issues. */
export function parseGscApiError(e: unknown): {
  message: string;
  hint?: string;
  status: number;
} {
  let message =
    e instanceof Error ? e.message : "Search Console request failed";

  const gaxios = e as {
    response?: { status?: number; data?: { error?: { message?: string } } };
    errors?: Array<{ message?: string }>;
  };
  const apiMsg = gaxios.response?.data?.error?.message;
  if (typeof apiMsg === "string" && apiMsg.trim()) {
    message = apiMsg.trim();
  } else if (Array.isArray(gaxios.errors) && gaxios.errors[0]?.message) {
    message = String(gaxios.errors[0].message);
  }

  const lower = message.toLowerCase();
  const permissionLike =
    lower.includes("permission") ||
    lower.includes("not authorized") ||
    lower.includes("does not have") ||
    gaxios.response?.status === 403;

  if (permissionLike) {
    return {
      message,
      status: 403,
      hint:
        "Open Google Search Console for this property → Settings → Users and permissions → Add user. Paste the service account email from your JSON (the client_email field) and grant Full or Owner. In Vercel, set GSC_SITE_URL to match that property exactly—same protocol, www or not, trailing slash, or use sc-domain:yourdomain.com if the property is a Domain property. Mismatched URLs count as different properties.",
    };
  }

  return { message, status: gaxios.response?.status && gaxios.response.status >= 400 ? gaxios.response.status : 502 };
}

export interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
}

/** Query row with CTR and average position (Search Analytics API). */
export interface GscQueryMetricRow {
  query: string;
  clicks: number;
  impressions: number;
  /** 0–1 (e.g. 0.035 = 3.5%). */
  ctr: number;
  /** Average position in SERP (approximate). */
  position: number;
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

export interface GscFetchResult {
  details: GscQueryRow[];
  /** Shown when results are empty or when falling back to site-wide queries */
  note?: string;
}

function mapAnalyticsRows(
  rows:
    | Array<{
        keys?: string[] | null;
        clicks?: number | null;
        impressions?: number | null;
      }>
    | null
    | undefined,
): GscQueryRow[] {
  return (rows ?? [])
    .map((row) => ({
      query: row.keys?.[0] ?? "",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
    }))
    .filter((r) => r.query.length > 0)
    .sort(
      (a, b) =>
        b.clicks - a.clicks ||
        b.impressions - a.impressions ||
        a.query.localeCompare(b.query),
    );
}

function mapAnalyticsRowsWithMetrics(
  rows:
    | Array<{
        keys?: string[] | null;
        clicks?: number | null;
        impressions?: number | null;
        ctr?: number | null;
        position?: number | null;
      }>
    | null
    | undefined,
): GscQueryMetricRow[] {
  return (rows ?? [])
    .map((row) => ({
      query: row.keys?.[0] ?? "",
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: typeof row.ctr === "number" ? row.ctr : 0,
      position: typeof row.position === "number" ? row.position : 0,
    }))
    .filter((r) => r.query.length > 0)
    .sort(
      (a, b) =>
        b.impressions - a.impressions ||
        a.position - b.position ||
        a.query.localeCompare(b.query),
    );
}

/** GSC "equals" filter is strict — try a few normalizations. */
function pageUrlFilterVariants(pageUrl: string): string[] {
  const u = pageUrl.trim();
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (s: string) => {
    const t = s.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  };
  add(u);
  add(u.endsWith("/") ? u.slice(0, -1) : `${u}/`);
  try {
    const parsed = new URL(u);
    const href = parsed.href;
    add(href);
    add(href.endsWith("/") ? href.slice(0, -1) : `${href}/`);
  } catch {
    /* ignore */
  }
  return out;
}

/**
 * Top queries from Google Search Console (last 28 days), optionally filtered to one page URL.
 * If a page filter returns no rows, tries URL variants, then site-wide top queries with a note.
 */
export async function fetchSearchConsoleTopQueries(options: {
  pageUrl?: string;
  rowLimit?: number;
}): Promise<GscFetchResult> {
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

  const rowLimit = Math.min(options.rowLimit ?? 50, 25000);

  const baseBody: {
    startDate: string;
    endDate: string;
    dimensions: string[];
    rowLimit: number;
    dimensionFilterGroups?: FilterGroup[];
  } = {
    startDate,
    endDate,
    dimensions: ["query"],
    rowLimit,
  };

  const run = async (
    body: typeof baseBody,
  ): Promise<GscQueryRow[]> => {
    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: body,
    });
    return mapAnalyticsRows(response.data.rows);
  };

  const page = options.pageUrl?.trim();

  if (!page) {
    const details = await run({ ...baseBody });
    return {
      details,
      note:
        details.length === 0
          ? "No search queries in the last 28 days for this property (or data not yet processed)."
          : undefined,
    };
  }

  for (const expression of pageUrlFilterVariants(page)) {
    const body: typeof baseBody = {
      ...baseBody,
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "page",
              operator: "equals",
              expression,
            },
          ],
        },
      ],
    };
    const details = await run(body);
    if (details.length > 0) {
      return { details };
    }
  }

  const siteWide = await run({ ...baseBody });
  return {
    details: siteWide,
    note:
      siteWide.length > 0
        ? "No query rows matched this page URL in the last 28 days (GSC stores an exact URL). Showing site-wide top queries instead. Tip: open Search Console → Performance → Pages, copy the page URL from there, or clear the reference URL to always load site-wide."
        : "No query data for this page or for the whole site in the last 28 days. Confirm the URL matches Performance → Pages, or wait for data processing.",
  };
}

export type GscDateRange = { startDate: string; endDate: string; days: number };

function defaultLastNDaysRange(days: number): GscDateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    days,
  };
}

/**
 * Per-query **impressions**, **CTR**, and average **position** for a single page (last N days).
 * Use for SEO feedback loops and content refresh prioritization.
 */
export async function fetchSearchConsolePageQueryMetrics(options: {
  pageUrl: string;
  rowLimit?: number;
  /** Default 28 to match Search Console performance default window. */
  days?: number;
}): Promise<{
  rows: GscQueryMetricRow[];
  note?: string;
  dateRange: GscDateRange;
}> {
  const { webmasters, siteUrl } = await getAuthenticatedWebmasters();
  const days = options.days ?? 28;
  const { startDate, endDate } = defaultLastNDaysRange(days);
  const rowLimit = Math.min(options.rowLimit ?? 250, 25000);

  type FilterGroup = {
    filters: Array<{
      dimension: string;
      operator: string;
      expression: string;
    }>;
  };

  const baseBody: {
    startDate: string;
    endDate: string;
    dimensions: string[];
    rowLimit: number;
  } = {
    startDate,
    endDate,
    dimensions: ["query"],
    rowLimit,
  };

  const run = async (
    body: typeof baseBody & { dimensionFilterGroups?: FilterGroup[] },
  ): Promise<GscQueryMetricRow[]> => {
    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: body,
    });
    return mapAnalyticsRowsWithMetrics(response.data?.rows);
  };

  for (const expression of pageUrlFilterVariants(options.pageUrl.trim())) {
    const body = {
      ...baseBody,
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "page",
              operator: "equals",
              expression,
            },
          ],
        },
      ],
    };
    const rows = await run(body);
    if (rows.length > 0) {
      return {
        rows,
        dateRange: { startDate, endDate, days },
      };
    }
  }

  return {
    rows: [],
    note:
      "No query rows matched this page URL for the selected window. Use the exact URL from GSC Performance → Pages.",
    dateRange: { startDate, endDate, days },
  };
}
