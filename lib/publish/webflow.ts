import { normalizeSiteUrl, requestJson } from "./http";
import { PublishError, type PublishAdapter, type PublishConn } from "./types";

const NAME = "Webflow";
const API = "https://api.webflow.com/v2";

function cfg(conn: PublishConn) {
  const token = conn.credentials.apiToken;
  if (!token) throw new PublishError("Webflow API token is required");
  const collectionId = conn.settings.collectionId?.trim();
  if (!collectionId || !/^[a-zA-Z0-9]+$/.test(collectionId)) {
    throw new PublishError("Webflow collection ID is required (Settings: collectionId)");
  }
  return {
    collectionId,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    bodyField: conn.settings.bodyField?.trim() || "post-body",
    nameField: conn.settings.nameField?.trim() || "name",
    slugField: conn.settings.slugField?.trim() || "slug",
    summaryField: conn.settings.summaryField?.trim() || "",
  };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80) || `post-${Date.now()}`;
}

export const webflow: PublishAdapter = {
  async testConnection(conn) {
    const c = cfg(conn);
    const col = await requestJson<{ displayName?: string }>(NAME, `${API}/collections/${c.collectionId}`, {
      headers: c.headers,
    });
    return { ok: true, info: col.displayName ? `Collection: ${col.displayName}` : undefined };
  },
  async publishArticle(conn, input) {
    const c = cfg(conn);
    const slug = input.slug ? slugify(input.slug) : slugify(input.title);
    const fieldData: Record<string, string> = {
      [c.nameField]: input.title,
      [c.slugField]: slug,
      [c.bodyField]: input.html,
    };
    const summary = input.excerpt || input.metaDescription;
    if (c.summaryField && summary) fieldData[c.summaryField] = summary;
    const item = await requestJson<{ id: string }>(NAME, `${API}/collections/${c.collectionId}/items`, {
      method: "POST",
      headers: { ...c.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ isDraft: input.status !== "publish", isArchived: false, fieldData }),
    });
    if (input.status === "publish") {
      await requestJson(NAME, `${API}/collections/${c.collectionId}/items/publish`, {
        method: "POST",
        headers: { ...c.headers, "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: [item.id] }),
      });
    }
    const site = conn.siteUrl?.trim() ? normalizeSiteUrl(conn.siteUrl, { allowBareHost: true }) : "";
    return {
      remoteId: item.id,
      url: site ? `${site}/${conn.settings.collectionPath?.trim() || "blog"}/${slug}` : "",
    };
  },
};
