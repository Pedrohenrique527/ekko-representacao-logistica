import { cookies } from "next/headers";

export const SESSION_COOKIE = "ekko_session";
const encoder = new TextEncoder();

export type AuthenticatedUser = {
  email: string;
  name: string;
  role: "ADMIN";
};

type SessionPayload = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

const toBase64Url = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64url");
const fromBase64Url = (value: string) => new Uint8Array(Buffer.from(value, "base64url"));

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
  return difference === 0;
}

function configuredEmail() {
  return String(process.env.APP_LOGIN_EMAIL ?? "").trim().toLowerCase();
}

function authSecret() {
  return String(process.env.AUTH_SECRET ?? "");
}

async function hmac(value: string) {
  const secret = authSecret();
  if (secret.length < 32) throw new Error("AUTH_SECRET não configurado.");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function verifyCredentials(email: string, password: string) {
  const allowedEmail = configuredEmail();
  const storedHash = String(process.env.APP_LOGIN_PASSWORD_HASH ?? "");
  if (!allowedEmail || !storedHash || email.trim().toLowerCase() !== allowedEmail) return false;

  const [algorithm, iterationsText, saltText, expectedText] = storedHash.split(":");
  const iterations = Number(iterationsText);
  if (algorithm !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100_000 || !saltText || !expectedText) return false;

  try {
    const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const derived = new Uint8Array(await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", iterations, salt: fromBase64Url(saltText) },
      material,
      256,
    ));
    return constantTimeEqual(derived, fromBase64Url(expectedText));
  } catch {
    return false;
  }
}

export async function createSessionToken(email: string, remember: boolean) {
  const now = Date.now();
  const duration = remember ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
  const payload: SessionPayload = { email: email.trim().toLowerCase(), issuedAt: now, expiresAt: now + duration };
  const encoded = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmac(encoded));
  return { token: `${encoded}.${signature}`, maxAge: Math.floor(duration / 1000) };
}

export async function verifySessionToken(token: string | undefined): Promise<AuthenticatedUser | null> {
  if (!token) return null;
  const [encoded, signatureText] = token.split(".");
  if (!encoded || !signatureText) return null;

  try {
    const expected = await hmac(encoded);
    if (!constantTimeEqual(expected, fromBase64Url(signatureText))) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as SessionPayload;
    if (!payload.email || payload.email !== configuredEmail() || payload.expiresAt <= Date.now()) return null;
    return { email: payload.email, name: "Representação Ekko", role: "ADMIN" };
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
