/**
 * Optional auto-post integrations. Set env vars to enable; otherwise callers get `skipped: true`.
 * @see docs/distribution-engine.md for OAuth setup (Twitter / X, LinkedIn, Pinterest).
 */

export type PostResult = {
  platform: "twitter" | "linkedin" | "pinterest";
  ok: boolean;
  skipped?: boolean;
  externalId?: string;
  error?: string;
};

/** Twitter / X API v2 — requires OAuth 2.0 user access token with tweet.write scope. */
export async function postTwitterThread(tweets: string[]): Promise<PostResult[]> {
  const token = process.env.TWITTER_ACCESS_TOKEN?.trim();
  if (!token || tweets.length === 0) {
    return tweets.map(() => ({
      platform: "twitter" as const,
      ok: false,
      skipped: true,
      error: "TWITTER_ACCESS_TOKEN not configured",
    }));
  }

  const results: PostResult[] = [];
  let replyToId: string | undefined;

  for (const text of tweets) {
    const body: Record<string, unknown> = { text };
    if (replyToId) {
      body.reply = { in_reply_to_tweet_id: replyToId };
    }
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: { id: string };
      errors?: { message: string }[];
    };
    if (!res.ok) {
      results.push({
        platform: "twitter",
        ok: false,
        error: json.errors?.[0]?.message ?? res.statusText,
      });
      break;
    }
    replyToId = json.data?.id;
    results.push({ platform: "twitter", ok: true, externalId: json.data?.id });
  }

  return results;
}

/** LinkedIn UGC Posts — requires LI_ACCESS_TOKEN + LI_AUTHOR_URN (person or organization). */
export async function postLinkedInArticle(bodyText: string): Promise<PostResult> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const author = process.env.LINKEDIN_AUTHOR_URN?.trim();
  if (!token || !author) {
    return {
      platform: "linkedin",
      ok: false,
      skipped: true,
      error: "LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN missing",
    };
  }

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: bodyText.slice(0, 3000) },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    return { platform: "linkedin", ok: false, error: t.slice(0, 400) };
  }
  const id = res.headers.get("x-restli-id") ?? undefined;
  return { platform: "linkedin", ok: true, externalId: id };
}

/** Pinterest — requires PINTEREST_ACCESS_TOKEN + board id. Creates a Pin linking to your article. */
export async function postPinterestPin(input: {
  title: string;
  description: string;
  link: string;
  /** Optional image URL — Pinterest requires media for standard pins. */
  imageUrl?: string;
}): Promise<PostResult> {
  const token = process.env.PINTEREST_ACCESS_TOKEN?.trim();
  const boardId = process.env.PINTEREST_BOARD_ID?.trim();
  if (!token || !boardId) {
    return {
      platform: "pinterest",
      ok: false,
      skipped: true,
      error: "PINTEREST_ACCESS_TOKEN or PINTEREST_BOARD_ID missing",
    };
  }

  const imageUrl = input.imageUrl?.trim() || process.env.PINTEREST_DEFAULT_IMAGE_URL?.trim();
  if (!imageUrl) {
    return {
      platform: "pinterest",
      ok: false,
      skipped: true,
      error: "Provide imageUrl or PINTEREST_DEFAULT_IMAGE_URL for Pin media",
    };
  }

  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title: input.title.slice(0, 100),
      description: input.description.slice(0, 500),
      link: input.link,
      media_source: {
        source_type: "image_url",
        url: imageUrl,
      },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    return { platform: "pinterest", ok: false, error: t.slice(0, 400) };
  }
  const json = (await res.json()) as { id?: string };
  return { platform: "pinterest", ok: true, externalId: json.id };
}
