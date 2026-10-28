import { normalizeSiteUrl, requestJson } from "./http";
import { PublishError, type PublishAdapter, type PublishConn } from "./types";

const NAME = "Shopify";
const VERSION = "2024-10";

function base(conn: PublishConn) {
  return new URL(normalizeSiteUrl(conn.siteUrl, { allowBareHost: true })).origin;
}

function headers(conn: PublishConn) {
  const token = conn.credentials.accessToken;
  if (!token) throw new PublishError("Shopify Admin API access token is required");
  return { "X-Shopify-Access-Token": token, Accept: "application/json" };
}

async function resolveBlogId(conn: PublishConn, origin: string): Promise<string> {
  const configured = conn.settings.blogId?.trim();
  if (configured) return configured;
  const data = await requestJson<{ blogs: { id: number }[] }>(
    NAME,
    `${origin}/admin/api/${VERSION}/blogs.json`,
    { headers: headers(conn) },
  );
  const first = data.blogs?.[0];
  if (!first) throw new PublishError("No blog found in this Shopify store - create one under Online Store > Blog posts");
  return String(first.id);
}

export const shopify: PublishAdapter = {
  async testConnection(conn) {
    const origin = base(conn);
    const shop = await requestJson<{ shop?: { name?: string } }>(NAME, `${origin}/admin/api/${VERSION}/shop.json`, {
      headers: headers(conn),
    });
    const blogId = await resolveBlogId(conn, origin);
    return { ok: true, settings: { blogId }, info: shop.shop?.name ? `Connected to ${shop.shop.name}` : undefined };
  },
  async publishArticle(conn, input) {
    const origin = base(conn);
    const blogId = await resolveBlogId(conn, origin);
    const summary = input.excerpt || input.metaDescription;
    const data = await requestJson<{ article: { id: number; handle: string } }>(
      NAME,
      `${origin}/admin/api/${VERSION}/blogs/${encodeURIComponent(blogId)}/articles.json`,
      {
        method: "POST",
        headers: { ...headers(conn), "Content-Type": "application/json" },
        body: JSON.stringify({
          article: {
            title: input.title,
            body_html: input.html,
            published: input.status === "publish",
            ...(summary ? { summary_html: `<p>${escapeHtml(summary)}</p>` } : {}),
            ...(input.tags?.length ? { tags: input.tags.join(", ") } : {}),
            ...(input.slug ? { handle: input.slug } : {}),
          },
        }),
      },
    );
    const a = data.article;
    const handle = new URL(origin).hostname.replace(/\.myshopify\.com$/, "");
    // Storefront URLs use the blog's handle, not its numeric id.
    const blog = await requestJson<{ blog: { handle: string } }>(
      NAME,
      `${origin}/admin/api/${VERSION}/blogs/${encodeURIComponent(blogId)}.json?fields=handle`,
      { headers: headers(conn) },
    ).catch(() => null);
    return {
      remoteId: String(a.id),
      url: `${origin}/blogs/${blog?.blog.handle ?? blogId}/${a.handle}`,
      editUrl: `https://admin.shopify.com/store/${handle}/content/articles/${a.id}`,
    };
  },
};

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
