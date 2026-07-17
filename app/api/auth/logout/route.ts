import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { getAuthenticatedUser, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  const connection = process.env.DATABASE_URL;
  if (user && connection) {
    try {
      const sql = neon(connection);
      const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
      const userAgent = request.headers.get("user-agent");
      await sql`
        INSERT INTO "AuditLog" ("id", "action", "entity", "metadata", "ipAddress", "userAgent", "userId", "createdAt")
        SELECT ${crypto.randomUUID()}, 'LOGOUT', 'Session', ${JSON.stringify({ email: user.email })}::jsonb,
          ${forwardedFor}, ${userAgent}, "id", NOW()
        FROM "User"
        WHERE LOWER("email") = ${user.email.toLowerCase()}
        LIMIT 1
      `;
    } catch (error) {
      console.error("Logout audit failed", error);
    }
  }
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
