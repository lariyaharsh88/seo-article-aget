import { normalizeSiteUrl, requestJson } from "./http";
import { PublishError, type PublishAdapter, type PublishConn } from "./types";

const NAME = "WordPress";

function auth(conn: PublishConn) {
  const { username, appPassword } = conn.credentials;
  if (!username || !appPassword) throw new PublishError("WordPress username and application password are required");
  const token = Buffer.from(`${username}:${appPassword.replace(/\s+/g, "")}`).toString("base64");
  return { Authorization: `Basic ${token}`, Accept: "application/json" };
}

async function resolveTagIds(base: string, headers: Record<string, string>, tags: string[]): Promise<number[]> {
  const ids: number[] = [];
  for (const name of tags.slice(0, 10)) {
    try {
      const found = await requestJson<{ id: number; name: string }[]>(
        NAME,
        `${base}/wp-json/wp/v2/tags?search=${encodeURIComponent(name)}&per_page=10`,
        { headers },
      );
      const match = found.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (match) {
        ids.push(match.id);
        continue;
      }
      const created = await requestJson<{ id: number }>(NAME, `${base}/wp-json/wp/v2/tags`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      ids.push(created.id);
    } catch {
      // tags are best-effort
    }
  }
  return ids;
}

export const wordpress: PublishAdapter = {
  async testConnection(conn) {
    const base = normalizeSiteUrl(conn.siteUrl);
    const me = await requestJson<{ name?: string }>(NAME, `${base}/wp-json/wp/v2/users/me?context=edit`, {
      headers: auth(conn),
    });
    return { ok: true, info: me.name ? `Connected as ${me.name}` : undefined };
  },
  async publishArticle(conn, input) {
    const base = normalizeSiteUrl(conn.siteUrl);
    const headers = auth(conn);
    const tagIds = input.tags?.length ? await resolveTagIds(base, headers, input.tags) : [];
    const post = await requestJson<{ id: number; link: string }>(NAME, `${base}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        content: input.html,
        status: input.status === "publish" ? "publish" : "draft",
        ...(input.slug ? { slug: input.slug } : {}),
        ...(input.excerpt || input.metaDescription ? { excerpt: input.excerpt || input.metaDescription } : {}),
        ...(tagIds.length ? { tags: tagIds } : {}),
      }),
    });
    return {
      remoteId: String(post.id),
      url: post.link,
      editUrl: `${base}/wp-admin/post.php?post=${post.id}&action=edit`,
    };
  },
};
