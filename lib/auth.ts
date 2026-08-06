import { cookies } from "next/headers";

export const SESSION_COOKIE = "ekko_session";
const encoder = new TextEncoder();

export type UserRole = "ADMIN" | "USER" | "MANAGER" | "VIEWER";

export type AuthenticatedUser = {
  email: string;
  name: string;
  role: UserRole;
};

type ConfiguredUser = AuthenticatedUser & { passwordHash: string };

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

function normalizeUser(value: unknown): ConfiguredUser | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const email = String(item.email ?? "").trim().toLowerCase();
  const passwordHash = String(item.passwordHash ?? "").trim();
  const role = String(item.role ?? "USER").trim().toUpperCase() as UserRole;
  if (!email || !passwordHash || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!["ADMIN", "USER", "MANAGER", "VIEWER"].includes(role)) return null;
  return {
    email,
    passwordHash,
    role,
    name: String(item.name ?? email.split("@")[0]).trim() || email,
  };
}

function configuredUsers(): ConfiguredUser[] {
  const raw = String(process.env.APP_USERS_JSON ?? "").trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const users = parsed.map(normalizeUser).filter((user): user is ConfiguredUser => Boolean(user));
        if (users.length) return users;
      }
    } catch {
      console.error("APP_USERS_JSON inválido; usando o acesso legado.");
    }
  }

  const legacy = normalizeUser({
    email: process.env.APP_LOGIN_EMAIL,
    passwordHash: process.env.APP_LOGIN_PASSWORD_HASH,
    name: "Representação Ekko",
    role: "ADMIN",
  });
  return legacy ? [legacy] : [];
}

function configuredUser(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return configuredUsers().find((user) => user.email === normalizedEmail) ?? null;
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
  const user = configuredUser(email);
  if (!user) return null;

  const [algorithm, iterationsText, saltText, expectedText] = user.passwordHash.split(":");
  const iterations = Number(iterationsText);
  if (algorithm !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100_000 || !saltText || !expectedText) return null;

  try {
    const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const derived = new Uint8Array(await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", iterations, salt: fromBase64Url(saltText) },
      material,
      256,
    ));
    return constantTimeEqual(derived, fromBase64Url(expectedText)) ? user : null;
  } catch {
    return null;
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
    if (!payload.email || payload.expiresAt <= Date.now()) return null;
    const user = configuredUser(payload.email);
    return user ? { email: user.email, name: user.name, role: user.role } : null;
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
