import { getSiteUrl } from "@/lib/site-url";

const TELEGRAM_API = "https://api.telegram.org";

function escapeTelegramHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Strip markdown-ish content to a short plain teaser (no images). */
export function markdownToPlainTeaser(md: string, maxLen: number): string {
  const raw = md.replace(/```[\s\S]*?```/g, " ");
  const stripped = raw
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_[\]()~`|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= maxLen) return stripped;
  return `${stripped.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

export type TelegramInlineButton = { text: string; url: string };

async function sendTelegramMessage(opts: {
  botToken: string;
  chatId: string;
  html: string;
  buttons: TelegramInlineButton[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = `${TELEGRAM_API}/bot${opts.botToken}/sendMessage`;
  const body = {
    chat_id: opts.chatId,
    text: opts.html,
    parse_mode: "HTML" as const,
    disable_web_page_preview: true,
    reply_markup:
      opts.buttons.length > 0
        ? {
            inline_keyboard: opts.buttons.map((b) => [
              { text: b.text.slice(0, 64), url: b.url },
            ]),
          }
        : undefined,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json()) as { ok?: boolean; description?: string };
    if (!res.ok || !json.ok) {
      return {
        ok: false,
        error: json.description || res.statusText || "Telegram API error",
      };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sendMessage failed";
    return { ok: false, error: msg };
  }
}

function blogTelegramEnv():
  | { token: string; chatId: string; hubLabel: string }
  | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_BLOG_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  const hubLabel =
    process.env.TELEGRAM_BLOG_HUB_BUTTON_TEXT?.trim() || "RankFlowHQ Blog";
  return { token, chatId, hubLabel };
}

function newsTelegramEnv():
  | { token: string; chatId: string; hubLabel: string }
  | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_NEWS_CHAT_ID?.trim();
  if (!token || !chatId) return null;
  const hubLabel =
    process.env.TELEGRAM_NEWS_HUB_BUTTON_TEXT?.trim() || "RankFlowHQ News";
  return { token, chatId, hubLabel };
}

function newsPublicBaseUrl(): string {
  const fromEnv = process.env.TELEGRAM_NEWS_BASE_URL?.trim();
  if (fromEnv) {
    const withProto = /^https?:\/\//i.test(fromEnv) ? fromEnv : `https://${fromEnv}`;
    return withProto.replace(/\/$/, "");
  }
  return "https://education.rankflowhq.com";
}

/** Fire-and-forget: new published blog post announcement (text + inline buttons, no image). */
export function notifyTelegramNewBlogPost(opts: {
  title: string;
  excerpt: string | null;
  content: string;
  slug: string;
}): void {
  const cfg = blogTelegramEnv();
  if (!cfg) return;

  const base = getSiteUrl().replace(/\/$/, "");
  const articleUrl = `${base}/blogs/${encodeURIComponent(opts.slug)}`;
  const hubUrl = `${base}/blogs`;

  const blurb =
    opts.excerpt?.trim() ||
    markdownToPlainTeaser(opts.content, 320) ||
    "New post on RankFlowHQ.";
  const html = `<b>${escapeTelegramHtml(opts.title)}</b>\n\n${escapeTelegramHtml(blurb)}`;

  void sendTelegramMessage({
    botToken: cfg.token,
    chatId: cfg.chatId,
    html,
    buttons: [
      { text: "Read More", url: articleUrl },
      { text: cfg.hubLabel.slice(0, 64), url: hubUrl },
    ],
  }).then((r) => {
    if (!r.ok) {
      console.error("[telegram] blog channel:", r.error);
    }
  });
}

/** Fire-and-forget: repurposed news article ready (text + inline buttons, no image). */
export function notifyTelegramNewsRepurposed(opts: {
  title: string;
  repurposedMarkdown: string;
  slug: string;
}): void {
  const cfg = newsTelegramEnv();
  if (!cfg) return;

  const base = newsPublicBaseUrl();
  const articleUrl = `${base}/news/${encodeURIComponent(opts.slug)}`;
  const hubUrl = `${base}/news`;

  const blurb =
    markdownToPlainTeaser(opts.repurposedMarkdown, 320) ||
    "New education news article on RankFlowHQ.";
  const html = `<b>${escapeTelegramHtml(opts.title)}</b>\n\n${escapeTelegramHtml(blurb)}`;

  void sendTelegramMessage({
    botToken: cfg.token,
    chatId: cfg.chatId,
    html,
    buttons: [
      { text: "Read More", url: articleUrl },
      { text: cfg.hubLabel.slice(0, 64), url: hubUrl },
    ],
  }).then((r) => {
    if (!r.ok) {
      console.error("[telegram] news channel:", r.error);
    }
  });
}
