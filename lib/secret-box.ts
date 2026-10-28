import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getKey(): Buffer {
  const raw =
    process.env.CREDENTIALS_ENCRYPTION_KEY?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (!raw) {
    throw new Error(
      "Credential encryption is not configured: set CREDENTIALS_ENCRYPTION_KEY (or NEXTAUTH_SECRET).",
    );
  }
  return createHash("sha256").update(raw).digest();
}

/** Encrypts a JSON-serializable value. Format: v1:<iv b64>:<tag b64>:<ciphertext b64> */
export function encryptJson(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptJson<T = unknown>(payload: string): T {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Unsupported secret format");
  const [, ivB64, tagB64, ctB64] = parts;
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]);
  return JSON.parse(pt.toString("utf8")) as T;
}
