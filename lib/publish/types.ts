export type PublishPlatform = "wordpress" | "ghost" | "webflow" | "shopify";

export const PUBLISH_PLATFORMS: PublishPlatform[] = ["wordpress", "ghost", "webflow", "shopify"];

export type PublishSettings = Record<string, string | undefined>;

export interface PublishConn {
  platform: PublishPlatform;
  siteUrl: string;
  credentials: Record<string, string>;
  settings: PublishSettings;
}

export interface PublishInput {
  title: string;
  html: string;
  markdown: string;
  slug?: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  status: "draft" | "publish";
}

export interface PublishResult {
  remoteId: string;
  url: string;
  editUrl?: string;
}

export interface TestResult {
  ok: true;
  /** Settings resolved during test (e.g. Shopify blogId) to persist. */
  settings?: PublishSettings;
  info?: string;
}

export interface PublishAdapter {
  testConnection(conn: PublishConn): Promise<TestResult>;
  publishArticle(conn: PublishConn, input: PublishInput): Promise<PublishResult>;
}

export class PublishError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
