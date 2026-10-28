import { createHmac } from "node:crypto";
import { normalizeSiteUrl, requestJson } from "./http";
import { PublishError, type PublishAdapter, type PublishConn } from "./types";

const NAME = "Ghost";

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** Builds a Ghost Admin API JWT (HS256, aud /admin/, 5 min expiry). */
export function buildGhostAdminToken(adminApiKey: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const [id, secret] = (adminApiKey || "").trim().split(":");
  if (!id || !secret || !/^[0-9a-f]+$/i.test(secret)) {
    throw new PublishError("Ghost Admin API key must look like <id>:<hex secret>");
  }
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id }));
  const payload = b64url(JSON.stringify({ iat: nowSec, exp: nowSec + 300, aud: "/admin/" }));
  const sig = b64url(createHmac("sha256", Buffer.from(secret, "hex")).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

function headers(conn: PublishConn) {
  return {
    Authorization: `Ghost ${buildGhostAdminToken(conn.credentials.adminApiKey)}`,
    "Accept-Version": "v5.0",
    Accept: "application/json",
  };
}

export const ghost: PublishAdapter = {
  async testConnection(conn) {
    const base = normalizeSiteUrl(conn.siteUrl);
    const data = await requestJson<{ site?: { title?: string } }>(NAME, `${base}/ghost/api/admin/site/`, {
      headers: headers(conn),
    });
    return { ok: true, info: data.site?.title ? `Connected to ${data.site.title}` : undefined };
  },
  async publishArticle(conn, input) {
    const base = normalizeSiteUrl(conn.siteUrl);
    const data = await requestJson<{ posts: { id: string; url: string }[] }>(
      NAME,
      `${base}/ghost/api/admin/posts/?source=html`,
      {
        method: "POST",
        headers: { ...headers(conn), "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: [
            {
              title: input.title,
              html: input.html,
              status: input.status === "publish" ? "published" : "draft",
              ...(input.slug ? { slug: input.slug } : {}),
              ...(input.excerpt ? { custom_excerpt: input.excerpt.slice(0, 300) } : {}),
              ...(input.metaTitle ? { meta_title: input.metaTitle.slice(0, 300) } : {}),
              ...(input.metaDescription ? { meta_description: input.metaDescription.slice(0, 500) } : {}),
              ...(input.tags?.length ? { tags: input.tags.map((name) => ({ name })) } : {}),
            },
          ],
        }),
      },
    );
    const post = data.posts?.[0];
    if (!post) throw new PublishError("Ghost returned no post", 502);
    return { remoteId: post.id, url: post.url, editUrl: `${base}/ghost/#/editor/post/${post.id}` };
  },
};
